import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { JWTService } from './JWTService';

describe('JWTService', () => {
    const jwtService = new JWTService('test-secret-key-for-testing', '24h');

    describe('Unit Tests', () => {
        it('should sign a token with userId and role', () => {
            const payload = { userId: 'user-123', role: 'USER' };
            const token = jwtService.sign(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format
        });

        it('should verify and decode a valid token', () => {
            const payload = { userId: 'user-456', role: 'SUPER_ADMIN' };
            const token = jwtService.sign(payload);

            const decoded = jwtService.verify(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.role).toBe(payload.role);
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeDefined();
        });

        it('should throw on invalid token', () => {
            expect(() => jwtService.verify('invalid-token')).toThrow('Invalid token');
        });

        it('should throw on tampered token', () => {
            const payload = { userId: 'user-789', role: 'USER' };
            const token = jwtService.sign(payload);
            const tamperedToken = token.slice(0, -5) + 'xxxxx';

            expect(() => jwtService.verify(tamperedToken)).toThrow();
        });
    });

    describe('Property-Based Tests', () => {
        it('Feature: ai-model-evaluation-platform, Property 2: JWT Round-Trip Consistency', async () => {
            const userIdArb = fc.uuid();
            const roleArb = fc.constantFrom('SUPER_ADMIN', 'USER');

            await fc.assert(
                fc.asyncProperty(
                    userIdArb,
                    roleArb,
                    async (userId, role) => {
                        const payload = { userId, role };

                        // Generate JWT token
                        const token = jwtService.sign(payload);

                        // Decode JWT
                        const decoded = jwtService.verify(token);

                        // Property 2a: decoded userId and role claims SHALL match registered user
                        expect(decoded.userId).toBe(userId);
                        expect(decoded.role).toBe(role);

                        // Property 2b: token SHALL be verifiable with signing secret
                        expect(() => jwtService.verify(token)).not.toThrow();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

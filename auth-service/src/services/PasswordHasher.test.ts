import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PasswordHasher } from './PasswordHasher';

describe('PasswordHasher', () => {
    const hasher = new PasswordHasher();

    describe('Unit Tests', () => {
        it('should hash a password', async () => {
            const password = 'testPassword123';
            const hash = await hasher.hash(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.startsWith('$2b$')).toBe(true);
        });

        it('should compare password correctly - matching', async () => {
            const password = 'testPassword123';
            const hash = await hasher.hash(password);
            const result = await hasher.compare(password, hash);

            expect(result).toBe(true);
        });

        it('should compare password correctly - non-matching', async () => {
            const password = 'testPassword123';
            const hash = await hasher.hash(password);
            const result = await hasher.compare('wrongPassword', hash);

            expect(result).toBe(false);
        });

        it('should produce different hashes for same password', async () => {
            const password = 'testPassword123';
            const hash1 = await hasher.hash(password);
            const hash2 = await hasher.hash(password);

            expect(hash1).not.toBe(hash2); // Due to salt
        });
    });

    describe('Property-Based Tests', () => {
        it('Feature: ai-model-evaluation-platform, Property 1: Password Hashing Integrity', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 8, maxLength: 64 }),
                    async (password) => {
                        const hash = await hasher.hash(password);

                        // Property 1a: Stored password_hash SHALL NOT equal plaintext password
                        expect(hash).not.toBe(password);

                        // Property 1b: bcrypt.compare(password, password_hash) SHALL return true
                        const isMatch = await hasher.compare(password, hash);
                        expect(isMatch).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

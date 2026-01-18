import bcrypt from 'bcryptjs';

/**
 * PasswordHasher class
 * Handles password hashing and verification using bcrypt
 */
export class PasswordHasher {
    private readonly saltRounds: number;

    constructor(saltRounds: number = 10) {
        this.saltRounds = saltRounds;
    }

    /**
     * Hash a plaintext password using bcrypt
     * @param password - The plaintext password to hash
     * @returns Promise resolving to the hashed password
     */
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compare a plaintext password with a hash
     * @param password - The plaintext password to verify
     * @param hash - The bcrypt hash to compare against
     * @returns Promise resolving to true if password matches, false otherwise
     */
    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

// Export singleton instance
export const passwordHasher = new PasswordHasher();

export default PasswordHasher;

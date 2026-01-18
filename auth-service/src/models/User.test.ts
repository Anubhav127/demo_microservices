import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { User, UserRole } from './User';
import { sequelize } from '../config/database';

/**
 * User Model Unit Tests
 * Tests the User model creation, validation, and constraints
 */
describe('User Model', () => {
  // Setup: Sync database before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Clear users table before each test
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('User Creation', () => {
    it('should create a user with valid attributes', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
        role: UserRole.USER,
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashed_password_123');
      expect(user.role).toBe(UserRole.USER);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create a user with SUPER_ADMIN role', async () => {
      const user = await User.create({
        email: 'admin@example.com',
        passwordHash: 'hashed_password_456',
        role: UserRole.SUPER_ADMIN,
      });

      expect(user.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should default to USER role when role is not specified', async () => {
      const user = await User.create({
        email: 'default@example.com',
        passwordHash: 'hashed_password_789',
      });

      expect(user.role).toBe(UserRole.USER);
    });

    it('should auto-generate UUID for id field', async () => {
      const user = await User.create({
        email: 'uuid@example.com',
        passwordHash: 'hashed_password_uuid',
      });

      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should auto-generate createdAt timestamp', async () => {
      const beforeCreate = new Date();
      const user = await User.create({
        email: 'timestamp@example.com',
        passwordHash: 'hashed_password_time',
      });
      const afterCreate = new Date();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Email Validation', () => {
    it('should reject user creation with invalid email format', async () => {
      await expect(
        User.create({
          email: 'invalid-email',
          passwordHash: 'hashed_password',
        })
      ).rejects.toThrow();
    });

    it('should reject user creation with empty email', async () => {
      await expect(
        User.create({
          email: '',
          passwordHash: 'hashed_password',
        })
      ).rejects.toThrow();
    });

    it('should reject user creation without email', async () => {
      await expect(
        User.create({
          email: null as any,
          passwordHash: 'hashed_password',
        })
      ).rejects.toThrow();
    });
  });

  describe('Email Uniqueness Constraint', () => {
    it('should reject duplicate email addresses', async () => {
      // Create first user
      await User.create({
        email: 'duplicate@example.com',
        passwordHash: 'hashed_password_1',
      });

      // Attempt to create second user with same email
      await expect(
        User.create({
          email: 'duplicate@example.com',
          passwordHash: 'hashed_password_2',
        })
      ).rejects.toThrow();
    });

    it('should allow different email addresses', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        passwordHash: 'hashed_password_1',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        passwordHash: 'hashed_password_2',
      });

      expect(user1.email).toBe('user1@example.com');
      expect(user2.email).toBe('user2@example.com');
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('Password Hash Validation', () => {
    it('should reject user creation with empty password hash', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          passwordHash: '',
        })
      ).rejects.toThrow();
    });

    it('should reject user creation without password hash', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          passwordHash: null as any,
        })
      ).rejects.toThrow();
    });

    it('should store password hash as provided', async () => {
      const passwordHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
      const user = await User.create({
        email: 'hash@example.com',
        passwordHash,
      });

      expect(user.passwordHash).toBe(passwordHash);
    });
  });

  describe('Role Validation', () => {
    it('should reject invalid role values', async () => {
      await expect(
        User.create({
          email: 'invalid-role@example.com',
          passwordHash: 'hashed_password',
          role: 'INVALID_ROLE' as any,
        })
      ).rejects.toThrow();
    });

    it('should accept SUPER_ADMIN role', async () => {
      const user = await User.create({
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        role: UserRole.SUPER_ADMIN,
      });

      expect(user.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should accept USER role', async () => {
      const user = await User.create({
        email: 'user@example.com',
        passwordHash: 'hashed_password',
        role: UserRole.USER,
      });

      expect(user.role).toBe(UserRole.USER);
    });
  });

  describe('User Retrieval', () => {
    it('should find user by id', async () => {
      const createdUser = await User.create({
        email: 'findbyid@example.com',
        passwordHash: 'hashed_password',
      });

      const foundUser = await User.findByPk(createdUser.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe('findbyid@example.com');
    });

    it('should find user by email', async () => {
      await User.create({
        email: 'findbyemail@example.com',
        passwordHash: 'hashed_password',
      });

      const foundUser = await User.findOne({
        where: { email: 'findbyemail@example.com' },
      });

      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe('findbyemail@example.com');
    });

    it('should return null for non-existent user', async () => {
      const foundUser = await User.findByPk('00000000-0000-0000-0000-000000000000');

      expect(foundUser).toBeNull();
    });
  });

  describe('User Update', () => {
    it('should update user email', async () => {
      const user = await User.create({
        email: 'original@example.com',
        passwordHash: 'hashed_password',
      });

      user.email = 'updated@example.com';
      await user.save();

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.email).toBe('updated@example.com');
    });

    it('should update user role', async () => {
      const user = await User.create({
        email: 'roleupdate@example.com',
        passwordHash: 'hashed_password',
        role: UserRole.USER,
      });

      user.role = UserRole.SUPER_ADMIN;
      await user.save();

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should update password hash', async () => {
      const user = await User.create({
        email: 'passwordupdate@example.com',
        passwordHash: 'old_hash',
      });

      user.passwordHash = 'new_hash';
      await user.save();

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.passwordHash).toBe('new_hash');
    });
  });

  describe('User Deletion', () => {
    it('should delete user by id', async () => {
      const user = await User.create({
        email: 'delete@example.com',
        passwordHash: 'hashed_password',
      });

      await user.destroy();

      const foundUser = await User.findByPk(user.id);
      expect(foundUser).toBeNull();
    });

    it('should delete user by email', async () => {
      await User.create({
        email: 'deletebyemail@example.com',
        passwordHash: 'hashed_password',
      });

      await User.destroy({
        where: { email: 'deletebyemail@example.com' },
      });

      const foundUser = await User.findOne({
        where: { email: 'deletebyemail@example.com' },
      });
      expect(foundUser).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(240) + '@example.com'; // 252 characters
      const user = await User.create({
        email: longEmail,
        passwordHash: 'hashed_password',
      });

      expect(user.email).toBe(longEmail);
    });

    it('should reject email addresses exceeding 255 characters', async () => {
      const tooLongEmail = 'a'.repeat(250) + '@example.com'; // 262 characters
      await expect(
        User.create({
          email: tooLongEmail,
          passwordHash: 'hashed_password',
        })
      ).rejects.toThrow();
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.co.uk';
      const user = await User.create({
        email: specialEmail,
        passwordHash: 'hashed_password',
      });

      expect(user.email).toBe(specialEmail);
    });

    it('should handle long password hashes (bcrypt format)', async () => {
      // Bcrypt hashes are 60 characters
      const bcryptHash = '$2b$10$' + 'a'.repeat(53);
      const user = await User.create({
        email: 'bcrypt@example.com',
        passwordHash: bcryptHash,
      });

      expect(user.passwordHash).toBe(bcryptHash);
    });
  });
});

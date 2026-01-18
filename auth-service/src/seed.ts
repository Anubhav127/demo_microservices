import { sequelize, syncDatabase } from './config/database';
import { User, UserRole } from './models';
import { passwordHasher } from './services';

/**
 * Seed script to create initial SUPER_ADMIN user
 */
const seed = async () => {
    try {
        console.log('Syncing database...');
        await syncDatabase({ alter: true });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log(`Admin user already exists: ${adminEmail}`);
        } else {
            // Create admin user
            const passwordHash = await passwordHasher.hash(adminPassword);
            await User.create({
                email: adminEmail,
                passwordHash,
                role: UserRole.SUPER_ADMIN,
            });
            console.log(`✓ Created SUPER_ADMIN user: ${adminEmail}`);
            console.log(`  Password: ${adminPassword}`);
        }

        await sequelize.close();
        console.log('✓ Seed complete');
        process.exit(0);
    } catch (error) {
        console.error('✗ Seed failed:', error);
        process.exit(1);
    }
};

seed();

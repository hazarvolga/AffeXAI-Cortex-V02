import { DataSource } from 'typeorm';
import { Organization } from '../../../modules/organizations/entities/organization.entity';
import { User } from '../../../modules/users/entities/user.entity';

export const seedDefaultOrganization = async (dataSource: DataSource) => {
    console.log('🏢 Seeding Default Organization...');

    const orgRepo = dataSource.getRepository(Organization);
    const userRepo = dataSource.getRepository(User);

    // 1. Check/Create Default Organization
    let defaultOrg = await orgRepo.findOne({ where: { slug: 'default' } });

    if (!defaultOrg) {
        console.log('   Creating new default organization...');
        defaultOrg = orgRepo.create({
            name: 'Default Organization',
            slug: 'default',
            isActive: true,
            settings: { theme: 'dark', locale: 'en' }
        });
        await orgRepo.save(defaultOrg);
        console.log('   ✅ Default Organization created.');
    } else {
        console.log('   ℹ️ Default Organization already exists.');
    }

    // 2. Migrate Orphan Users
    const orphanUsers = await userRepo.createQueryBuilder('user')
        .where('user.organizationId IS NULL')
        .getMany();

    if (orphanUsers.length > 0) {
        console.log(`   found ${orphanUsers.length} orphan users. Migrating to Default Organization...`);

        // Update all orphans
        await userRepo.createQueryBuilder()
            .update(User)
            .set({ organizationId: defaultOrg.id })
            .where('organizationId IS NULL')
            .execute();

        console.log('   ✅ Orphan users migrated.');
    } else {
        console.log('   ℹ️ No orphan users found.');
    }
};

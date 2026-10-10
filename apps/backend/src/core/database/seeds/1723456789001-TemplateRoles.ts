import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { RoleTemplate } from '../../../modules/roles/entities/role-template.entity';

export const TEMPLATE_ROLES = [
    // Education Module
    {
        name: 'student',
        displayName: 'Student',
        description: 'Access to learning materials, courses, and progress tracking.',
        defaultPermissions: ['course:read', 'assignment:submit', 'certificate:read'],
        isSystem: false,
        isCustom: false,
    },
    {
        name: 'instructor',
        displayName: 'Instructor',
        description: 'Manage courses, students, and grading.',
        defaultPermissions: ['course:manage', 'student:read', 'assignment:grade'],
        isSystem: false,
        isCustom: false,
    },

    // Support Module
    {
        name: 'support_agent',
        displayName: 'Support Agent',
        description: 'Handle customer inquiries and support tickets.',
        defaultPermissions: ['ticket:read', 'ticket:reply', 'ticket:manage'],
        isSystem: false,
        isCustom: false,
    },
    {
        name: 'support_manager',
        displayName: 'Support Team Manager',
        description: 'Oversee support team and escalated tickets.',
        defaultPermissions: ['ticket:manage', 'report:read', 'agent:manage'],
        isSystem: false,
        isCustom: false,
    },

    // Marketing Module (Email & Social)
    {
        name: 'marketing_specialist',
        displayName: 'Marketing Specialist',
        description: 'Create and manage marketing campaigns.',
        defaultPermissions: ['campaign:create', 'email:send', 'social:post'],
        isSystem: false,
        isCustom: false,
    },
    {
        name: 'marketing_manager',
        displayName: 'Marketing Manager',
        description: 'Oversee marketing strategy and team.',
        defaultPermissions: ['campaign:manage', 'analytics:read', 'budget:manage'],
        isSystem: false,
        isCustom: false,
    },

    // Event Module
    {
        name: 'event_manager',
        displayName: 'Event Manager',
        description: 'Create and manage events and webinars.',
        defaultPermissions: ['event:create', 'event:manage', 'attendee:manage'],
        isSystem: false,
        isCustom: false,
    },

    // Education / Training / Certification
    {
        name: 'training_manager',
        displayName: 'Training Manager',
        description: 'Manage certification processes and training materials.',
        defaultPermissions: ['certificate:issue', 'certificate:manage', 'course:read', 'course:manage'],
        isSystem: false,
        isCustom: false,
    },

    // Commerce / CRM
    {
        name: 'customer',
        displayName: 'Customer',
        description: 'External customer account.',
        defaultPermissions: ['order:read', 'profile:manage'],
        isSystem: false,
        isCustom: false,
    }
];

export default class TemplateRolesSeeder implements Seeder {
    public async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<void> {
        const repository = dataSource.getRepository(RoleTemplate);

        for (const roleData of TEMPLATE_ROLES) {
            const exists = await repository.findOneBy({ name: roleData.name });
            if (!exists) {
                await repository.save(repository.create(roleData));
                console.log(`Created template role: ${roleData.displayName}`);
            }
        }
    }
}

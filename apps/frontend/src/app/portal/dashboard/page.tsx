'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { RoleBasedWidget } from '@/components/dashboard/role-based-widget';
import { CustomerQuickLinks, CustomerRecentActivity, CustomerHighlights } from '@/components/dashboard/widgets/customer-widgets';
import { StudentQuickLinks, StudentRecentActivity, StudentRecommendedCourses } from '@/components/dashboard/widgets/student-widgets';
import { UpcomingEvents } from '@/components/dashboard/widgets/shared-widgets';

export default function UnifiedDashboardPage() {
    const { user } = useAuth();

    // DEBUG: Full user object inspection
    console.log('📊 UnifiedDashboard - FULL USER OBJECT:', user);
    console.log('📊 UnifiedDashboard - user.roles:', user?.roles);
    console.log('📊 UnifiedDashboard - typeof roles:', typeof user?.roles);
    console.log('📊 UnifiedDashboard - Array.isArray(roles):', Array.isArray(user?.roles));

    // Get user's role names for display
    const roleNames = user?.roles?.map((r: any) => {
        console.log('📊 Processing role:', r);
        return r.name;
    }) || [];
    const displayRoles = roleNames.length > 0 ? roleNames.join(' & ') : 'Kullanıcı';

    console.log('📊 UnifiedDashboard render:', {
        user: user?.email,
        hasUser: !!user,
        roles: user?.roles,
        roleNames,
        displayRoles,
    });

    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hoş Geldiniz!</h2>
                    <p className="text-muted-foreground">
                        Portal görünümü: {displayRoles}
                    </p>
                    {/* DEBUG INFO */}
                    {(!user || !user.roles || user.roles.length === 0) && (
                        <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                            <p className="font-semibold text-destructive">⚠️ Debug: Kullanıcı rolleri bulunamadı</p>
                            <pre className="text-xs mt-2 overflow-auto">
                                {JSON.stringify({ 
                                    hasUser: !!user, 
                                    email: user?.email,
                                    roles: user?.roles,
                                    roleId: user?.roleId 
                                }, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links - Role-based sections */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <RoleBasedWidget roles={['customer']}>
                    <CustomerQuickLinks />
                </RoleBasedWidget>
                
                <RoleBasedWidget roles={['student']}>
                    <StudentQuickLinks />
                </RoleBasedWidget>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                {/* Shared: Upcoming Events - Visible to all portal users */}
                <RoleBasedWidget roles={['customer', 'student', 'subscriber']}>
                    <UpcomingEvents />
                </RoleBasedWidget>

                {/* Customer: Recent Activity */}
                <RoleBasedWidget roles={['customer']}>
                    <CustomerRecentActivity />
                </RoleBasedWidget>

                {/* Student: Recent Activity */}
                <RoleBasedWidget roles={['student']}>
                    <StudentRecentActivity />
                </RoleBasedWidget>

                {/* Customer: Highlights */}
                <RoleBasedWidget roles={['customer']}>
                    <CustomerHighlights />
                </RoleBasedWidget>

                {/* Student: Recommended Courses */}
                <RoleBasedWidget roles={['student']}>
                    <StudentRecommendedCourses />
                </RoleBasedWidget>
            </div>
        </>
    );
}

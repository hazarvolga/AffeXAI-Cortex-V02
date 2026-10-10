'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, Mail, Shield, Headphones, Share2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface RoleStats {
  role: string;
  count: number;
  icon: any;
  color: string;
}

export function SystemStatsCard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribers: 0,
    students: 0,
    roleStats: [] as RoleStats[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call when backend ready
      // const data = await systemService.getStats();
      // setStats(data);

      // Mock data for now
      setStats({
        totalUsers: 1247,
        subscribers: 856,
        students: 234,
        roleStats: [
          { role: 'Admin', count: 5, icon: Shield, color: 'text-red-500' },
          { role: 'Content Editor', count: 12, icon: Users, color: 'text-blue-500' },
          { role: 'Marketing Manager', count: 8, icon: Mail, color: 'text-purple-500' },
          { role: 'Social Media Manager', count: 6, icon: Share2, color: 'text-indigo-500' },
          { role: 'Event Coordinator', count: 4, icon: Calendar, color: 'text-amber-500' },
          { role: 'Support Agent', count: 15, icon: Headphones, color: 'text-green-500' },
        ],
      });
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {/* Toplam Kullanıcılar */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Toplam Kullanıcı</p>
            </div>
          </div>

          {/* Aboneler */}
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-cyan-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">{stats.subscribers}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Abone</p>
            </div>
          </div>

          {/* Öğrenciler */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">{stats.students}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Öğrenci</p>
            </div>
          </div>

          {/* Ayırıcı */}
          <div className="h-10 w-px bg-border"></div>

          {/* Rol Bazlı İstatistikler */}
          {stats.roleStats.map((roleStat) => {
            const Icon = roleStat.icon;
            return (
              <div key={roleStat.role} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${roleStat.color} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-semibold leading-none">{roleStat.count}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{roleStat.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

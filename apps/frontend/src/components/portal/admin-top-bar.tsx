
'use client';

import { Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roles } from "@/lib/roles-data";
import React from "react";
import { useRouter } from "next/navigation";

const roleUrlMap: { [key: string]: string } = {
    'Admin': '/portal/dashboard/admin',
    'Editor': '/portal/dashboard/editor',
    'Support Team': '/portal/dashboard/support-team',
    'Marketing Team': '/portal/dashboard/marketing-team',
    'Viewer': '/portal/dashboard/viewer',
    'Customer': '/portal/dashboard/customer',
};

export function AdminTopBar({ currentRole }: { currentRole: string }) {
  const router = useRouter();

  const handleRoleChange = (newRole: string) => {
    const newUrl = roleUrlMap[newRole];
    if (newUrl) {
      router.push(newUrl);
    }
  };

  return (
    <div className="bg-destructive text-destructive-foreground p-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-5 w-5" />
          <span>Admin Görünümü</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm">Portalı şu rol olarak görüntüle:</span>
           <Select value={currentRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[180px] h-8 bg-destructive-foreground/20 border-destructive-foreground/50 text-destructive-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                 {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                 ))}
              </SelectContent>
            </Select>
        </div>
      </div>
    </div>
  );
}

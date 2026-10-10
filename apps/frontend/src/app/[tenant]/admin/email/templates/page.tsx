'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, LayoutTemplate, Wand2, Eye, Pen, Search, Sparkles, Calendar } from 'lucide-react';
import Link from 'next/link';
import templatesService from '@/lib/api/templatesService';
import { EmailTemplate } from '@affexai/shared-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';

// Design System entegreli template'ler listesi
const designSystemTemplates = [
  'password-reset',
  'email-verification',
  'welcome',
  'order-confirmation',
  'abandoned-cart',
  'newsletter'
];

import { useParams } from 'next/navigation';

export default function TemplatesManagementPage() {
  const { tenant } = useParams();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await templatesService.getAllTemplates();
        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Şablonlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered and mapped templates with search
  const filteredTemplates = useMemo(() => {
    const mapped = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || 'System blueprint',
      createdAt: template.createdAt,
      templateType: template.type,
      isCustom: template.type === 'custom',
      hasDesignSystem: designSystemTemplates.includes(template.id)
    }));

    if (!searchQuery.trim()) {
      return mapped;
    }

    const query = searchQuery.toLowerCase();
    return mapped.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  return (
    <BccEditorialWrapper
      headerTitle="Protocol Templates"
      headerBadge="Assets"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "REGISTERED_SCHEMATICS", value: templates.length.toString() },
        { label: "DESIGN_SYSTEM_SYNC", value: filteredTemplates.filter(t => t.hasDesignSystem).length.toString() },
        { label: "CUSTOM_ADAPTORS", value: templates.filter(t => t.type === 'custom').length.toString() },
        { label: "UX_INTEGRITY", value: "98.2%" }
      ]}
    >
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Schematic Initialization */}
        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md text-white font-mono uppercase">
          <div className="space-y-1">
            <h2 className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Schematic_Genesis</h2>
            <p className="text-[11px] text-white/60 tracking-widest font-bold">Protocol for new transmission blueprints</p>
          </div>
          <Button asChild className="rounded-none bg-[#ff8c00] text-black hover:bg-[#e67e00] font-bold text-[9px] tracking-[0.2em] uppercase px-8 h-10 transition-all">
            <Link href={`/${tenant}/admin/email/templates/builder`}>
              <Wand2 className="mr-2 h-4 w-4" /> GENERATE_NEW_BLUEPRINT
            </Link>
          </Button>
        </div>

        {/* Blueprint Filter & Live View */}
        <BccHudTile
          title="BLUEPRINT_REGISTRY"
          subtitle="Systematic catalog of all approved visual assets"
          icon="art_track"
        >
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-white/5">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                <Input
                  placeholder="FILTER_BLUEPRINTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-none bg-white/[0.03] border-white/10 text-[10px] font-mono tracking-widest pl-10 h-10 border-r-0 focus:border-r-0"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap font-mono uppercase">
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-[9px] text-white/40 tracking-widest px-3 py-1">
                  HITS: {filteredTemplates.length}
                </Badge>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Decrypting Blueprints...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest">{error}</div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                <LayoutTemplate className="h-10 w-10 text-white/10" />
                <div className="text-center space-y-2">
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Registry vacuum detected</h3>
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                    {searchQuery ? 'Zero schematics match the applied filter.' : 'Initialize your first transmission protocol.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] px-6">Blueprint_Identity</TableHead>
                      <TableHead className="hidden md:table-cell text-white/40 uppercase tracking-[0.2em] text-[9px]">Description_Hash</TableHead>
                      <TableHead className="hidden sm:table-cell text-white/40 uppercase tracking-[0.2em] text-[9px] text-center">Protocol_Status</TableHead>
                      <TableHead className="hidden sm:table-cell text-white/40 uppercase tracking-[0.2em] text-[9px] text-right px-6">Epoch_Sync</TableHead>
                      <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-right px-6">Access_Bus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group text-[11px]">
                        <TableCell className="py-6 px-6 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-8 bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <LayoutTemplate className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-white group-hover:text-[#ff8c00] transition-colors font-bold uppercase tracking-tight">
                                {template.name}
                              </div>
                              <div className="text-[8px] text-white/20 font-mono uppercase">ID: {template.id.toUpperCase()}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-white/40 uppercase tracking-widest text-[9px] max-w-xs truncate">
                          {template.description}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {template.hasDesignSystem && (
                            <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] text-[9px] tracking-widest uppercase">
                              BCC_INTEGRATED
                            </Badge>
                          )}
                          {!template.hasDesignSystem && (
                            <Badge variant="outline" className="rounded-none border-white/5 text-white/10 text-[9px] tracking-widest uppercase">
                              STANDALONE
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right px-6 text-[10px] font-mono text-white/20 tabular-nums uppercase">
                          {new Date(template.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 rounded-none text-[9px] font-bold uppercase tracking-widest border border-white/5 hover:bg-white/5 hover:text-[#ff8c00]"
                            >
                              <Link href={`/${tenant}/admin/email/templates/${template.id}/preview`}>
                                <Eye className="h-3.5 w-3.5 mr-2 opacity-40" /> PREVIEW
                              </Link>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              asChild
                              className="h-8 rounded-none bg-white/[0.03] border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-[#9df425] hover:text-black transition-all"
                            >
                              <Link href={`/${tenant}/admin/email/templates/${template.id}/edit`}>
                                <Pen className="h-3.5 w-3.5 mr-2 opacity-60" /> CONFIGURE
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </BccHudTile>
      </div>
    </BccEditorialWrapper>
  );
}

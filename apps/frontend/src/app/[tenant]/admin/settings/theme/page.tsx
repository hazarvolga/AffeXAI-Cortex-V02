'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThemeSettingsService, type ThemeSettings, type UpdateThemeSettingsDto } from '@/services/theme-settings.service';
import { cmsMenuService } from '@/lib/cms/menu-service';
import type { CmsMenu } from '@affexai/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { Loader2, Plus, Trash2, Save, Eye, Settings as SettingsIcon, Menu as MenuIcon, KeyRound } from 'lucide-react';

const ThemeSettingsLayoutWrapper = ({ children, activeTheme }: { children: React.ReactNode, activeTheme?: ThemeSettings }) => {
  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle="Theme Resonance"
      headerSubtitle="Calibrating visual nodes and ecosystem brand alignment."
      headerBadge="Editorial Console"
      telemetryData={[
        { label: 'Theme Stability', value: activeTheme ? 'Active' : 'Pending', color: '#ff8c00' },
        { label: 'Menu Integrity', value: '100', suffix: '%', color: '#ff8c00' }
      ]}
    >
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
        {children}
      </div>
    </BccEditorialWrapper>
  );
};

export default function ThemeSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active theme
  const { data: activeTheme, isLoading } = useQuery<ThemeSettings>({
    queryKey: ['theme-settings-active'],
    queryFn: () => ThemeSettingsService.getActiveTheme(),
  });

  // Fetch all menus
  const { data: menus = [], isLoading: menusLoading } = useQuery<CmsMenu[]>({
    queryKey: ['cms-menus'],
    queryFn: () => cmsMenuService.getMenus(),
  });

  // Local state for editing
  const [editedTheme, setEditedTheme] = useState<UpdateThemeSettingsDto>({});

  const updateMutation = useMutation({
    mutationFn: (data: UpdateThemeSettingsDto) => ThemeSettingsService.update(activeTheme!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings-active'] });
      toast({ title: 'Success', description: 'Settings committed to infrastructure.' });
      setEditedTheme({});
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editedTheme);
  };

  const currentTopBarLinks = editedTheme.headerConfig?.topBarLinks || activeTheme?.headerConfig?.topBarLinks || [];
  const currentCtaButtons = (editedTheme.headerConfig?.ctaButtons || activeTheme?.headerConfig?.ctaButtons || {}) as any;
  const currentAuthLinks = (editedTheme.headerConfig?.authLinks || activeTheme?.headerConfig?.authLinks || {}) as any;
  const currentLayout = (editedTheme.headerConfig?.layout || activeTheme?.headerConfig?.layout || {}) as any;
  const currentFooterSections = editedTheme.footerConfig?.sections || activeTheme?.footerConfig?.sections || [];

  const addTopBarLink = () => {
    const newLinks = [...currentTopBarLinks, { text: '', href: '', order: currentTopBarLinks.length }];
    setEditedTheme({
      ...editedTheme,
      headerConfig: { ...editedTheme.headerConfig, topBarLinks: newLinks },
    });
  };

  const updateTopBarLink = (index: number, field: string, value: any) => {
    const newLinks = [...currentTopBarLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setEditedTheme({
      ...editedTheme,
      headerConfig: { ...editedTheme.headerConfig, topBarLinks: newLinks },
    });
  };

  const removeTopBarLink = (index: number) => {
    const newLinks = currentTopBarLinks.filter((_, i) => i !== index);
    setEditedTheme({
      ...editedTheme,
      headerConfig: { ...editedTheme.headerConfig, topBarLinks: newLinks },
    });
  };

  const addFooterSection = () => {
    const newSections = [...currentFooterSections, { title: '', customLinks: [], order: currentFooterSections.length }];
    setEditedTheme({
      ...editedTheme,
      footerConfig: { ...editedTheme.footerConfig, sections: newSections },
    });
  };

  const updateFooterSection = (index: number, field: string, value: any) => {
    const newSections = [...currentFooterSections];
    newSections[index] = { ...newSections[index], [field]: value };
    setEditedTheme({
      ...editedTheme,
      footerConfig: { ...editedTheme.footerConfig, sections: newSections },
    });
  };

  const removeFooterSection = (index: number) => {
    const newSections = currentFooterSections.filter((_, i) => i !== index);
    setEditedTheme({
      ...editedTheme,
      footerConfig: { ...editedTheme.footerConfig, sections: newSections },
    });
  };

  const addFooterLink = (sectionIndex: number) => {
    const newSections = [...currentFooterSections];
    const section = newSections[sectionIndex];
    const links = section.customLinks || [];
    newSections[sectionIndex] = {
      ...section,
      customLinks: [...links, { name: '', href: '', order: links.length }],
    };
    setEditedTheme({
      ...editedTheme,
      footerConfig: { ...editedTheme.footerConfig, sections: newSections },
    });
  };

  const updateFooterLink = (sectionIndex: number, linkIndex: number, field: string, value: any) => {
    const newSections = [...currentFooterSections];
    const section = newSections[sectionIndex];
    const links = [...(section.customLinks || [])];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    newSections[sectionIndex] = { ...section, customLinks: links };
    setEditedTheme({
      ...editedTheme,
      footerConfig: { ...editedTheme.footerConfig, sections: newSections },
    });
  };

  const removeFooterLink = (sectionIndex: number, linkIndex: number) => {
    const newSections = [...currentFooterSections];
    const section = newSections[sectionIndex];
    const links = (section.customLinks || []).filter((_, i) => i !== linkIndex);
    newSections[sectionIndex] = { ...section, customLinks: links };
    setEditedTheme({
      ...editedTheme,
      footerConfig: { ...editedTheme.footerConfig, sections: newSections },
    });
  };

  return (
    <ThemeSettingsLayoutWrapper activeTheme={activeTheme}>
      <div className="space-y-12 pb-24">
        <div className="border-l-2 border-[#ff8c00] pl-6 py-2">
          <h1 className="text-4xl font-bold tracking-tighter uppercase font-mono italic">Theme Settings</h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] mt-2">
            System brand identity and navigation node architecture.
          </p>
        </div>

        <Tabs defaultValue="header" className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger value="header" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold">Header Architecture</TabsTrigger>
              <TabsTrigger value="footer" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold">Footer Node</TabsTrigger>
              <TabsTrigger value="layout" className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold">Layout Core</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-[0.2em]" onClick={() => window.open('/', '_blank')}>
                <Eye className="h-3 w-3 mr-2" /> Preview
              </Button>
              <Button
                size="sm"
                className="bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 text-[10px] uppercase tracking-[0.2em] font-bold"
                onClick={handleSave}
                disabled={updateMutation.isPending || Object.keys(editedTheme).length === 0}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-2" />
                )}
                Commit Changes
              </Button>
            </div>
          </div>

          <TabsContent value="header" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-8">
              <Card className="bcc-glass border-none bg-white/[0.02]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#ff8c00]"></div>
                    <div>
                      <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">Navigation Controller</CardTitle>
                      <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Binding the primary site architecture menu.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase text-white/40 tracking-widest">Active Menu Node</Label>
                    <Select
                      value={(editedTheme.headerMenuId !== undefined ? editedTheme.headerMenuId : activeTheme?.headerMenuId) || 'none'}
                      onValueChange={(value) => {
                        setEditedTheme({
                          ...editedTheme,
                          headerMenuId: value === 'none' ? undefined : value,
                        });
                      }}
                      disabled={menusLoading}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <SelectValue placeholder="Selecting terminal..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10">
                        <SelectItem value="none" className="text-[10px] uppercase tracking-widest">None (Disabled)</SelectItem>
                        {menus.map((menu) => (
                          <SelectItem key={menu.id} value={menu.id} className="text-[10px] uppercase tracking-widest">
                            {menu.name} {menu.isActive && '[ACTIVE]'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bcc-glass border-none bg-white/[0.02]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#ff8c00]"></div>
                    <div>
                      <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">Top Bar Resonance</CardTitle>
                      <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Secondary high-frequency navigation signals.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-4">
                  {currentTopBarLinks.map((link, index) => (
                    <div key={index} className="flex items-end gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-sm group">
                      <div className="flex-1 grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-white/30">Node Label</Label>
                          <Input value={link.text || ''}
                            onChange={(e) => updateTopBarLink(index, 'text', e.target.value)}
                            className="bg-black/20 border-white/10 focus:border-[#ff8c00]/50"
                            placeholder="Link text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-white/30">Vector Path</Label>
                          <Input value={link.href || ''}
                            onChange={(e) => updateTopBarLink(index, 'href', e.target.value)}
                            className="bg-black/20 border-white/10 focus:border-[#ff8c00]/50"
                            placeholder="/sayfa"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-white/30">Sequence Order</Label>
                          <Input type="number" value={link.order || 0}
                            onChange={(e) => updateTopBarLink(index, 'order', parseInt(e.target.value))}
                            className="bg-black/20 border-white/10 focus:border-[#ff8c00]/50"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all mb-0.5"
                        onClick={() => removeTopBarLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addTopBarLink} variant="outline" className="w-full border-white/10 border-dashed hover:bg-white/5 py-8 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">
                    <Plus className="h-4 w-4 mr-2" /> Add Signal Link
                  </Button>
                </CardContent>
              </Card>

              <Card className="bcc-glass border-none bg-white/[0.02]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#ff8c00]"></div>
                    <div>
                      <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">CTA Pulse Controllers</CardTitle>
                      <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Primary engagement nodes and focus triggers.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  {/* Contact Button */}
                  <div className="p-8 bg-white/[0.03] border border-white/5 rounded-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold italic">Contact Node</Label>
                        <p className="text-[10px] text-white/40 uppercase">Global bridge to human support.</p>
                      </div>
                      <Switch
                        checked={currentCtaButtons.contact?.show ?? true}
                        onCheckedChange={(checked) => {
                          setEditedTheme({
                            ...editedTheme,
                            headerConfig: {
                              ...editedTheme.headerConfig,
                              ctaButtons: {
                                ...currentCtaButtons,
                                contact: {
                                  text: currentCtaButtons.contact?.text || 'İletişim',
                                  href: currentCtaButtons.contact?.href || '/contact',
                                  show: checked
                                },
                              },
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-white/30">Node Label</Label>
                        <Input
                          value={currentCtaButtons.contact?.text || 'İletişim'}
                          onChange={(e) => {
                            setEditedTheme({
                              ...editedTheme,
                              headerConfig: {
                                ...editedTheme.headerConfig,
                                ctaButtons: {
                                  ...currentCtaButtons,
                                  contact: { ...currentCtaButtons.contact!, text: e.target.value },
                                },
                              },
                            });
                          }}
                          className="bg-black/40 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-white/30">Vector Path</Label>
                        <Input
                          value={currentCtaButtons.contact?.href || '/contact'}
                          onChange={(e) => {
                            setEditedTheme({
                              ...editedTheme,
                              headerConfig: {
                                ...editedTheme.headerConfig,
                                ctaButtons: {
                                  ...currentCtaButtons,
                                  contact: { ...currentCtaButtons.contact!, href: e.target.value },
                                },
                              },
                            });
                          }}
                          className="bg-black/40 border-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Demo Button */}
                  <div className="p-8 bg-white/[0.03] border border-white/5 rounded-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold italic">Simulated Demo Node</Label>
                        <p className="text-[10px] text-white/40 uppercase">Interactive simulation request gateway.</p>
                      </div>
                      <Switch
                        checked={currentCtaButtons.demo?.show ?? true}
                        onCheckedChange={(checked) => {
                          setEditedTheme({
                            ...editedTheme,
                            headerConfig: {
                              ...editedTheme.headerConfig,
                              ctaButtons: {
                                ...currentCtaButtons,
                                demo: {
                                  text: currentCtaButtons.demo?.text || 'Demo İste',
                                  href: currentCtaButtons.demo?.href || '#demo',
                                  show: checked
                                },
                              },
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-white/30">Node Label</Label>
                        <Input
                          value={currentCtaButtons.demo?.text || 'Demo İste'}
                          onChange={(e) => {
                            setEditedTheme({
                              ...editedTheme,
                              headerConfig: {
                                ...editedTheme.headerConfig,
                                ctaButtons: {
                                  ...currentCtaButtons,
                                  demo: { ...currentCtaButtons.demo!, text: e.target.value },
                                },
                              },
                            });
                          }}
                          className="bg-black/40 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-white/30">Vector Path</Label>
                        <Input
                          value={currentCtaButtons.demo?.href || '#demo'}
                          onChange={(e) => {
                            setEditedTheme({
                              ...editedTheme,
                              headerConfig: {
                                ...editedTheme.headerConfig,
                                ctaButtons: {
                                  ...currentCtaButtons,
                                  demo: { ...currentCtaButtons.demo!, href: e.target.value },
                                },
                              },
                            });
                          }}
                          className="bg-black/40 border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login & Signup Logic Node */}
              <Card className="bcc-glass border-none bg-white/[0.02]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#ff8c00]"></div>
                    <div>
                      <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">Identity Gate Access</CardTitle>
                      <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Authentication link protocols and terminal redirects.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Login Section */}
                    <div className="space-y-4 p-6 bg-black/20 border border-white/5 rounded-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-4">
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-3 w-3 text-[#ff8c00]" />
                          <Label className="text-[10px] uppercase text-[#ff8c00] font-bold">Login Gateway</Label>
                        </div>
                        <Switch
                          checked={currentAuthLinks.showLogin ?? true}
                          onCheckedChange={(checked) => {
                            setEditedTheme({
                              ...editedTheme,
                              headerConfig: {
                                ...editedTheme.headerConfig,
                                authLinks: { ...currentAuthLinks, showLogin: checked },
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-white/30">Node Label</Label>
                          <Input
                            value={currentAuthLinks.loginText || 'Giriş Yap'}
                            onChange={(e) => {
                              setEditedTheme({
                                ...editedTheme,
                                headerConfig: {
                                  ...editedTheme.headerConfig,
                                  authLinks: { ...currentAuthLinks, loginText: e.target.value },
                                },
                              });
                            }}
                            className="bg-black/40 border-white/10 text-[10px]"
                            placeholder="Login label"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-white/30">Target Vector</Label>
                          <Input
                            value={currentAuthLinks.loginUrl || '/login'}
                            onChange={(e) => {
                              setEditedTheme({
                                ...editedTheme,
                                headerConfig: {
                                  ...editedTheme.headerConfig,
                                  authLinks: { ...currentAuthLinks, loginUrl: e.target.value },
                                },
                              });
                            }}
                            className="bg-black/40 border-white/10 text-[10px]"
                            placeholder="/login"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Signup Section */}
                    <div className="space-y-4 p-6 bg-black/20 border border-white/5 rounded-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-4">
                        <div className="flex items-center gap-2">
                          <Plus className="h-3 w-3 text-[#ff8c00]" />
                          <Label className="text-[10px] uppercase text-[#ff8c00] font-bold">Signup Oracle</Label>
                        </div>
                        <Switch
                          checked={currentAuthLinks.showSignup ?? true}
                          onCheckedChange={(checked) => {
                            setEditedTheme({
                              ...editedTheme,
                              headerConfig: {
                                ...editedTheme.headerConfig,
                                authLinks: { ...currentAuthLinks, showSignup: checked },
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-white/30">Node Label</Label>
                          <Input
                            value={currentAuthLinks.signupText || 'Kayıt Ol'}
                            onChange={(e) => {
                              setEditedTheme({
                                ...editedTheme,
                                headerConfig: {
                                  ...editedTheme.headerConfig,
                                  authLinks: { ...currentAuthLinks, signupText: e.target.value },
                                },
                              });
                            }}
                            className="bg-black/40 border-white/10 text-[10px]"
                            placeholder="Signup label"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-white/30">Target Vector</Label>
                          <Input
                            value={currentAuthLinks.signupUrl || '/signup'}
                            onChange={(e) => {
                              setEditedTheme({
                                ...editedTheme,
                                headerConfig: {
                                  ...editedTheme.headerConfig,
                                  authLinks: { ...currentAuthLinks, signupUrl: e.target.value },
                                },
                              });
                            }}
                            className="bg-black/40 border-white/10 text-[10px]"
                            placeholder="/signup"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="footer" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-8">
              <Card className="bcc-glass border-none bg-white/[0.02]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#ff8c00]"></div>
                    <div>
                      <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">Footer Node Infrastructure</CardTitle>
                      <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Defining the terminal navigation landscape.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  {currentFooterSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="p-8 bg-white/[0.03] border border-white/5 rounded-sm space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] uppercase text-white/30 tracking-widest font-bold">Section Signature</Label>
                          <Input
                            value={section.title}
                            onChange={(e) => updateFooterSection(sectionIndex, 'title', e.target.value)}
                            className="bg-black/40 border-white/10 focus:border-[#ff8c00]/50"
                            placeholder="Node heading"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          onClick={() => removeFooterSection(sectionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4 pl-6 border-l border-white/5">
                        {section.customLinks?.map((link, linkIndex) => (
                          <div key={linkIndex} className="flex items-end gap-6 p-4 bg-black/20 border border-white/5 rounded-sm">
                            <div className="flex-1 grid grid-cols-3 gap-6">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-white/30">Vector</Label>
                                <Input
                                  value={link.name}
                                  onChange={(e) => updateFooterLink(sectionIndex, linkIndex, 'name', e.target.value)}
                                  className="bg-transparent border-white/5 text-[10px]"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-white/30">Path</Label>
                                <Input
                                  value={link.href || ''}
                                  onChange={(e) => updateFooterLink(sectionIndex, linkIndex, 'href', e.target.value)}
                                  className="bg-transparent border-white/5 text-[10px]"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-white/30">Rank</Label>
                                <Input
                                  type="number"
                                  value={link.order || 0}
                                  onChange={(e) => updateFooterLink(sectionIndex, linkIndex, 'order', parseInt(e.target.value))}
                                  className="bg-transparent border-white/5 text-[10px]"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white/10 hover:text-red-500 mb-0.5"
                              onClick={() => removeFooterLink(sectionIndex, linkIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button onClick={() => addFooterLink(sectionIndex)} variant="outline" className="w-full border-white/5 border-dashed hover:bg-white/5 text-[10px] uppercase tracking-widest text-white/30 py-4 font-mono">
                          <Plus className="h-3 w-3 mr-2" /> Link Signal
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button onClick={addFooterSection} variant="outline" className="w-full border-white/10 border-dashed hover:bg-white/5 py-8 text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold font-mono">
                    <Plus className="h-4 w-4 mr-2" /> Add Infrastructure Section
                  </Button>
                </CardContent>
              </Card>

              <Card className="bcc-glass border-none bg-white/[0.02]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#ff8c00]"></div>
                    <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">Global terminal logic</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Copyright String</Label>
                    <Input
                      value={activeTheme?.footerConfig?.copyrightText || 'Tüm hakları saklıdır.'}
                      onChange={(e) => {
                        setEditedTheme({
                          ...editedTheme,
                          footerConfig: {
                            ...editedTheme.footerConfig,
                            copyrightText: e.target.value,
                          },
                        });
                      }}
                      className="bg-black/40 border-white/10"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Linguistic Terminal</Label>
                      <Switch
                        checked={activeTheme?.footerConfig?.showLanguageSelector ?? true}
                        onCheckedChange={(checked) => {
                          setEditedTheme({
                            ...editedTheme,
                            footerConfig: {
                              ...editedTheme.footerConfig,
                              showLanguageSelector: checked,
                            },
                          });
                        }}
                      />
                    </div>
                    <Input
                      value={activeTheme?.footerConfig?.languageText || 'Türkiye (Türkçe)'}
                      onChange={(e) => {
                        setEditedTheme({
                          ...editedTheme,
                          footerConfig: {
                            ...editedTheme.footerConfig,
                            languageText: e.target.value,
                          },
                        });
                      }}
                      className="bg-black/40 border-white/10"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bcc-glass border-none bg-white/[0.02]">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-[#ff8c00]"></div>
                  <div>
                    <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold font-mono">Structural Logic</CardTitle>
                    <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">Dimensional scaling and surface behavior.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                {[
                  { id: 'sticky', label: 'Persistent Node (Sticky)', desc: 'Terminal remains anchored during sequence scroll.' },
                  { id: 'shadow', label: 'Depth Projection (Shadow)', desc: 'Rendering depth vectors beneath the header surface.' },
                  { id: 'transparent', label: 'Ethereal State (Transparent)', desc: 'Zero-opacity baseline with high-fidelity glass refraction.' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-sm">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-white/90">{item.label}</Label>
                      <p className="text-[10px] text-white/40 uppercase tracking-tight">{item.desc}</p>
                    </div>
                    <Switch
                      checked={currentLayout[item.id] ?? (item.id === 'transparent' ? false : true)}
                      onCheckedChange={(checked) => {
                        setEditedTheme({
                          ...editedTheme,
                          headerConfig: {
                            ...editedTheme.headerConfig,
                            layout: { ...currentLayout, [item.id]: checked },
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ThemeSettingsLayoutWrapper>
  );
}

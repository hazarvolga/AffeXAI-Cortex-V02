'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { httpClient } from '@/lib/api/http-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Save, 
  X, 
  AlertCircle,
  Settings,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  CheckSquare
} from 'lucide-react';
import { useCustomFields, CustomField } from '@/hooks/useCustomFields';

interface CustomFieldFormData {
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT';
  description: string;
  required: boolean;
  options: string[];
  defaultValue: string;
  placeholder: string;
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

const fieldTypeIcons = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  BOOLEAN: ToggleLeft,
  SELECT: List,
  MULTI_SELECT: CheckSquare
};

const fieldTypeLabels = {
  TEXT: 'Metin',
  NUMBER: 'Sayı',
  DATE: 'Tarih',
  BOOLEAN: 'Evet/Hayır',
  SELECT: 'Seçim Listesi',
  MULTI_SELECT: 'Çoklu Seçim'
};

export default function CustomFieldsManager() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { customFields, loading, error, createCustomField, updateCustomField, deleteCustomField, reorderCustomFields } = useCustomFields();
  const [isCreating, setIsCreating] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<CustomFieldFormData>({
    name: '',
    label: '',
    type: 'TEXT',
    description: '',
    required: false,
    options: [],
    defaultValue: '',
    placeholder: '',
    validation: {}
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      type: 'TEXT',
      description: '',
      required: false,
      options: [],
      defaultValue: '',
      placeholder: '',
      validation: {}
    });
    setFormError(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingField(null);
  };

  const handleEdit = (field: CustomField) => {
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      description: field.description || '',
      required: field.required,
      options: field.options || [],
      defaultValue: field.defaultValue || '',
      placeholder: field.placeholder || '',
      validation: field.validation || {}
    });
    setEditingField(field);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingField(null);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormError('Alan adı gereklidir');
      return false;
    }

    if (!formData.label.trim()) {
      setFormError('Alan etiketi gereklidir');
      return false;
    }

    // Validate field name format (alphanumeric and underscore only)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      setFormError('Alan adı sadece harf, rakam ve alt çizgi içerebilir ve harf ile başlamalıdır');
      return false;
    }

    // Check for duplicate names (excluding current field when editing)
    const existingField = customFields.find(field => 
      field.name === formData.name && field.id !== editingField?.id
    );
    if (existingField) {
      setFormError('Bu alan adı zaten kullanılıyor');
      return false;
    }

    // Validate options for SELECT types
    if (['SELECT', 'MULTI_SELECT'].includes(formData.type)) {
      if (formData.options.length === 0) {
        setFormError('Seçim listesi türleri için en az bir seçenek gereklidir');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingField) {
        await updateCustomField(editingField.id, formData);
      } else {
        await createCustomField(formData);
      }
      
      handleCancel();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (field: CustomField) => {
    if (!confirm(`"${field.label}" alanını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteCustomField(field.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silme işlemi başarısız');
    }
  };

  const handleOptionsChange = (value: string) => {
    const options = value.split('\n').filter(opt => opt.trim()).map(opt => opt.trim());
    setFormData(prev => ({ ...prev, options }));
  };

  const renderFieldForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {editingField ? 'Özel Alan Düzenle' : 'Yeni Özel Alan'}
        </CardTitle>
        <CardDescription>
          Aboneleriniz için özel veri alanları tanımlayın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="field-name">Alan Adı *</Label>
            <Input
              id="field-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ornek_alan"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sadece harf, rakam ve alt çizgi kullanın
            </p>
          </div>

          <div>
            <Label htmlFor="field-label">Alan Etiketi *</Label>
            <Input
              id="field-label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Örnek Alan"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="field-type">Alan Türü</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(fieldTypeLabels).map(([value, label]) => {
                const Icon = fieldTypeIcons[value as keyof typeof fieldTypeIcons];
                return (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="field-description">Açıklama</Label>
          <Textarea
            id="field-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Bu alan hakkında açıklama..."
            disabled={isSubmitting}
          />
        </div>

        {['SELECT', 'MULTI_SELECT'].includes(formData.type) && (
          <div>
            <Label htmlFor="field-options">Seçenekler *</Label>
            <Textarea
              id="field-options"
              value={formData.options.join('\n')}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Her satıra bir seçenek yazın"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Her satıra bir seçenek yazın
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={formData.placeholder}
              onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Kullanıcıya gösterilecek ipucu"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="field-default">Varsayılan Değer</Label>
            <Input
              id="field-default"
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder="Varsayılan değer"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="field-required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked as boolean }))}
            disabled={isSubmitting}
          />
          <Label htmlFor="field-required">Zorunlu alan</Label>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Debug info
    const debugInfo = {
      localStorage_auth_token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
      localStorage_aluplan_access_token: typeof window !== 'undefined' ? localStorage.getItem('aluplan_access_token') : null,
      localStorage_keys: typeof window !== 'undefined' ? Object.keys(localStorage) : [],
      httpClient_token: httpClient.getAuthToken(),
    };
    
    console.log('🔐 Debug - Auth state:', debugInfo);
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Giriş Gerekli</h3>
          <p className="text-muted-foreground mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          
          {/* Debug info */}
          <div className="text-xs text-left bg-gray-100 p-2 rounded mb-4 max-w-md">
            <strong>Debug Info:</strong><br/>
            localStorage auth_token: {debugInfo.localStorage_auth_token ? 'EXISTS' : 'MISSING'}<br/>
            localStorage aluplan_access_token: {debugInfo.localStorage_aluplan_access_token ? 'EXISTS' : 'MISSING'}<br/>
            httpClient token: {debugInfo.httpClient_token ? 'EXISTS' : 'MISSING'}<br/>
            localStorage keys: {debugInfo.localStorage_keys.join(', ')}
          </div>
          
          <div className="space-y-2">
            <Button onClick={() => window.location.href = '/login'}>
              Giriş Yap
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Oturumu Temizle
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Try to manually set token from localStorage
                const token = localStorage.getItem('auth_token') || localStorage.getItem('aluplan_access_token');
                if (token) {
                  httpClient.setAuthToken(token);
                  window.location.reload();
                } else {
                  alert('Token bulunamadı');
                }
              }}
            >
              Token'ı Yenile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Özel alanlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Özel Alanlar</h2>
          <p className="text-muted-foreground">
            Aboneleriniz için özel alanlar tanımlayın
          </p>
        </div>
        {!isCreating && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Alan
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isCreating && renderFieldForm()}

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Özel Alanlar</CardTitle>
          <CardDescription>
            {customFields.length} özel alan tanımlanmış
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz özel alan tanımlanmamış</p>
              <p className="text-sm">Yeni alan eklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customFields.map((field) => {
                const Icon = fieldTypeIcons[field.type];
                return (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {fieldTypeLabels[field.type]}
                          </Badge>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">
                              Zorunlu
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <code className="bg-muted px-1 rounded text-xs">{field.name}</code>
                          {field.description && (
                            <span className="ml-2">{field.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(field)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  Send, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import emailCampaignsService from '@/lib/api/emailCampaignsService';

interface CampaignSchedulerProps {
  campaignId: string;
  currentStatus: string;
  currentScheduledAt?: string;
  onScheduleUpdate?: () => void;
}

export default function CampaignScheduler({ 
  campaignId, 
  currentStatus, 
  currentScheduledAt,
  onScheduleUpdate 
}: CampaignSchedulerProps) {
  const { toast } = useToast();
  const [isScheduled, setIsScheduled] = useState(currentStatus === 'scheduled');
  const [scheduledDate, setScheduledDate] = useState(
    currentScheduledAt ? new Date(currentScheduledAt).toISOString().slice(0, 16) : ''
  );
  const [loading, setLoading] = useState(false);

  const handleScheduleToggle = (checked: boolean) => {
    setIsScheduled(checked);
    if (!checked) {
      setScheduledDate('');
    } else {
      // Set default to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setScheduledDate(defaultTime.toISOString().slice(0, 16));
    }
  };

  const handleScheduleCampaign = async () => {
    if (!scheduledDate) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir tarih ve saat seçin.',
        variant: 'destructive',
      });
      return;
    }

    const scheduledDateTime = new Date(scheduledDate);
    const now = new Date();

    if (scheduledDateTime <= now) {
      toast({
        title: 'Hata',
        description: 'Planlanan tarih gelecekte olmalıdır.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await emailCampaignsService.scheduleCampaign(campaignId, scheduledDateTime.toISOString());
      
      toast({
        title: 'Başarılı',
        description: 'Kampanya başarıyla planlandı.',
      });

      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      toast({
        title: 'Hata',
        description: 'Kampanya planlanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      setLoading(true);
      await emailCampaignsService.cancelSchedule(campaignId);
      
      setIsScheduled(false);
      setScheduledDate('');
      
      toast({
        title: 'Başarılı',
        description: 'Kampanya planlaması iptal edildi.',
      });

      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      toast({
        title: 'Hata',
        description: 'Planlama iptal edilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!scheduledDate) {
      toast({
        title: 'Hata',
        description: 'Lütfen yeni bir tarih ve saat seçin.',
        variant: 'destructive',
      });
      return;
    }

    const newScheduledDateTime = new Date(scheduledDate);
    const now = new Date();

    if (newScheduledDateTime <= now) {
      toast({
        title: 'Hata',
        description: 'Yeni planlanan tarih gelecekte olmalıdır.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await emailCampaignsService.rescheduleCampaign(campaignId, newScheduledDateTime.toISOString());
      
      toast({
        title: 'Başarılı',
        description: 'Kampanya yeniden planlandı.',
      });

      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error rescheduling campaign:', error);
      toast({
        title: 'Hata',
        description: 'Kampanya yeniden planlanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    try {
      setLoading(true);
      await emailCampaignsService.sendCampaign(campaignId);
      
      toast({
        title: 'Başarılı',
        description: 'Kampanya gönderilmeye başlandı.',
      });

      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Hata',
        description: 'Kampanya gönderilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // Maximum 1 year from now
    return maxDate.toISOString().slice(0, 16);
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Kampanya Planlaması
        </CardTitle>
        <CardDescription>
          Kampanyanızı belirli bir tarih ve saatte gönderilmek üzere planlayın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        {currentStatus === 'scheduled' && currentScheduledAt && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Kampanya Planlandı</span>
            </div>
            <p className="text-sm text-blue-700">
              Gönderim tarihi: {formatScheduledTime(currentScheduledAt)}
            </p>
          </div>
        )}

        {/* Schedule Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="schedule-toggle"
            checked={isScheduled}
            onCheckedChange={handleScheduleToggle}
            disabled={currentStatus === 'sent' || currentStatus === 'sending'}
          />
          <Label htmlFor="schedule-toggle">Kampanyayı planla</Label>
        </div>

        {/* Schedule Form */}
        {isScheduled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Gönderim Tarihi ve Saati</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getMinDateTime()}
                max={getMaxDateTime()}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Kampanya en az 5 dakika sonra planlanabilir
              </p>
            </div>

            {/* Validation Warning */}
            {scheduledDate && new Date(scheduledDate) <= new Date() && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Planlanan tarih gelecekte olmalıdır
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {currentStatus === 'scheduled' ? (
                <>
                  <Button
                    onClick={handleReschedule}
                    disabled={loading || !scheduledDate}
                    className="flex-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Yeniden Planla
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelSchedule}
                    disabled={loading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    İptal Et
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleScheduleCampaign}
                  disabled={loading || !scheduledDate}
                  className="flex-1"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Planla
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Send Now Option */}
        {!isScheduled && currentStatus !== 'sent' && currentStatus !== 'sending' && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleSendNow}
              disabled={loading}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              Şimdi Gönder
            </Button>
          </div>
        )}

        {/* Status Info */}
        <div className="text-xs text-muted-foreground">
          {currentStatus === 'draft' && 'Kampanya taslak durumunda'}
          {currentStatus === 'scheduled' && 'Kampanya planlanmış durumda'}
          {currentStatus === 'sending' && 'Kampanya gönderiliyor'}
          {currentStatus === 'sent' && 'Kampanya gönderildi'}
        </div>
      </CardContent>
    </Card>
  );
}
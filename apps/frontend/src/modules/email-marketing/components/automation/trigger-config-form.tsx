/**
 * Trigger Configuration Form
 * Form for configuring automation triggers
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  TriggerType,
  TriggerEvent,
  type TriggerConfig,
  type EventTriggerConfig,
  type BehaviorTriggerConfig,
  type TimeBasedTriggerConfig,
  type AttributeTriggerConfig,
} from '@/types/automation';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Clock,
  Zap,
  Target,
  Users,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerEventGroups } from './trigger-event-options';

// Form schema
const triggerConfigSchema = z.object({
  triggerType: z.nativeEnum(TriggerType),
  segmentId: z.string().optional(),
  config: z.any(), // Will be validated based on trigger type
});

type TriggerConfigFormData = z.infer<typeof triggerConfigSchema>;

interface TriggerConfigFormProps {
  initialData?: {
    triggerType: TriggerType;
    config: TriggerConfig;
    segmentId?: string;
  };
  onUpdate?: (data: any) => void;
  onSubmit?: (data: {
    triggerType: TriggerType;
    config: TriggerConfig;
    segmentId?: string;
  }) => void;
  onCancel?: () => void;
}

export function TriggerConfigForm({
  initialData,
  onUpdate,
  onSubmit,
  onCancel,
}: TriggerConfigFormProps) {
  const [triggerType, setTriggerType] = useState<TriggerType>(
    initialData?.triggerType || TriggerType.EVENT
  );

  const form = useForm<TriggerConfigFormData>({
    resolver: zodResolver(triggerConfigSchema),
    defaultValues: {
      triggerType: initialData?.triggerType || TriggerType.EVENT,
      segmentId: initialData?.segmentId,
      config: initialData?.config || {},
    },
  });

  const handleSubmit = (data: TriggerConfigFormData) => {
    const submitData = {
      triggerType: data.triggerType,
      config: data.config,
      segmentId: data.segmentId,
    };
    
    if (onUpdate) {
      onUpdate(submitData);
    }
    
    if (onSubmit) {
      onSubmit(submitData);
    }
  };

  const handleTriggerTypeChange = (value: TriggerType) => {
    setTriggerType(value);
    form.setValue('triggerType', value);
    // Reset config when trigger type changes
    form.setValue('config', {});
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Trigger Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Trigger Type
            </CardTitle>
            <CardDescription>
              Select when this automation should be triggered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="triggerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleTriggerTypeChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TriggerType.EVENT}>
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Event-Based
                        </span>
                      </SelectItem>
                      <SelectItem value={TriggerType.BEHAVIOR}>
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Behavior-Based
                        </span>
                      </SelectItem>
                      <SelectItem value={TriggerType.TIME_BASED}>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time-Based
                        </span>
                      </SelectItem>
                      <SelectItem value={TriggerType.ATTRIBUTE}>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Attribute Change
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Segment Selection */}
            <FormField
              control={form.control}
              name="segmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Segment (Optional)</FormLabel>
                  <Select value={field.value || 'all'} onValueChange={(value) => field.onChange(value === 'all' ? undefined : value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All subscribers" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All subscribers</SelectItem>
                      {/* TODO: Load segments from API */}
                      <SelectItem value="segment-1">Active Subscribers</SelectItem>
                      <SelectItem value="segment-2">VIP Customers</SelectItem>
                      <SelectItem value="segment-3">Recent Signups</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optionally limit this automation to a specific segment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Trigger-Specific Configuration */}
        {triggerType === TriggerType.EVENT && (
          <EventTriggerConfigSection form={form} />
        )}
        {triggerType === TriggerType.BEHAVIOR && (
          <BehaviorTriggerConfigSection form={form} />
        )}
        {triggerType === TriggerType.TIME_BASED && (
          <TimeBasedTriggerConfigSection form={form} />
        )}
        {triggerType === TriggerType.ATTRIBUTE && (
          <AttributeTriggerConfigSection form={form} />
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Continue to Workflow</Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * Event Trigger Configuration Section
 */
function EventTriggerConfigSection({ form }: { form: any }) {
  const [selectedEvents, setSelectedEvents] = useState<TriggerEvent[]>(
    form.getValues('config.events') || []
  );

  const toggleEvent = (event: TriggerEvent) => {
    const updated = selectedEvents.includes(event)
      ? selectedEvents.filter((e) => e !== event)
      : [...selectedEvents, event];
    setSelectedEvents(updated);
    form.setValue('config.events', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Configuration</CardTitle>
        <CardDescription>
          Select one or more events that will trigger this automation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {triggerEventGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h4 className="text-sm font-medium">{group.title}</h4>
            <div className="space-y-2">
              {group.events.map((event) => {
                const checkboxId = `event-${event.value}`;
                return (
                  <div
                    key={event.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={checkboxId}
                      disabled={!event.event}
                      checked={event.event ? selectedEvents.includes(event.event) : false}
                      onCheckedChange={() => { if (event.event) toggleEvent(event.event); }}
                    />
                    <label 
                      htmlFor={checkboxId}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {event.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {selectedEvents.length === 0 && (
          <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
            <Info className="h-5 w-5 mx-auto mb-2" />
            Select at least one event to trigger this automation
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Behavior Trigger Configuration Section
 */
function BehaviorTriggerConfigSection({ form }: { form: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Configuration</CardTitle>
        <CardDescription>
          Configure behavior-based trigger conditions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="config.behaviorType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Behavior Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select behavior" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cart_abandonment">
                    Cart Abandonment
                  </SelectItem>
                  <SelectItem value="inactive_subscriber">
                    Inactive Subscriber
                  </SelectItem>
                  <SelectItem value="browsing_pattern">
                    Browsing Pattern
                  </SelectItem>
                  <SelectItem value="purchase_behavior">
                    Purchase Behavior
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.timeWindow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Window (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                How long to wait before triggering the automation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Time-Based Trigger Configuration Section
 */
function TimeBasedTriggerConfigSection({ form }: { form: any }) {
  const scheduleType = form.watch('config.scheduleType');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time-Based Configuration</CardTitle>
        <CardDescription>
          Schedule when this automation should run
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="config.scheduleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormDescription>Time of day to send (24-hour format)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {scheduleType === 'weekly' && (
          <FormField
            control={form.control}
            name="config.dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Week</FormLabel>
                <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {scheduleType === 'monthly' && (
          <FormField
            control={form.control}
            name="config.dayOfMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Month</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(scheduleType === 'birthday' || scheduleType === 'anniversary') && (
          <>
            <FormField
              control={form.control}
              name="config.dateField"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Field</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="custom_date">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="config.offsetDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offset Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Days before (-) or after (+) the date (0 = on the date)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Attribute Trigger Configuration Section
 */
function AttributeTriggerConfigSection({ form }: { form: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attribute Change Configuration</CardTitle>
        <CardDescription>
          Trigger when a subscriber attribute changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="config.attribute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attribute</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select attribute" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                  <SelectItem value="custom_field">Custom Field</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.changeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Change Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select change type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="any">Any change</SelectItem>
                  <SelectItem value="specific">Specific value</SelectItem>
                  <SelectItem value="increased">Increased</SelectItem>
                  <SelectItem value="decreased">Decreased</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('config.changeType') === 'specific' && (
          <>
            <FormField
              control={form.control}
              name="config.oldValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old Value (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Previous value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="config.newValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Value</FormLabel>
                  <FormControl>
                    <Input placeholder="New value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

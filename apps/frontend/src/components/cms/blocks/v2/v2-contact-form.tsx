'use client';

/**
 * V2 Contact Form Block
 * Contact form with validation and submission
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Send, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContactInfo {
    icon?: 'mail' | 'phone' | 'location';
    label?: string;
    value?: string;
    href?: string;
}

export interface V2ContactFormProps {
    heading?: string;
    subheading?: string;
    showContactInfo?: boolean;
    contactInfo?: ContactInfo[];
    submitButtonText?: string;
    successMessage?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    className?: string;
}

const iconMap = {
    mail: Mail,
    phone: Phone,
    location: MapPin,
};

export function V2ContactForm({
    heading = 'İletişime Geçin',
    subheading = 'Sorularınız için bize ulaşın, en kısa sürede dönüş yapacağız.',
    showContactInfo = true,
    contactInfo = [
        { icon: 'mail', label: 'E-posta', value: 'info@example.com', href: 'mailto:info@example.com' },
        { icon: 'phone', label: 'Telefon', value: '+90 212 123 45 67', href: 'tel:+902121234567' },
        { icon: 'location', label: 'Adres', value: 'İstanbul, Türkiye', href: '' },
    ],
    submitButtonText = 'Mesaj Gönder',
    successMessage = 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.',
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    accentColor = '#4f46e5',
    className,
}: V2ContactFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <motion.div
                    className="text-center mb-12 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {heading && (
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            {heading}
                        </h2>
                    )}
                    {subheading && (
                        <p className="text-lg opacity-70">
                            {subheading}
                        </p>
                    )}
                </motion.div>

                <div className={cn(
                    'grid gap-12',
                    showContactInfo ? 'md:grid-cols-5' : 'max-w-2xl mx-auto'
                )}>
                    {/* Contact Info */}
                    {showContactInfo && (
                        <motion.div
                            className="md:col-span-2 space-y-6"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="text-xl font-semibold mb-6">İletişim Bilgileri</h3>

                            {contactInfo?.map((info, index) => {
                                const IconComponent = info.icon ? iconMap[info.icon] : Mail;

                                return (
                                    <div key={index} className="flex items-start gap-4">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${accentColor}15` }}
                                        >
                                            <IconComponent
                                                className="w-5 h-5"
                                                style={{ color: accentColor }}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium opacity-60">{info.label}</p>
                                            {info.href ? (
                                                <a
                                                    href={info.href}
                                                    className="font-medium hover:underline"
                                                    style={{ color: accentColor }}
                                                >
                                                    {info.value}
                                                </a>
                                            ) : (
                                                <p className="font-medium">{info.value}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Form */}
                    <motion.div
                        className={cn(showContactInfo ? 'md:col-span-3' : '')}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <AnimatePresence mode="wait">
                            {isSubmitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
                                >
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-lg text-green-800">{successMessage}</p>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    onSubmit={handleSubmit}
                                    className="bg-gray-50 rounded-2xl p-8 space-y-6"
                                >
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Ad Soyad *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                placeholder="Adınız Soyadınız"
                                                className="h-12"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-posta *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="ornek@email.com"
                                                className="h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefon</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+90 5XX XXX XX XX"
                                                className="h-12"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Konu *</Label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                placeholder="Mesajınızın konusu"
                                                className="h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Mesajınız *</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            placeholder="Mesajınızı buraya yazın..."
                                            rows={5}
                                            className="resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full md:w-auto"
                                        disabled={isSubmitting}
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Gönderiliyor...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Send className="w-4 h-4" />
                                                {submitButtonText}
                                            </span>
                                        )}
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default V2ContactForm;

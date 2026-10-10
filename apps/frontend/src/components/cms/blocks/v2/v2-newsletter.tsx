'use client';

/**
 * V2 Newsletter Block
 * Email subscription form with validation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface V2NewsletterProps {
    heading?: string;
    subheading?: string;
    placeholder?: string;
    buttonText?: string;
    successMessage?: string;
    variant?: 'inline' | 'stacked' | 'card';
    showIcon?: boolean;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    className?: string;
}

export function V2Newsletter({
    heading = 'Bültenimize Abone Olun',
    subheading = 'En son haberler, güncellemeler ve özel teklifler için e-posta listemize katılın.',
    placeholder = 'E-posta adresiniz',
    buttonText = 'Abone Ol',
    successMessage = 'Başarıyla abone oldunuz! Teşekkürler.',
    variant = 'inline',
    showIcon = true,
    backgroundColor = '#1a1a2e',
    textColor = '#ffffff',
    accentColor = '#4f46e5',
    className,
}: V2NewsletterProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('Lütfen geçerli bir e-posta adresi girin.');
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const FormContent = () => (
        <AnimatePresence mode="wait">
            {isSubmitted ? (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 text-green-400"
                >
                    <CheckCircle className="w-6 h-6" />
                    <span>{successMessage}</span>
                </motion.div>
            ) : (
                <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className={cn(
                        variant === 'inline' && 'flex gap-3',
                        variant === 'stacked' && 'space-y-3'
                    )}
                >
                    <div className="relative flex-1">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={placeholder}
                            className={cn(
                                'h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50',
                                variant === 'card' && 'bg-white text-gray-900 border-gray-200 placeholder:text-gray-400'
                            )}
                        />
                        {error && (
                            <p className="absolute -bottom-6 left-0 text-red-400 text-sm">
                                {error}
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className={cn(
                            'h-12 px-8',
                            variant === 'stacked' && 'w-full'
                        )}
                        style={{ backgroundColor: accentColor }}
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            buttonText
                        )}
                    </Button>
                </motion.form>
            )}
        </AnimatePresence>
    );

    // Card variant
    if (variant === 'card') {
        return (
            <section
                className={cn('py-16 md:py-24 px-4', className)}
                style={{ backgroundColor: '#f8fafc', color: '#1a1a2e' }}
            >
                <motion.div
                    className="container mx-auto max-w-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div
                        className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
                        style={{ backgroundColor, color: textColor }}
                    >
                        {/* Background decoration */}
                        <div
                            className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-30"
                            style={{ backgroundColor: accentColor }}
                        />

                        <div className="relative z-10 text-center">
                            {showIcon && (
                                <div
                                    className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                                    style={{ backgroundColor: `${accentColor}30` }}
                                >
                                    <Sparkles className="w-8 h-8" style={{ color: accentColor }} />
                                </div>
                            )}

                            {heading && (
                                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                                    {heading}
                                </h2>
                            )}
                            {subheading && (
                                <p className="text-base opacity-70 mb-8 max-w-md mx-auto">
                                    {subheading}
                                </p>
                            )}

                            <div className="max-w-md mx-auto">
                                <FormContent />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>
        );
    }

    // Inline or Stacked variant
    return (
        <section
            className={cn('py-12 md:py-16 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <motion.div
                className="container mx-auto max-w-4xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <div className={cn(
                    'flex flex-col gap-6',
                    variant === 'inline' && 'md:flex-row md:items-center md:justify-between'
                )}>
                    {/* Text */}
                    <div className={cn(variant === 'inline' ? 'md:max-w-md' : 'text-center max-w-2xl mx-auto')}>
                        <div className="flex items-center gap-3 mb-2">
                            {showIcon && variant === 'inline' && (
                                <Mail className="w-6 h-6 opacity-70" />
                            )}
                            {heading && (
                                <h2 className="text-xl md:text-2xl font-bold">
                                    {heading}
                                </h2>
                            )}
                        </div>
                        {subheading && (
                            <p className="text-sm opacity-70">
                                {subheading}
                            </p>
                        )}
                    </div>

                    {/* Form */}
                    <div className={cn(
                        variant === 'inline' ? 'md:w-96' : 'max-w-md mx-auto w-full',
                        error && 'pb-6'
                    )}>
                        <FormContent />
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

export default V2Newsletter;

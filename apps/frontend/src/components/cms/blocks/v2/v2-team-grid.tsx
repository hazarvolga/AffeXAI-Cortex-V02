'use client';

/**
 * V2 Team Grid Block
 * Team members display with social links
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export interface TeamMember {
    name?: string;
    role?: string;
    image?: string;
    bio?: string;
    social?: {
        linkedin?: string;
        twitter?: string;
        email?: string;
    };
}

export interface V2TeamGridProps {
    heading?: string;
    subheading?: string;
    members?: TeamMember[];
    columns?: 2 | 3 | 4;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    className?: string;
}

export function V2TeamGrid({
    heading = 'Ekibimiz',
    subheading = 'Başarımızın arkasındaki profesyonel ekibimizle tanışın',
    members = [
        {
            name: 'Ahmet Yılmaz',
            role: 'CEO & Kurucu',
            image: '',
            bio: '15+ yıl sektör deneyimi',
            social: { linkedin: '#', twitter: '#', email: 'ahmet@example.com' }
        },
        {
            name: 'Ayşe Demir',
            role: 'CTO',
            image: '',
            bio: 'Teknoloji ve inovasyon uzmanı',
            social: { linkedin: '#', email: 'ayse@example.com' }
        },
        {
            name: 'Mehmet Kaya',
            role: 'Tasarım Direktörü',
            image: '',
            bio: 'Ödüllü UX/UI tasarımcısı',
            social: { linkedin: '#', twitter: '#' }
        },
    ],
    columns = 3,
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    accentColor = '#4f46e5',
    className,
}: V2TeamGridProps) {
    const columnClasses = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-2 lg:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4',
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
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

                {/* Team Grid */}
                <motion.div
                    className={cn('grid gap-8', columnClasses[columns])}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {members?.map((member, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="group relative bg-gray-50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/5] overflow-hidden">
                                {member.image ? (
                                    <Image
                                        src={member.image}
                                        alt={member.name || ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <span className="text-6xl font-bold text-gray-400">
                                            {member.name?.charAt(0) || 'T'}
                                        </span>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    {member.bio && (
                                        <p className="text-white text-sm leading-relaxed">
                                            {member.bio}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                                <p
                                    className="text-sm font-medium mb-4"
                                    style={{ color: accentColor }}
                                >
                                    {member.role}
                                </p>

                                {/* Social Links */}
                                {member.social && (
                                    <div className="flex gap-3">
                                        {member.social.linkedin && (
                                            <a
                                                href={member.social.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.social.twitter && (
                                            <a
                                                href={member.social.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                            >
                                                <Twitter className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.social.email && (
                                            <a
                                                href={`mailto:${member.social.email}`}
                                                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default V2TeamGrid;

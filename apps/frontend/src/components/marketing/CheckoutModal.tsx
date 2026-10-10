'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, CheckCircle, ShieldCheck, Lock } from 'lucide-react';
import { Product } from '@/lib/mock-data/products';

interface CheckoutModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !product) return null;

    const handlePurchase = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setStep(2); // Success state
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[#0a0a0a] border border-[#f9bc06]/30 w-full max-w-lg shadow-[0_0_50px_rgba(249,188,6,0.1)] pointer-events-auto relative overflow-hidden">

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {step === 1 ? (
                                <div className="p-8">
                                    <div className="mb-8 border-b border-[#f9bc06]/20 pb-6">
                                        <span className="text-[#f9bc06] text-[10px] font-mono tracking-widest uppercase block mb-2">Initialize Authorization</span>
                                        <h2 className="text-white text-2xl font-bold uppercase tracking-tighter">{product.name} Tier</h2>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <span className="text-3xl font-mono text-white">{product.price}</span>
                                            <span className="text-[#554e3a] text-xs font-mono uppercase">/ ANNUM</span>
                                        </div>
                                    </div>

                                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handlePurchase(); }}>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-[#f9bc06]">Institutional ID (Email)</label>
                                            <input type="email" placeholder="admin@organization.com" className="w-full bg-[#111] border border-[#333] p-3 text-sm text-white focus:border-[#f9bc06] focus:outline-none transition-colors" required />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] uppercase tracking-widest text-[#f9bc06] flex items-center gap-2">
                                                <CreditCard className="w-3 h-3" /> Payment Method
                                            </label>
                                            <div className="p-4 border border-[#333] bg-[#111] flex items-center gap-4 opacity-50 cursor-not-allowed">
                                                <div className="w-8 h-5 bg-[#333] rounded"></div>
                                                <span className="text-xs text-white/40 font-mono">**** **** **** 4242</span>
                                                <Lock className="w-3 h-3 ml-auto text-white/20" />
                                            </div>
                                            <p className="text-[10px] text-[#554e3a]">Payment gateway mocked for demonstration.</p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="w-full bg-[#f9bc06] text-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-wait relative overflow-hidden"
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                                    Processing...
                                                </div>
                                            ) : 'Confirm Authorization'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-12 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-[#f9bc06]/10 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle className="w-10 h-10 text-[#f9bc06]" />
                                    </div>
                                    <h2 className="text-white text-2xl font-bold uppercase tracking-tighter mb-4">Request Acknowledged</h2>
                                    <p className="text-[#bbb39b] text-sm leading-relaxed max-w-xs mb-8">
                                        Your access request for {product.name} Tier has been logged in the neural ledger. Our ops team will verify your credentials shortly.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="bg-transparent border border-[#f9bc06] text-[#f9bc06] hover:bg-[#f9bc06] hover:text-black px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all"
                                    >
                                        Return to Console
                                    </button>
                                </div>
                            )}

                            {/* Secure Footer */}
                            <div className="bg-[#050505] p-3 flex justify-center items-center gap-2 border-t border-[#f9bc06]/10">
                                <ShieldCheck className="w-3 h-3 text-[#f9bc06]" />
                                <span className="text-[9px] text-[#554e3a] font-mono uppercase tracking-widest">
                                    256-BIT ENCRYPTED QUANTUM TUNNEL
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

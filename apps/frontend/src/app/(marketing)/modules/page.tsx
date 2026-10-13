"use client";

import React from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  ModuleStatusBadge,
  ProductPhaseLine,
} from "@/components/marketing/ModuleStatusBadge";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { EARLY_ACCESS_ANCHOR } from "@/lib/marketing/contact";
import type { MarketedModule } from "@/lib/marketing/module-status";

// Load Fonts (Inter for that institutional look)
const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function ModulesPage() {
  return (
    <div
      className={`min-h-screen bg-[#050505] text-white selection:bg-[#f9f906] selection:text-black font-sans ${inter.variable}`}
    >
      <MarketingHeader active="modules" />

      <main lang="en" className="px-4 sm:px-6 lg:px-20 pb-20">
        {/* Monolithic Typographic Statement */}
        <div className="pt-24 pb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-white font-[100] text-[12vw] lg:text-[6vw] leading-[0.9] tracking-tighter max-w-[90%]"
          >
            ARTIFICIAL INTELLIGENCE
            <br />
            MARKETING INTELLIGENCE.
          </motion.h1>
          <ProductPhaseLine />
        </div>

        {/* Asymmetric Editorial Spread */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-32">
          {/* Left Column: Metadata (Sticky) */}
          <div className="hidden lg:block">
            <div className="sticky top-10 border-l border-[#1a1a1a] pl-6 space-y-12">
              <div>
                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">
                  Module Index
                </p>
                <p className="text-xs text-[#999] font-mono">[01-08]</p>
              </div>
            </div>
          </div>

          {/* Right Column: The 'What' */}
          <div className="space-y-32">
            <div className="max-w-3xl">
              <p className="text-[#e5e5e5] text-xl md:text-2xl font-[200] leading-relaxed">
                A neutral infrastructure for market verification. The platform
                serves as a declarative system for data provenance and trust
                validation within complex AI ecosystems.
              </p>
            </div>

            {/* Public Capabilities (Rigid Grid) */}
            <section>
              <h2 className="text-white text-[10px] uppercase tracking-[0.3em] border-b border-[#1a1a1a] pb-6 mb-0">
                Functional Capabilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 border-l border-[#1a1a1a]">
                {(
                  [
                    {
                      id: "01",
                      name: "SOCIAL_ARRAY",
                      desc: "Omni-channel signal monitoring and response matrix.",
                      module: "social-media",
                    },
                    {
                      id: "02",
                      name: "EVENT_HORIZON",
                      desc: "Physical and digital gathering orchestration system.",
                      module: "events",
                    },
                    {
                      id: "03",
                      name: "CAMPAIGN_RELAY",
                      desc: "High-volume outbound communication dispatcher.",
                      module: "email-marketing",
                    },
                    {
                      id: "04",
                      name: "SUPPORT_NEXUS",
                      desc: "Customer resolution and issue tracking core.",
                      module: "tickets",
                    },
                    {
                      id: "05",
                      name: "KNOWLEDGE_CORE",
                      desc: "Self-learning information architecture.",
                      module: "faq-learning",
                    },
                    {
                      id: "06",
                      name: "CERT_AUTHORITY",
                      desc: "Event and training certificate issuance and verification.",
                      module: "certificates",
                    },
                    {
                      id: "07",
                      name: "VALIDATION_GATE",
                      desc: "Real-time syntax and deliverability verification.",
                      module: "mail",
                    },
                    {
                      id: "08",
                      name: "THREAT_INDEX",
                      desc: "Global blocklist monitoring and sender score analysis.",
                      module: "mail",
                    },
                  ] satisfies {
                    id: string;
                    name: string;
                    desc: string;
                    module: MarketedModule;
                  }[]
                ).map((module, idx) => (
                  <div
                    key={idx}
                    className="p-10 border-r border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors group min-h-[240px] flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-[#444] block mb-4 group-hover:text-[#f9f906] transition-colors">
                        {module.id}.
                      </span>
                      <ModuleStatusBadge module={module.module} />
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-medium mb-3 tracking-tight group-hover:text-[#f9f906] transition-colors">
                        {module.name}
                      </h3>
                      <p className="text-[#888] text-sm leading-relaxed font-light">
                        {module.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <p
              lang="tr"
              className="max-w-3xl text-sm leading-relaxed text-[#a3a3a3]"
            >
              {getPublicCopy().moduleStatusNote}
            </p>
          </div>
        </div>

        {/* Access Threshold Section */}
        <section className="mt-40 pt-20 border-t border-[#1a1a1a]">
          <div className="max-w-4xl mx-auto text-center py-24 bg-[#080808] border border-[#1a1a1a] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#f9f906]/50 to-transparent opacity-30"></div>

            <h2 className="text-white text-3xl font-[200] mb-4">
              Access Threshold
            </h2>
            <p lang="tr" className="text-[#a3a3a3] text-sm mb-12">
              {getPublicCopy().productPhase}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 px-10">
              <Link
                href={EARLY_ACCESS_ANCHOR}
                lang="tr"
                className="min-w-[200px] h-14 flex items-center justify-center bg-[#f9f906] text-black text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
              >
                {getPublicCopy().requestAccess}
              </Link>
              <Link
                href="/login"
                lang="tr"
                className="min-w-[200px] h-14 flex items-center justify-center bg-[#1a1a1a] border border-[#333] text-white text-xs font-bold uppercase tracking-widest hover:border-[#666] transition-all"
              >
                {getPublicCopy().nav.login}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

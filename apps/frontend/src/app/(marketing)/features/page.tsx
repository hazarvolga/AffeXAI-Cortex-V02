"use client";

import React from "react";
import Link from "next/link";
import { Public_Sans } from "next/font/google";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { EARLY_ACCESS_ANCHOR } from "@/lib/marketing/contact";

// Load Fonts
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700"],
  variable: "--font-public-sans",
});

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.8, ease: "easeOut" },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-10%" },
};

const sectionVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, ease: "easeOut" },
  },
} as const;

export default function FeaturesPage() {
  return (
    <div
      className={`relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#0a0a0a] text-white/90 selection:bg-[#f9bc06]/30 ${publicSans.variable} font-sans`}
    >
      <div className="flex h-full grow flex-col">
        <MarketingHeader active="features" />

        {/* Hero Section: The Single Line */}
        <main
          lang="en"
          className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full text-center"
          >
            <h1 className="text-white font-light text-[32px] md:text-[42px] leading-relaxed kerning-wide opacity-80">
              This system engineers the living equilibrium of brand perception.
            </h1>
          </motion.div>
        </main>

        {/* Section 2: What This System Observes */}
        <section
          lang="en"
          className="py-32 px-4 sm:px-10 max-w-7xl mx-auto w-full"
        >
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar: Intelligence Architecture */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              variants={sectionVariants}
              className="col-span-12 md:col-span-4 mb-16"
            >
              <h2 className="text-[#f9bc06] text-xs uppercase tracking-[0.4em] font-bold mb-8">
                INTELLIGENCE ARCHITECTURE
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                The orchestration of invisible signals into a unified,
                predictive brand command center.
              </p>
            </motion.div>

            {/* Feature Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-10%" }}
              className="col-span-12 md:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-12"
            >
              {/* Feature 1 */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 border-t border-white/5 pt-8 hover:border-[#f9bc06]/30 transition-colors duration-500"
              >
                <h3 className="text-white text-xl font-light tracking-tight">
                  Signal Convergence
                </h3>
                <p className="text-white/50 text-sm font-normal leading-loose max-w-sm">
                  Synthesizing disparate interaction vectors—support tickets,
                  social sentiment, and campaign telemetry—into a singular
                  truth.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 border-t border-white/5 pt-8 lg:mt-24 hover:border-[#f9bc06]/30 transition-colors duration-500"
              >
                <h3 className="text-white text-xl font-light tracking-tight">
                  Semantic Resonance
                </h3>
                <p className="text-white/50 text-sm font-normal leading-loose max-w-sm">
                  Aligning every outbound communication with the precise
                  emotional frequency of your audience using generative
                  coherence.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 border-t border-white/5 pt-8 hover:border-[#f9bc06]/30 transition-colors duration-500"
              >
                <h3 className="text-white text-xl font-light tracking-tight">
                  Predictive Continuity
                </h3>
                <p className="text-white/50 text-sm font-normal leading-loose max-w-sm">
                  Anticipating customer needs and market shifts before they
                  manifest, ensuring the brand remains in a state of perpetual
                  relevance.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 border-t border-white/5 pt-8 md:mt-24 hover:border-[#f9bc06]/30 transition-colors duration-500"
              >
                <h3 className="text-white text-xl font-light tracking-tight">
                  Contextual Archaeology
                </h3>
                <p className="text-white/50 text-sm font-normal leading-loose max-w-sm">
                  Mining historical interaction strata to reconstruct the causal
                  chains of brand loyalty and churn with high-fidelity
                  precision.
                </p>
              </motion.div>

              {/* Feature 5 */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 border-t border-white/5 pt-8 lg:mt-0 hover:border-[#f9bc06]/30 transition-colors duration-500"
              >
                <h3 className="text-white text-xl font-light tracking-tight">
                  Sentiment Geodesy
                </h3>
                <p className="text-white/50 text-sm font-normal leading-loose max-w-sm">
                  Mapping the emotional terrain of your market across
                  demographics, identifying localized high-pressure zones and
                  opportunities.
                </p>
              </motion.div>

              {/* Feature 6 */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 border-t border-white/5 pt-8 md:mt-24 hover:border-[#f9bc06]/30 transition-colors duration-500"
              >
                <h3 className="text-white text-xl font-light tracking-tight">
                  Neural Calibration
                </h3>
                <p className="text-white/50 text-sm font-normal leading-loose max-w-sm">
                  Real-time adjustment of brand voice micro-parameters to
                  maintain equilibrium with the shifting collective
                  consciousness.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: How Intelligence Manifests */}
        <section
          lang="en"
          className="py-48 px-4 sm:px-10 bg-white/[0.02] border-y border-white/5"
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={sectionVariants}
            className="max-w-5xl mx-auto flex flex-col gap-24"
          >
            <div className="flex flex-col gap-6">
              <span className="text-[#f9bc06]/50 text-[10px] uppercase tracking-[0.5em]">
                System Manifesto 01
              </span>
              <h2 className="text-white text-4xl md:text-6xl font-bold tracking-tighter leading-none max-w-3xl">
                Growth is not managed;
                <br />
                it is orchestrated.
              </h2>
            </div>
            <div className="flex flex-col gap-6 self-end text-right">
              <span className="text-[#f9bc06]/50 text-[10px] uppercase tracking-[0.5em]">
                System Manifesto 02
              </span>
              <h2 className="text-white text-4xl md:text-6xl font-bold tracking-tighter leading-none max-w-3xl">
                Perception is the only
                <br />
                true asset.
              </h2>
            </div>
          </motion.div>
        </section>

        {/* Interaction Threshold */}
        <section className="py-64 px-4 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="flex flex-col items-center gap-12"
          >
            <div className="h-16 w-[1px] bg-[#f9bc06]"></div>
            <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
              <Link
                href="/modules"
                lang="tr"
                className="text-white/40 hover:text-[#f9bc06] transition-all duration-700 text-xs uppercase tracking-[0.3em] font-light group"
              >
                {getPublicCopy().nav.modules}
                <div className="h-[1px] w-0 group-hover:w-full bg-[#f9bc06] mt-2 transition-all duration-500"></div>
              </Link>
              <div className="w-2 h-2 rounded-full bg-[#f9bc06]/20"></div>
              <Link
                href={EARLY_ACCESS_ANCHOR}
                lang="tr"
                className="text-white font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:scale-105 transition-transform"
              >
                {getPublicCopy().requestAccess}
                <ArrowRight
                  aria-hidden="true"
                  className="text-[#f9bc06] w-5 h-5"
                />
              </Link>
            </div>
          </motion.div>
        </section>

        <MarketingFooter />
      </div>
    </div>
  );
}

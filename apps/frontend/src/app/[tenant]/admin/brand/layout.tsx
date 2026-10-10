"use client";

import { ReactNode } from "react";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { FloatingSlimNav } from "@/components/brand/FloatingSlimNav";

/**
 * Shared layout for all Brand Communication Center modules.
 * Standardizes the Editorial interface and navigation.
 */
export default function BrandCenterLayout({ children }: { children: ReactNode }) {
    return (
        <BccEditorialWrapper
            theme="tenant-admin"
            headerTitle="Brand Intelligence"
            headerSubtitle="Mapping global brand perception and emotional resonance."
            headerBadge="Neural Intelligence"
            telemetryData={[
                { label: "Resonance", value: "85.2", suffix: "%" },
                { label: "Clarity", value: "0.92", suffix: "IDX" },
                { label: "Nodes", value: "1,247", color: "#ff8c00" }
            ]}
        >
            <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
                {children}
            </div>
        </BccEditorialWrapper>
    );
}

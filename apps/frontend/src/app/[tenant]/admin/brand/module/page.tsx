"use client";

import React from "react";
import { DistributionFlowTile } from "@/components/brand/DistributionIntelligenceTiles";
import { ModuleSmallMetrics } from "@/components/brand/ModuleMetricTiles";

import {
  UserEcosystemTile,
  RoleDistributionTile,
} from "@/components/brand/OverviewIntegrationTiles";
import {
  BccEventsTrendTile,
  BccSocialEngagementTile,
  BccSupportPerformanceTile,
  BccContentAssetTile,
} from "@/components/brand/OrchestratedAnalyticsTiles";
import {
  BccAiInsightsTile,
  BccAiStatusTile,
} from "@/components/brand/AiInsightsTiles";

export default function ModuleIntelligencePage() {
  return (
    <div className="mt-0 flex flex-col flex-1 max-w-[1600px] mx-auto w-full">
      {/* Main Bento Grid: Strategic Command Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
        {/* Primary Intelligence: AI Strategic Anchor */}
        <BccAiInsightsTile />

        {/* Infrastructure Overview */}
        <UserEcosystemTile total={1247} subscribers={856} />
        <BccAiStatusTile />

        {/* Performance Metrics */}
        <BccEventsTrendTile />

        {/* Channel Throughput */}
        <DistributionFlowTile type="Email" value="4.2M" />
        <RoleDistributionTile />

        <BccSupportPerformanceTile />

        {/* Security & Content Inventory */}
        <ModuleSmallMetrics />
        <BccContentAssetTile />

        {/* Global Outreach */}
        <BccSocialEngagementTile />
        <DistributionFlowTile type="Social" value="1.2M" />
      </div>
    </div>
  );
}

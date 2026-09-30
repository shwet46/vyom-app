"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchHome,
  fetchOpportunities,
  fetchCampaigns,
  fetchFestivalsContext,
  fetchUdhaarEntries,
  fetchCatalog,
  fetchCustomers,
  fetchGuardrails,
  fetchKitRequests,
  approveOpportunity,
  rejectOpportunity,
  useRealtimeEvents,
} from "../lib/api";
import { Header } from "../components/Header";
import { BottomNav, TabKey } from "../components/BottomNav";
import { GlobalFABs } from "../components/GlobalFABs";
import { CopilotModal } from "../components/CopilotModal";
import { KhataScanModal } from "../components/KhataScanModal";
import { OpportunityModal } from "../components/OpportunityModal";
import { DemoModal } from "../components/DemoModal";
import { HomeTab } from "../components/tabs/HomeTab";
import { GrowTab } from "../components/tabs/GrowTab";
import { FestivalsTab } from "../components/tabs/FestivalsTab";
import { UdhaarTab } from "../components/tabs/UdhaarTab";
import { ShopTab } from "../components/tabs/ShopTab";

export default function MerchantPWA() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  // Real-time SSE listener
  useRealtimeEvents(() => {
    // Queries automatically invalidated on SSE events
  });

  // Queries
  const { data: homeData, refetch: refetchHome } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
  });

  const { data: opportunities = [], refetch: refetchOpps } = useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
  });

  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const { data: festivalContext } = useQuery({
    queryKey: ["festivals"],
    queryFn: fetchFestivalsContext,
  });

  const { data: udhaarEntries = [], refetch: refetchUdhaar } = useQuery({
    queryKey: ["udhaar"],
    queryFn: fetchUdhaarEntries,
  });

  const { data: catalog = [], refetch: refetchCatalog } = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const { data: guardrails, refetch: refetchGuardrails } = useQuery({
    queryKey: ["guardrails"],
    queryFn: fetchGuardrails,
  });

  const { data: kitRequests = [], refetch: refetchKitRequests } = useQuery({
    queryKey: ["kit_requests"],
    queryFn: fetchKitRequests,
  });

  const handleApprove = async (oppId: string) => {
    try {
      await approveOpportunity(oppId);
      refetchHome();
      refetchOpps();
      refetchCampaigns();
    } catch {
      //
    }
  };

  const handleReject = async (oppId: string) => {
    try {
      await rejectOpportunity(oppId);
      refetchHome();
      refetchOpps();
    } catch {
      //
    }
  };

  const handleGlobalRefresh = () => {
    refetchHome();
    refetchOpps();
    refetchCampaigns();
    refetchUdhaar();
    refetchCatalog();
    refetchKitRequests();
    refetchGuardrails();
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-ui text-obsidian selection:bg-sky selection:text-blue">
      {/* 1. Header */}
      <Header onOpenDemo={() => setDemoOpen(true)} />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-5 sm:px-6">
        {activeTab === "home" && (
          <HomeTab
            homeData={homeData}
            onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
            onApproveOpportunity={handleApprove}
            onDismissOpportunity={handleReject}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "grow" && (
          <GrowTab
            opportunities={opportunities}
            campaigns={campaigns}
            onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
            onApproveOpportunity={handleApprove}
            onRejectOpportunity={handleReject}
          />
        )}

        {activeTab === "festivals" && (
          <FestivalsTab
            festivalContext={festivalContext}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "udhaar" && (
          <UdhaarTab
            entries={udhaarEntries}
            onOpenScan={() => setScanOpen(true)}
            onRefresh={refetchUdhaar}
          />
        )}

        {activeTab === "shop" && (
          <ShopTab
            catalog={catalog}
            customers={customers}
            guardrails={guardrails}
            kitRequests={kitRequests}
            onRefresh={handleGlobalRefresh}
          />
        )}
      </main>

      {/* 3. Global Floating Action Buttons */}
      <GlobalFABs
        onOpenVoice={() => setCopilotOpen(true)}
        onOpenCamera={() => setScanOpen(true)}
      />

      {/* 4. Bottom Tab Bar Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingApprovalsCount={opportunities.length}
      />

      {/* 5. Drawers and Modals */}
      <CopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      <KhataScanModal
        isOpen={scanOpen}
        onClose={() => setScanOpen(false)}
        onSuccess={refetchUdhaar}
      />

      <OpportunityModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onApproved={handleGlobalRefresh}
      />

      <DemoModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        onTriggered={handleGlobalRefresh}
      />
    </div>
  );
}

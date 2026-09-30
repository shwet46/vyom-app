"use client";

import React, { useState, useEffect } from "react";
import { useVyomStore } from "../lib/store";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { DesktopSidebar } from "../components/DesktopSidebar";
import { DesktopActivityPanel } from "../components/DesktopActivityPanel";
import { VoiceOverlay } from "../components/VoiceOverlay";
import { OpportunityModal } from "../components/OpportunityModal";
import { OnboardingModal } from "../components/OnboardingModal";
import { DemoModal } from "../components/DemoModal";
import { ToastContainer } from "../components/ToastContainer";
import { InstallPromptBanner } from "../components/InstallPromptBanner";

// Tab Screens
import { HomeTab } from "../components/tabs/HomeTab";
import { OpportunitiesTab } from "../components/tabs/OpportunitiesTab";
import { CampaignsTab } from "../components/tabs/CampaignsTab";
import { UdhaarTab } from "../components/tabs/UdhaarTab";
import { MoreTab } from "../components/tabs/MoreTab";

export default function MerchantPWA() {
  const { activeTab, setActiveTab } = useVyomStore();
  const [demoLabOpen, setDemoLabOpen] = useState(false);

  // Service Worker registration for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("VYOM PWA ServiceWorker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.log("SW registration notice:", err);
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col font-ui text-obsidian selection:bg-sky selection:text-blue">
      {/* 1. Header (Sticky Top Bar) */}
      <Header onOpenDemoLab={() => setDemoLabOpen(true)} />

      {/* 2. Responsive Layout Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex">
        {/* Left Sidebar (Desktop Only) */}
        <DesktopSidebar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4 sm:px-6">
          {activeTab === "aaj" && <HomeTab />}
          {activeTab === "mauke" && <OpportunitiesTab />}
          {activeTab === "campaigns" && <CampaignsTab />}
          {activeTab === "udhaar" && <UdhaarTab />}
          {activeTab === "aur" && <MoreTab />}
        </main>

        {/* Right Activity Panel (Wide Desktop Only) */}
        <DesktopActivityPanel />
      </div>

      {/* 3. Mobile Bottom Tab Bar Navigation */}
      <BottomNav />

      {/* 4. Global Modals & Overlays */}
      <VoiceOverlay />
      <OpportunityModal />
      <OnboardingModal />
      <DemoModal
        isOpen={demoLabOpen}
        onClose={() => setDemoLabOpen(false)}
      />
      <ToastContainer />
      <InstallPromptBanner />
    </div>
  );
}

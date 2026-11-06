import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SidebarNav } from './components/SidebarNav';
import { OverviewPage } from './pages/OverviewPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { EventsPage } from './pages/EventsPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { ReportsPage } from './pages/ReportsPage';
import { ScenarioImportModal } from './components/ScenarioImportModal';
import { GeminiSettingsModal } from './components/GeminiSettingsModal';
import { NetworkScannerModal } from './components/NetworkScannerModal';
import { PrivacyScannerModal } from './components/PrivacyScannerModal';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [incidentInitialView, setIncidentInitialView] = useState<'simple' | 'technical'>('simple');
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean>(false);
  const [dataRefreshKey, setDataRefreshKey] = useState<number>(0);

  const checkGemini = () => {
    api.getGeminiConfig()
      .then((cfg) => setIsGeminiConfigured(cfg.configured))
      .catch(console.error);
  };

  useEffect(() => {
    checkGemini();
  }, []);

  const handleSelectIncident = (id: number) => {
    setSelectedIncidentId(id);
    setIncidentInitialView('simple');
    setActiveTab('incidents');
  };

  const handleSelectIncidentWithView = (id: number, view: 'simple' | 'technical' = 'simple') => {
    setSelectedIncidentId(id);
    setIncidentInitialView(view);
    setActiveTab('incidents');
  };

  const handleBackToList = () => {
    setSelectedIncidentId(null);
  };

  const handleScenarioSuccess = () => {
    setDataRefreshKey((k) => k + 1);
  };

  const handleScanComplete = () => {
    setDataRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#D6DCE5] text-[#14171A] p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-start font-sans selection:bg-[#C4EBE4] selection:text-[#16181C]">
      {/* Outer Master Tablet Enclosure */}
      <div className="w-full max-w-[1580px] bg-[#ECEFF4] rounded-[36px] sm:rounded-[44px] p-3 sm:p-5 lg:p-6 shadow-[0_30px_70px_rgba(15,23,42,0.14),0_0_0_1px_rgba(255,255,255,0.8)] border border-white/60 flex flex-col min-h-[94vh]">
        {/* Top Header Pill Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'incidents') {
              setSelectedIncidentId(null);
            }
          }}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenGemini={() => setIsGeminiOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          isGeminiConfigured={isGeminiConfigured}
        />

        {/* Body Row: Curved Left Dock + Main Area */}
        <div className="flex gap-4 lg:gap-6 flex-1 items-stretch mt-1">
          <SidebarNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab !== 'incidents') {
                setSelectedIncidentId(null);
              }
            }}
          />

          <main className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <OverviewPage
                key={`overview-${dataRefreshKey}`}
                onSelectIncident={handleSelectIncident}
                onOpenImport={() => setIsImportOpen(true)}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenGemini={() => setIsGeminiOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  if (tab !== 'incidents') setSelectedIncidentId(null);
                }}
              />
            )}

            {activeTab === 'incidents' && (
              selectedIncidentId ? (
                <IncidentDetailPage
                  incidentId={selectedIncidentId}
                  initialView={incidentInitialView}
                  onBack={handleBackToList}
                  onViewReports={() => {
                    setSelectedIncidentId(null);
                    setActiveTab('reports');
                  }}
                />
              ) : (
                <IncidentsPage
                  key={`incidents-${dataRefreshKey}`}
                  onSelectIncident={handleSelectIncident}
                  onOpenScanner={() => setIsScannerOpen(true)}
                />
              )
            )}

            {activeTab === 'events' && <EventsPage key={`events-${dataRefreshKey}`} />}

            {activeTab === 'evaluation' && <ModelEvaluationPage />}

            {activeTab === 'reports' && <ReportsPage />}
          </main>
        </div>

        {/* Minimalist Neo Footer */}
        <footer className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#687684] gap-2 px-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-bold text-[#14171A]">Wireless-IDS Wi-Fi Threat Scanner</span>
            <span>•</span>
            <span>Engine: RandomForest v1.4</span>
            <span>•</span>
            <span>Explainability: SHAP &amp; Gemini 2.5</span>
            <span>•</span>
            <span>Scandinavian Cyber Minimalist Architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Wi-Fi Threat Radar Operational • Dual-band Guard</span>
          </div>
        </footer>
      </div>

      {/* Interactive Modals */}
      <ScenarioImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleScenarioSuccess}
      />

      <GeminiSettingsModal
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        onConfigUpdated={checkGemini}
      />

      <NetworkScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectIncident={handleSelectIncidentWithView}
        onScanComplete={handleScanComplete}
      />

      <PrivacyScannerModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};

export default App;


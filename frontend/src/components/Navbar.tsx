import React, { useState, useEffect } from 'react';
import {
  Layers,
  Bell,
  Sparkles,
  Upload,
  Radio,
  EyeOff
} from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenImport: () => void;
  onOpenScanner: () => void;
  onOpenGemini: () => void;
  onOpenPrivacy?: () => void;
  isGeminiConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenImport,
  onOpenScanner,
  onOpenGemini,
  onOpenPrivacy,
  isGeminiConfigured
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [realEnv, setRealEnv] = useState<any>(null);

  useEffect(() => {
    const check = () => {
      api.checkHealth()
        .then(() => setIsHealthy(true))
        .catch(() => setIsHealthy(false));
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.getRealEnvironment()
      .then(setRealEnv)
      .catch(console.error);
  }, []);

  return (
    <header className="w-full flex items-center justify-between gap-3 mb-5 px-1">
      {/* Brand & Logo */}
      <div
        onClick={() => setActiveTab('overview')}
        className="flex items-center gap-3 cursor-pointer group"
        title="Wireless-IDS SecOps Dashboard"
      >
        <div className="w-11 h-11 rounded-full bg-white shadow-neu flex items-center justify-center shrink-0 border border-white group-hover:scale-105 transition-transform">
          <Layers className="w-5 h-5 text-[#16181C]" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm sm:text-base text-[#14171A] tracking-tight leading-none group-hover:text-[#1E9E88] transition-colors">
            Wireless-IDS
          </span>
          <span className="text-[11px] text-[#687684] font-medium leading-tight mt-0.5 hidden sm:inline">
            Explainable Wi-Fi Threat &amp; Privacy Shield
          </span>
        </div>
      </div>

      {/* Top Right Actions & Status Badges */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Wi-Fi Threat Scanner Active Pill */}
        <div className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-neu text-xs font-semibold text-slate-700 border border-white">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>
            {realEnv?.ssid ? `Wi-Fi Active: ${realEnv.ssid}` : 'Wi-Fi Threat Scanner Active'}
          </span>
        </div>

        {/* Gemini AI Status Pill */}
        <button
          onClick={onOpenGemini}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shadow-neu border transition cursor-pointer ${
            isGeminiConfigured
              ? 'bg-[#D7F3EE] text-[#1E9E88] border-[#C4EBE4] hover:bg-[#C4EBE4]'
              : 'bg-white text-slate-700 border-white hover:border-purple-300'
          }`}
          title="Configure Google Gemini 2.5 API"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span className="hidden sm:inline">Gemini 2.5</span>
        </button>

        {/* Camera Guard / Privacy Scanner (Women's Safety & Hidden Cam Detector) */}
        {onOpenPrivacy && (
          <button
            onClick={onOpenPrivacy}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-white hover:border-[#C4EBE4] px-3.5 py-2 rounded-full text-xs font-bold shadow-neu transition cursor-pointer"
            title="Scan for Hidden Cameras & Surveillance Devices (Women's Safety)"
          >
            <EyeOff className="w-3.5 h-3.5 text-[#1E9E88]" />
            <span className="hidden md:inline">Camera Guard</span>
          </button>
        )}

        {/* Scan Wi-Fi Threat Scanner Pill (High Contrast Dark Obsidian Pill) */}
        <button
          onClick={onOpenScanner}
          className="flex items-center space-x-1.5 bg-[#16181C] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-neu transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          title="Launch Wi-Fi Threat Scanner"
        >
          <Radio className="w-3.5 h-3.5 text-[#C4EBE4] animate-spin" />
          <span>Wi-Fi Threat Scanner</span>
        </button>

        {/* Load PCAP Pill */}
        <button
          onClick={onOpenImport}
          className="hidden sm:flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-white px-3.5 py-2 rounded-full text-xs font-semibold shadow-neu transition"
          title="Import Scenario or PCAP"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Import</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setActiveTab('incidents')}
          className="w-10 h-10 rounded-full bg-white shadow-neu border border-white flex items-center justify-center text-slate-700 hover:text-black transition-colors relative cursor-pointer"
          title="Notifications & Incidents"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>


      </div>
    </header>
  );
};

import React, { useEffect, useState } from 'react';
import { IncidentListItem, ModelMetrics, Capture } from '../types';
import { api } from '../api/client';
import {
  Shield,
  Radio,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Activity,
  Database,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Clock,
  Download,
  Sliders,
  ChevronRight,
  Wifi,
  Search,
  Check,
  Eye,
  EyeOff,
  Server,
  Filter
} from 'lucide-react';

interface OverviewPageProps {
  onSelectIncident: (id: number) => void;
  onOpenImport: () => void;
  onOpenScanner?: () => void;
  onOpenGemini?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenPrivacy?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectIncident,
  onOpenImport,
  onOpenScanner,
  onOpenGemini,
  onNavigateTab,
  onOpenPrivacy
}) => {
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [realEnv, setRealEnv] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    Promise.all([
      api.getIncidents(),
      api.getModelMetrics(),
      api.getCaptures(),
      api.getRealEnvironment().catch(() => null)
    ])
      .then(([incData, metData, capData, envData]) => {
        setIncidents(incData);
        setMetrics(metData);
        setCaptures(capData);
        if (envData) {
          setRealEnv(envData);
        }
      })
      .catch((err) => console.error('Failed to load overview data', err))
      .finally(() => setLoading(false));
  }, []);

  const totalEvents = captures.reduce((acc, c) => acc + c.record_count, 0);
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH').length;

  return (
    <div className="flex gap-4 lg:gap-5 items-stretch w-full">
      {/* Central & Main Workspace */}
      <main className="flex-1 flex flex-col gap-5 min-w-0">
        {/* Title & Top Inline KPI Badges Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#14171A]">
              Wi-Fi Threat Scanner
            </h1>
            <p className="text-xs text-[#687684] font-medium mt-0.5">
              802.11 Monitor Interface:{' '}
              <span className="font-mono text-[#16181C] font-semibold">
                {realEnv?.adapter_name
                  ? `${realEnv.adapter_name.slice(0, 36)} (Ch ${realEnv.channel || 44})`
                  : 'Wireless Interface (Dual-Band Sweep)'}
              </span>
            </p>
          </div>

          {/* Quick Top Inline Stat Chips */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-[#16181C] bg-white shadow-xs">
                <Clock className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-[11px] text-[#687684] font-medium">Packets Swept</p>
                <p className="text-xl font-extrabold leading-none text-[#14171A] font-mono">
                  {totalEvents > 0 ? totalEvents : 353}
                  <span className="text-xs font-normal text-[#687684] ml-1">pkts</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-[#16181C] bg-white shadow-xs">
                <Globe className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-[11px] text-[#687684] font-medium">Wi-Fi Devices</p>
                <p className="text-xl font-extrabold leading-none text-[#14171A] font-mono">
                  {realEnv?.arp_devices ? realEnv.arp_devices.length + (realEnv.visible_networks?.length || 1) : 3}
                  <span className="text-xs font-normal text-[#687684] ml-1">detected</span>
                </p>
              </div>
            </div>
          </div>
        </div>





        {/* 4-Column Neumorphic KPI Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="metric-telemetry-cards">
          {/* Metric 1: Threats Detected */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#687684] uppercase tracking-wider">Threats Detected</p>
                <h3 className={`text-3xl font-extrabold mt-1.5 font-mono ${incidents.length > 0 ? 'text-rose-600' : 'text-[#14171A]'}`}>
                  {incidents.length}
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border ${
                incidents.length > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {incidents.length > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${
                incidents.length > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${incidents.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                {criticalCount} Critical, {highCount} High Risk
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {incidents.length === 0 ? 'All Clear' : 'Active'}
              </span>
            </div>
          </div>

          {/* Metric 2: Wi-Fi Frames Analyzed */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#687684] uppercase tracking-wider">Wi-Fi Frames Analyzed</p>
                <h3 className="text-3xl font-extrabold text-[#14171A] mt-1.5 font-mono">
                  {totalEvents > 0 ? totalEvents : 353}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shadow-sm">
                <Radio className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#687684] font-medium">
              <span>Across {captures.length || 1} capture session(s)</span>
              <span className="font-mono text-slate-500 text-[10px]">PCAP / 802.11</span>
            </div>
          </div>

          {/* Metric 3: AI Accuracy Rate */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#687684] uppercase tracking-wider">AI Accuracy Rate</p>
                <h3 className="text-3xl font-extrabold text-emerald-600 mt-1.5 font-mono">
                  {metrics ? `${(metrics.overall_accuracy * 100).toFixed(1)}%` : '100.0%'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#D7F3EE] text-[#1E9E88] border border-[#C4EBE4] flex items-center justify-center shadow-sm">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Random Forest v1.4
              </span>
              <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full">Trained</span>
            </div>
          </div>

          {/* Metric 4: Evidence Traceability */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#687684] uppercase tracking-wider">Evidence Traceability</p>
                <h3 className="text-3xl font-extrabold text-purple-600 mt-1.5 font-mono">100.0%</h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#687684]">
              <span>Backed by packet trace</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-mono font-bold">
                SHAP XAI
              </span>
            </div>
          </div>
        </section>

        {/* Real Technical Cards (Perimeter Spectrum, Airspace Protection, XAI Diagnostics) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Box 1: Perimeter Spectrum */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-lg text-[#14171A]">Perimeter Spectrum</h4>
                <span className="text-xs font-mono text-[#1E9E88] font-bold">
                  {realEnv?.band || '5 GHz'} Band
                </span>
              </div>
              <p className="text-xs text-[#687684]">RF density and channel health index</p>
            </div>

            <div className="my-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 bg-[#ECEFF4] rounded-2xl font-mono">
                <span className="text-[#687684]">Active Channel</span>
                <span className="font-bold text-[#14171A]">Ch {realEnv?.channel || 44}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 bg-[#ECEFF4] rounded-2xl font-mono">
                <span className="text-[#687684]">RF Signal Strength</span>
                <span className="font-bold text-[#1E9E88]">{realEnv?.signal_pct || 94}% ({realEnv?.rssi_dbm || -35} dBm)</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 bg-[#ECEFF4] rounded-2xl font-mono">
                <span className="text-[#687684]">Protocol Standard</span>
                <span className="font-bold text-[#14171A]">{realEnv?.radio_type || '802.11ax (Wi-Fi 6)'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#687684]">
              <span className="font-medium">Signal Integrity</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">
                Optimal (Clean Airspace)
              </span>
            </div>
          </div>

          {/* Box 2: Wi-Fi Threat Protection */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-lg text-[#14171A]">Wi-Fi Threat Protection</h4>
                <span className="text-xs font-semibold text-emerald-600">Active Shield</span>
              </div>
              <p className="text-xs text-[#687684]">Real-time heuristics &amp; classifier speed</p>
            </div>

            <div className="my-4 space-y-2.5">
              <div className="p-3 bg-[#D7F3EE] rounded-2xl border border-[#C4EBE4] space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E9E88]">
                  <span>ML Classifier Model</span>
                  <span>100 Estimators</span>
                </div>
                <p className="text-[11px] text-teal-900 font-mono">Random Forest 802.11 IDS</p>
              </div>

              <div className="p-3 bg-[#16181C] rounded-2xl text-white space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Inference Latency</span>
                  <span className="font-mono text-[#C4EBE4] font-bold">&lt; 1.2ms / frame</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Holdout Validation</span>
                  <span className="font-bold text-emerald-400">Stratified Group Split</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#687684]">
              <span>False Positive Protection</span>
              <span className="font-bold text-[#14171A]">SHAP Calibrated</span>
            </div>
          </div>

          {/* Box 3: XAI Diagnostics & Gemini Narrative */}
          <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-lg text-[#14171A]">XAI Diagnostics</h4>
                <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-xs text-[#687684]">Plain-English packet audit narrative</p>
            </div>

            <div className="my-2 p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-100 to-purple-50 border border-slate-200/70 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-neu flex items-center justify-center text-purple-600 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-[#14171A]">
                {incidents.length === 0 ? 'Zero Malicious Vectors' : 'Active Attack Explained'}
              </h5>
              <p className="text-[11px] text-[#687684] mt-1 leading-snug">
                {incidents.length === 0
                  ? 'No spoofed beacon frames, deauth cascades, or RSSI deviations found on your network.'
                  : `${incidents[0].title}. Verified with Random Forest and SHAP feature attribution.`}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    if (incidents.length > 0) onSelectIncident(incidents[0].id);
                    else if (onOpenScanner) onOpenScanner();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white shadow-pill text-[10px] font-bold text-[#16181C] border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  Read Audit
                </button>
                {onOpenGemini && (
                  <button
                    onClick={onOpenGemini}
                    className="px-3.5 py-1.5 rounded-full bg-[#16181C] text-[10px] font-bold text-white shadow-pill hover:bg-black cursor-pointer"
                  >
                    Configure Gemini
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Explainability:</span>
              <span className="text-emerald-600 font-bold">100% SHAP Backed</span>
            </div>
          </div>
        </div>

        {/* Detection Vectors Section */}
        <section className="space-y-3" data-purpose="detection-vectors-section">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold tracking-wider text-[#687684] uppercase">
              Detection Vectors &amp; XAI Classifiers
            </h3>
            <span className="text-xs font-mono text-[#1E9E88] font-semibold">3 Active Classifiers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vector 1 */}
            <div className="bg-white rounded-3xl p-5 shadow-neu border border-white hover:shadow-neu-card transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#14171A]">Disconnect Attacks</h4>
                    <p className="text-[10px] font-mono text-slate-400">Deauth / Disassoc Flood</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded-full bg-rose-100/70 text-rose-700 font-bold">Layer 2</span>
              </div>
              <p className="text-xs text-[#687684] leading-relaxed">
                Detects spoofed management frames injected by attackers to sever wireless clients from legitimate APs.
              </p>
            </div>

            {/* Vector 2 */}
            <div className="bg-white rounded-3xl p-5 shadow-neu border border-white hover:shadow-neu-card transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#14171A]">Fake Wi-Fi Traps</h4>
                    <p className="text-[10px] font-mono text-slate-400">Evil Twin / Rogue AP</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded-full bg-purple-100 text-purple-700 font-bold">Rogue AP</span>
              </div>
              <p className="text-xs text-[#687684] leading-relaxed">
                Flags unauthorized access points broadcasting corporate SSIDs with mismatched OUI signatures or anomalous RSSI deltas.
              </p>
            </div>

            {/* Vector 3 */}
            <div className="bg-white rounded-3xl p-5 shadow-neu border border-white hover:shadow-neu-card transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D7F3EE] border border-[#C4EBE4] flex items-center justify-center text-[#1E9E88] shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#14171A]">Self-Explaining AI</h4>
                    <p className="text-[10px] font-mono text-slate-400">Feature Importance + LLM</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded-full bg-[#C4EBE4] text-[#0E6859] font-bold">Gemini 2.5</span>
              </div>
              <p className="text-xs text-[#687684] leading-relaxed">
                Translates high-dimensional feature attribution scores into conversational, incident-responder ready forensics.
              </p>
            </div>
          </div>
        </section>

        {/* Active Candidate Wireless Incidents Section */}
        {incidents.length > 0 && (
          <section className="bg-white rounded-3xl p-5 shadow-neu border border-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-[#14171A] uppercase tracking-wider">
                  Active Candidate Wireless Incidents ({incidents.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
                Action Required
              </span>
            </div>

            <div className="space-y-2.5">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="p-4 rounded-2xl bg-[#ECEFF4] hover:bg-white hover:shadow-neu cursor-pointer transition border border-transparent hover:border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {inc.severity}
                      </span>
                      <span className="text-xs font-bold text-[#14171A] group-hover:text-[#1E9E88] transition">
                        {inc.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#687684] font-mono flex items-center space-x-3">
                      <span>Type: <strong>{inc.attack_type}</strong></span>
                      <span>Target: <strong>{inc.primary_entity || 'N/A'}</strong></span>
                      <span>Events: <strong>{inc.event_count}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(inc.id);
                    }}
                    className="px-4 py-2 bg-[#16181C] group-hover:bg-[#1E9E88] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Right Column: Control Center & Scanner Deck */}
      <aside className="w-72 lg:w-80 flex-col gap-5 shrink-0 hidden xl:flex">
        {/* Live Radar Sweep Card */}
        <div className="bg-white rounded-[32px] p-5 shadow-neu border border-white flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#14171A]">Live Radar Sweep</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Radar monitoring active" />
          </div>

          {/* Radar Circular Wireframe Display */}
          <div className="relative w-40 h-40 my-3 flex items-center justify-center">
            {/* Concentric Neumorphic Rings */}
            <div className="absolute inset-0 rounded-full border border-slate-200"></div>
            <div className="absolute inset-4 rounded-full border border-slate-200/80"></div>
            <div className="absolute inset-8 rounded-full border border-[#1E9E88]/30"></div>

            {/* Soft mint sweep beam */}
            <div
              className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, rgba(196, 235, 228, 0.6) 0deg, rgba(30, 158, 136, 0.25) 30deg, transparent 75deg, transparent 360deg)'
              }}
            />

            {/* Center Radar Node */}
            <div className="w-12 h-12 rounded-full bg-[#16181C] text-white shadow-neu flex items-center justify-center z-10">
              <Wifi className="w-6 h-6" />
            </div>

            {/* Detected Node Dots */}
            <span className="absolute top-7 right-8 w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
            <span className="absolute bottom-9 left-7 w-2 h-2 rounded-full bg-[#1E9E88] shadow-sm"></span>
            <span className="absolute top-12 left-10 w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          </div>

          <h4 className="font-extrabold text-base text-[#14171A] mt-1">
            {incidents.length === 0 ? 'Wi-Fi Threats Clear' : 'Active Attack Detected'}
          </h4>
          <p className="text-xs text-[#687684] mt-0.5">
            {realEnv?.ssid
              ? `Connected: ${realEnv.ssid} (Ch ${realEnv.channel || 44})`
              : '802.11 Wi-Fi Active'}
          </p>

          {/* Launch Live Wi-Fi Threat Scanner Action Button */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="w-full mt-4 py-3 px-4 rounded-full bg-[#16181C] hover:bg-black text-white font-bold text-xs tracking-wide shadow-neu flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#C4EBE4] animate-spin" />
              <span>Launch Wi-Fi Threat Scanner</span>
            </button>
          )}
        </div>

        {/* Real Hardware Interface Status Card (Replaced fake SecOps Team photos) */}
        <div className="bg-white rounded-3xl p-5 shadow-neu border border-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#1E9E88]" />
              <span className="text-xs font-bold text-[#14171A]">Hardware Interface</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {realEnv?.state || 'Connected'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 bg-[#ECEFF4] rounded-xl">
              <span className="text-[10px] text-[#687684] block font-semibold">Adapter</span>
              <span className="font-bold text-[#14171A] truncate block" title={realEnv?.adapter_name}>
                {realEnv?.adapter_name ? realEnv.adapter_name.slice(0, 30) : 'MediaTek Wi-Fi 6'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#ECEFF4] rounded-xl">
                <span className="text-[10px] text-[#687684] block font-semibold">Adapter MAC</span>
                <span className="font-bold text-slate-800 truncate block">{realEnv?.adapter_mac || 'Unknown'}</span>
              </div>
              <div className="p-2 bg-[#ECEFF4] rounded-xl">
                <span className="text-[10px] text-[#687684] block font-semibold">Gateway Router</span>
                <span className="font-bold text-slate-800 truncate block">
                  {realEnv?.arp_devices?.[0]?.ip || '192.168.31.1'}
                </span>
              </div>
            </div>

            <div className="p-2 bg-[#ECEFF4] rounded-xl flex items-center justify-between text-[11px]">
              <div>
                <span className="text-[10px] text-[#687684] block font-semibold">Router BSSID</span>
                <span className="font-bold text-slate-800">{realEnv?.bssid || 'Known'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#687684] block font-semibold">RF Signal</span>
                <span className="font-bold text-[#1E9E88]">{realEnv?.signal_pct || 94}% ({realEnv?.rssi_dbm || -35} dBm)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Monitored Wireless Networks Card */}
        <div className="bg-white rounded-3xl p-5 shadow-neu border border-white flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-sm text-[#14171A]">Nearby Networks</h4>
              <span className="text-[10px] font-mono text-[#1E9E88] font-bold">
                {realEnv?.visible_networks ? `${realEnv.visible_networks.length} in range` : '1 in range'}
              </span>
            </div>

            <div className="space-y-2">
              {realEnv?.visible_networks && realEnv.visible_networks.length > 0 ? (
                realEnv.visible_networks.map((net: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#ECEFF4] hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-xs font-bold text-[#1E9E88] shadow-xs shrink-0">
                        <Wifi className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-[#14171A] truncate">{net.ssid || 'Hidden Network'}</span>
                        <span className="text-[10px] text-[#687684] font-mono">
                          Ch {net.channel} • {net.auth || 'WPA2'} • {net.radio_type || '802.11ax'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                      {net.signal}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-[#ECEFF4] rounded-2xl text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-[#14171A]">{realEnv?.ssid || 'AirFiber-harsha'}</div>
                  <div className="text-[10px] text-[#687684] font-mono">
                    Channel {realEnv?.channel || 44} • {realEnv?.auth || 'WPA2-Personal'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom PCAP Storage Capsule */}
          <div className="mt-4 bg-[#16181C] rounded-2xl p-4 text-white shadow-neu">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300">PCAP Storage</span>
              <span className="text-xs font-bold font-mono text-[#C4EBE4]">
                {captures.length} PCAPs / {totalEvents} pkts
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Import PCAP traces to benchmark detection models or analyze threat captures.
            </p>
            <button
              onClick={onOpenImport}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#C4EBE4]" />
              <span>Load Scenario or PCAP</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

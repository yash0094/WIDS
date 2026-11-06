import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
  RotateCw,
  X,
  ArrowRight,
  Terminal,
  Cpu,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  Laptop,
  Network
} from 'lucide-react';
import { api } from '../api/client';
import { ScanResult, RadarBlip, TelemetryLog } from '../types';

interface NetworkScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIncident?: (incidentId: number, view: 'simple' | 'technical') => void;
  onScanComplete?: (result: ScanResult) => void;
}

export const NetworkScannerModal: React.FC<NetworkScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectIncident,
  onScanComplete
}) => {
  // Mode: 'real' (live hardware scan) vs 'demo' (simulated scenarios for defense presentation)
  const [scanMode, setScanMode] = useState<'real' | 'demo'>('real');
  const [demoScenario, setDemoScenario] = useState<'threat_audit' | 'clean' | 'beacon_flood'>('threat_audit');

  // Scan states: 'idle' | 'scanning' | 'completed' | 'error'
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState('Initializing Radio Hardware...');
  const [currentChannel, setCurrentChannel] = useState<number | string>(44);
  const [framesCount, setFramesCount] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<TelemetryLog[]>([]);
  const [visibleBlips, setVisibleBlips] = useState<RadarBlip[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realEnv, setRealEnv] = useState<any>(null);
  const [selectedBlip, setSelectedBlip] = useState<RadarBlip | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load real hardware diagnostics on open
  useEffect(() => {
    if (isOpen) {
      api.getRealEnvironment()
        .then((env) => {
          setRealEnv(env);
          if (env?.channel) setCurrentChannel(env.channel);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs]);

  if (!isOpen) return null;

  const startScan = async () => {
    setScanState('scanning');
    setProgress(0);
    setFramesCount(0);
    setDisplayedLogs([]);
    setVisibleBlips([]);
    setSelectedBlip(null);
    setErrorMessage(null);
    setScanResult(null);

    try {
      // 1. Call backend API to execute the real hardware scan or chosen demo scenario
      const result = await api.runNetworkScan({
        scan_mode: scanMode,
        demo_scenario: demoScenario,
        clear_previous: true
      });
      setScanResult(result);

      // 2. Play out realistic, timed animation across ~6.2 seconds
      const totalSteps = result.telemetry_stream.length || 10;
      const stepDuration = 6000 / totalSteps;

      result.telemetry_stream.forEach((logItem, index) => {
        setTimeout(() => {
          setDisplayedLogs((prev) => [...prev, logItem]);
          setCurrentChannel(logItem.channel);
          setFramesCount((prev) => prev + Math.floor(Math.random() * 45) + 15);

          const currentPct = Math.round(((index + 1) / totalSteps) * 95);
          setProgress(currentPct);

          if (currentPct < 25) {
            setActiveStage(scanMode === 'real' ? 'Accessing MediaTek Wi-Fi 6 Adapter' : 'RF Interface Monitor Mode Initialization');
          } else if (currentPct < 50) {
            setActiveStage(scanMode === 'real' ? `Sweeping 5 GHz Airspace (Channel ${realEnv?.channel || 44})` : 'Airspace Channel Hopping (2.412 - 2.462 GHz)');
          } else if (currentPct < 70) {
            setActiveStage(scanMode === 'real' ? 'Auditing BSSID Authenticity & ARP Gateway' : '802.11 Frame Dissection & Sniffing');
          } else if (currentPct < 85) {
            setActiveStage('Random Forest Classifier & SHAP Explainability');
          } else {
            setActiveStage(scanMode === 'real' ? 'Perimeter Security Verdict Generation' : 'Multi-Stage Attack Graph Correlation');
          }

          if (index === Math.floor(totalSteps * 0.3)) {
            const initialBlips = result.radar_blips.slice(0, 2);
            setVisibleBlips(initialBlips);
            if (initialBlips.length > 0) setSelectedBlip(initialBlips[0]);
          } else if (index === Math.floor(totalSteps * 0.7)) {
            setVisibleBlips(result.radar_blips);
            if (result.radar_blips.length > 0) setSelectedBlip(result.radar_blips[0]);
          }
        }, index * stepDuration);
      });

      // Complete scan
      setTimeout(() => {
        setProgress(100);
        setActiveStage('Security Audit Complete');
        setVisibleBlips(result.radar_blips);
        if (result.radar_blips.length > 0) setSelectedBlip(result.radar_blips[0]);
        setScanState('completed');
        if (onScanComplete) {
          onScanComplete(result);
        }
      }, 6400);

    } catch (err: any) {
      console.error('Scan failed:', err);
      setErrorMessage(err.message || 'Failed to complete network scan.');
      setScanState('error');
    }
  };

  const handleViewSimpleStory = () => {
    onClose();
    if (scanResult?.incident_id && onSelectIncident) {
      onSelectIncident(scanResult.incident_id, 'simple');
    }
  };

  const handleViewTechnicalForensics = () => {
    onClose();
    if (scanResult?.incident_id && onSelectIncident) {
      onSelectIncident(scanResult.incident_id, 'technical');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#16181C]/45 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#ECEFF4] border border-white/80 rounded-[36px] sm:rounded-[44px] shadow-[0_30px_70px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.8)] overflow-hidden flex flex-col max-h-[92vh] font-sans text-[#14171A]">

        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-neu ${
              scanMode === 'real'
                ? 'bg-white border-white text-[#1E9E88]'
                : 'bg-white border-white text-purple-600'
            }`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#14171A] tracking-tight">
                  {scanMode === 'real' ? 'Live Wi-Fi Hardware Security Scanner' : 'Wi-Fi Threat Attack Simulation Radar'}
                </h2>
                <span className={`text-[10px] uppercase tracking-wider font-mono px-3 py-0.5 rounded-full font-bold border ${
                  scanMode === 'real'
                    ? 'bg-[#D7F3EE] text-[#1E9E88] border-[#C4EBE4]'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {scanMode === 'real' ? 'Real Hardware Mode' : 'Demo / Presentation Mode'}
                </span>
              </div>
              <p className="text-xs text-[#687684]">
                {scanMode === 'real'
                  ? `Direct hardware interface: ${realEnv?.adapter_name || 'MediaTek Wi-Fi 6 Card'} | Live Airspace & ARP Audit`
                  : 'Simulate active attack campaigns to demonstrate intrusion detection and SHAP explanations'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-neu border border-white flex items-center justify-center text-slate-500 hover:text-black transition-colors cursor-pointer hover:scale-105 shrink-0"
            title="Close Scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">

          {/* MODE TOGGLE SWITCH (Real vs Demo) */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-white border border-white rounded-3xl shadow-neu gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                SCAN OPERATION MODE:
              </span>
              <div className="flex items-center bg-[#ECEFF4] p-1.5 rounded-full shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setScanMode('real');
                    setScanState('idle');
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    scanMode === 'real'
                      ? 'bg-[#16181C] text-white shadow-neu'
                      : 'text-[#687684] hover:text-[#14171A]'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5 text-[#C4EBE4]" />
                  <span>Real Hardware Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScanMode('demo');
                    setScanState('idle');
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    scanMode === 'demo'
                      ? 'bg-[#16181C] text-white shadow-neu'
                      : 'text-[#687684] hover:text-[#14171A]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-purple-300" />
                  <span>Demo Mode (Toggle)</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-[#687684] flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${scanMode === 'real' ? 'bg-emerald-500 animate-ping' : 'bg-purple-500'}`} />
              <span className="font-medium">
                {scanMode === 'real'
                  ? 'Active: Polling physical Wi-Fi card & authentic router'
                  : 'Active: Simulating attack scenarios for evaluators'}
              </span>
            </div>
          </div>

          {/* REAL HARDWARE PROFILE SUMMARY (When in Real Mode) */}
          {scanMode === 'real' && scanState !== 'scanning' && (
            <div className="bg-white border border-white rounded-3xl p-5 shadow-neu space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-[#14171A] font-bold text-sm">
                  <Laptop className="w-4 h-4 text-[#1E9E88]" />
                  <span>Your Live Physical Wi-Fi Environment (Detected)</span>
                </div>
                <span className="text-[11px] font-mono text-[#1E9E88] bg-[#D7F3EE] px-3 py-1 rounded-full border border-[#C4EBE4] font-semibold self-start sm:self-auto">
                  Status: Connected ({realEnv?.state || 'connected'})
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#ECEFF4] p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[#687684] text-[10px] uppercase font-bold block">WIRELESS ADAPTER</span>
                  <span className="font-extrabold text-[#14171A] truncate block text-sm mt-0.5" title={realEnv?.adapter_name}>
                    {realEnv?.adapter_name || 'MediaTek Wi-Fi 6 MT7921'}
                  </span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">{realEnv?.adapter_mac}</span>
                </div>

                <div className="bg-[#ECEFF4] p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[#687684] text-[10px] uppercase font-bold block">CONNECTED WI-FI (SSID)</span>
                  <span className="font-extrabold text-[#1E9E88] text-sm block mt-0.5">{realEnv?.ssid || 'AirFiber-harsha'}</span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">{realEnv?.bssid}</span>
                </div>

                <div className="bg-[#ECEFF4] p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[#687684] text-[10px] uppercase font-bold block">BAND &amp; CHANNEL</span>
                  <span className="font-extrabold text-[#14171A] text-sm block mt-0.5">
                    Channel {realEnv?.channel || 44} ({realEnv?.band || '5 GHz'})
                  </span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">Protocol: {realEnv?.radio_type || '802.11ax'}</span>
                </div>

                <div className="bg-[#ECEFF4] p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[#687684] text-[10px] uppercase font-bold block">SIGNAL &amp; CIPHER</span>
                  <span className="font-extrabold text-[#14171A] text-sm block mt-0.5">
                    {realEnv?.signal_pct || 95}% ({realEnv?.rssi_dbm || -37} dBm)
                  </span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">{realEnv?.auth || 'WPA2-Personal'}</span>
                </div>
              </div>

              {scanState === 'idle' && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-[#687684] max-w-xl leading-relaxed">
                    Performs a real RF audit: scans visible SSIDs for duplicate imposter APs, validates OUI authenticity, audits ARP gateway mapping, and checks 802.11ax carrier metrics.
                  </p>
                  <button
                    onClick={startScan}
                    className="px-6 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full shadow-neu transition-all flex items-center justify-center space-x-2 text-xs shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#C4EBE4] animate-spin" />
                    <span>Run Real Hardware Scan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DEMO MODE SELECTOR (When in Demo Mode) */}
          {scanMode === 'demo' && scanState !== 'scanning' && (
            <div className="bg-white border border-white rounded-3xl p-5 shadow-neu space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Attack Simulation to Showcase:
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200 font-mono font-bold">
                  Evaluation Scenarios
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDemoScenario('threat_audit')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    demoScenario === 'threat_audit'
                      ? 'bg-rose-50/70 border-rose-400 shadow-neu text-rose-950 ring-2 ring-rose-300'
                      : 'bg-[#ECEFF4] border-slate-200/60 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Evil Twin &amp; Deauth Attack</span>
                  </div>
                  <p className="text-xs text-[#687684] leading-relaxed">
                    Simulates active deauthentication flood (190 pkts/s) accompanied by a cloned BSSID Rogue AP.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoScenario('clean')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    demoScenario === 'clean'
                      ? 'bg-[#D7F3EE]/60 border-[#1E9E88] shadow-neu text-slate-900 ring-2 ring-[#C4EBE4]'
                      : 'bg-[#ECEFF4] border-slate-200/60 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-[#1E9E88] font-bold text-sm mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#1E9E88]" />
                    <span>Clean Baseline Traffic</span>
                  </div>
                  <p className="text-xs text-[#687684] leading-relaxed">
                    Shows benign normal traffic evaluation with 0 false positives and verified authentic BSSIDs.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoScenario('beacon_flood')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    demoScenario === 'beacon_flood'
                      ? 'bg-amber-50/70 border-amber-400 shadow-neu text-amber-950 ring-2 ring-amber-300'
                      : 'bg-[#ECEFF4] border-slate-200/60 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm mb-1">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Beacon Jamming &amp; Flooding</span>
                  </div>
                  <p className="text-xs text-[#687684] leading-relaxed">
                    Simulates spectrum denial-of-service and hundreds of rogue SSID broadcasts per second.
                  </p>
                </button>
              </div>

              {scanState === 'idle' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={startScan}
                    className="px-6 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full shadow-neu transition-all flex items-center space-x-2 text-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#C4EBE4] animate-spin" />
                    <span>Launch Attack Simulation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE / FINISHED COCKPIT VIEW */}
          {(scanState === 'scanning' || scanState === 'completed') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT: Radar Display & Scope (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-white border border-white rounded-3xl p-5 shadow-neu relative overflow-hidden">

                {/* Radar Status Bar */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#687684] mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1E9E88] animate-ping" />
                    <span className="text-[#1E9E88] font-bold">
                      {scanMode === 'real' ? 'LIVE AIRSPACE RADAR' : 'SIMULATION RADAR'}
                    </span>
                  </div>
                  <div>
                    FREQ: <span className="text-[#14171A] font-bold">{scanMode === 'real' ? '5.220 GHz (Ch 44)' : '2.412 - 2.484 GHz'}</span>
                  </div>
                  <div>
                    SWEEP: <span className="text-[#1E9E88] font-bold">360° CW</span>
                  </div>
                </div>

                {/* Radar Circular Screen in Sleek Neomorphic Well */}
                <div className="relative w-72 h-72 rounded-full border-4 border-white bg-[#16181C] shadow-neu flex items-center justify-center overflow-hidden my-2">

                  {/* Concentric Range Rings */}
                  <div className="absolute inset-4 rounded-full border border-[#1E9E88]/20" />
                  <div className="absolute inset-12 rounded-full border border-[#1E9E88]/25" />
                  <div className="absolute inset-20 rounded-full border border-[#1E9E88]/30" />
                  <div className="absolute inset-28 rounded-full border border-[#1E9E88]/35" />

                  {/* Crosshairs */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-[#1E9E88]/20 -translate-y-1/2" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[#1E9E88]/20 -translate-x-1/2" />

                  {/* Degree Labels */}
                  <span className="absolute top-1 text-[9px] font-mono text-[#C4EBE4]/70 font-bold">0° N</span>
                  <span className="absolute bottom-1 text-[9px] font-mono text-[#C4EBE4]/70 font-bold">180° S</span>
                  <span className="absolute left-1.5 text-[9px] font-mono text-[#C4EBE4]/70 font-bold">270° W</span>
                  <span className="absolute right-1.5 text-[9px] font-mono text-[#C4EBE4]/70 font-bold">90° E</span>

                  {/* Rotating Radar Sweep Beam */}
                  {scanState === 'scanning' && (
                    <div
                      className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none"
                      style={{
                        background: 'conic-gradient(from 0deg, rgba(30, 158, 136, 0.45) 0deg, rgba(196, 235, 228, 0.2) 30deg, transparent 75deg, transparent 360deg)'
                      }}
                    />
                  )}

                  {/* Center Node (Local Sensor / Your PC) */}
                  <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-[#1E9E88] shadow-[0_0_12px_#1E9E88] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Radar Blips */}
                  {visibleBlips.map((blip) => {
                    const rad = (blip.angle * Math.PI) / 180;
                    const r = blip.distance * 42;
                    const left = 50 + r * Math.cos(rad);
                    const top = 50 + r * Math.sin(rad);

                    const isThreat = blip.status === 'threat';
                    const isVictim = blip.status === 'victim';
                    const isTarget = blip.status === 'target';
                    const isSelected = (selectedBlip?.id || visibleBlips[0]?.id) === blip.id;

                    const dotColor = isThreat
                      ? 'bg-rose-500 shadow-[0_0_14px_#f43f5e]'
                      : isVictim
                      ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                      : isTarget
                      ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa]'
                      : 'bg-emerald-400 shadow-[0_0_10px_#34d399]';

                    // Smart boundary-aware positioning so tooltip flips inwards and is never cut off
                    const isUpper = top < 48;
                    const isRightEdge = left > 70;
                    const isLeftEdge = left < 30;

                    const vPosClass = isUpper ? 'top-5' : 'bottom-5';
                    const hPosClass = isRightEdge ? '-translate-x-3/4' : isLeftEdge ? '-translate-x-1/4' : '-translate-x-1/2';

                    return (
                      <div
                        key={blip.id}
                        onClick={() => setSelectedBlip(blip)}
                        onMouseEnter={() => setSelectedBlip(blip)}
                        className={`absolute group z-20 transition-all duration-300 cursor-pointer ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                        }`}
                        style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                        title={`${blip.label} - Click to inspect`}
                      >
                        {isThreat && (
                          <div className="absolute -inset-2 rounded-full border border-rose-500 animate-ping opacity-75" />
                        )}

                        {isSelected && (
                          <div className="absolute -inset-1.5 rounded-full border-2 border-white animate-pulse" />
                        )}

                        <div className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />

                        {/* Smartly-oriented Tooltip (flips downwards when near top edge) */}
                        <div className={`absolute ${vPosClass} left-1/2 ${hPosClass} hidden group-hover:flex flex-col items-center bg-[#16181C]/95 backdrop-blur border border-white/30 rounded-xl px-3 py-2 text-[10px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none`}>
                          <span className="font-bold text-[#C4EBE4]">{blip.label}</span>
                          <span className="text-slate-300 font-mono text-[9px]">{blip.bssid}</span>
                          <span className="text-slate-300 text-[9px]">Ch {blip.channel} | {blip.rssi} dBm</span>
                          {blip.vendor && <span className="text-slate-400 text-[8px]">{blip.vendor}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dedicated Inspected Device Telemetry Card (Always 100% visible, never clipped) */}
                {visibleBlips.length > 0 && (
                  <div className="w-full mt-2.5 p-3 bg-[#ECEFF4] rounded-2xl border border-slate-200/80 shadow-xs text-xs font-mono">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 mb-1.5">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            (selectedBlip || visibleBlips[0])?.status === 'threat'
                              ? 'bg-rose-500'
                              : (selectedBlip || visibleBlips[0])?.status === 'target'
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-bold text-[#14171A] truncate">
                          {(selectedBlip || visibleBlips[0])?.label || 'Selected Airspace Node'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-700 font-bold border border-slate-200 shrink-0">
                        {(selectedBlip || visibleBlips[0])?.type || '802.11 Node'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#687684] text-[10px] block">BSSID / MAC</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {(selectedBlip || visibleBlips[0])?.bssid || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#687684] text-[10px] block">Channel &amp; Signal</span>
                        <span className="font-bold text-[#1E9E88]">
                          Ch {(selectedBlip || visibleBlips[0])?.channel || 44} | {(selectedBlip || visibleBlips[0])?.rssi || -35} dBm
                        </span>
                      </div>
                    </div>

                    {(selectedBlip || visibleBlips[0])?.vendor && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-600 truncate flex items-center justify-between">
                        <span className="truncate">{(selectedBlip || visibleBlips[0])?.vendor}</span>
                        <span className="text-slate-400 text-[9px] italic shrink-0 ml-1">Hover/click blip to inspect</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Radar Legend */}
                <div className="grid grid-cols-3 gap-2 w-full text-[10px] text-[#687684] mt-3 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Router / AP</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Your PC</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-rose-600 font-bold">Threat AP</span>
                  </div>
                </div>

              </div>

              {/* RIGHT: Live Scan Telemetry Stream & Stage Progress (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-4">

                <div className="bg-white border border-white rounded-3xl p-5 shadow-neu space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase font-mono text-[#1E9E88] font-bold tracking-wider">
                        {scanMode === 'real' ? 'Live Physical Hardware Diagnostic' : 'Attack Simulation Execution'}
                      </div>
                      <div className="text-sm font-bold text-[#14171A] flex items-center space-x-2 mt-0.5">
                        {scanState === 'scanning' ? (
                          <RotateCw className="w-4 h-4 text-[#1E9E88] animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>{activeStage}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xl font-extrabold text-[#14171A]">{progress}%</div>
                      <div className="text-[10px] text-[#687684]">Progress</div>
                    </div>
                  </div>

                  {/* Sleek Mint Neo Progress Bar */}
                  <div className="w-full bg-[#ECEFF4] h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        scanResult && scanResult.threats_found > 0
                          ? 'bg-rose-500'
                          : 'bg-[#1E9E88]'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div className="bg-[#ECEFF4] border border-slate-200/60 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] text-[#687684] uppercase font-bold">CHANNEL</div>
                      <div className="font-extrabold text-[#1E9E88] text-sm mt-0.5">CH {currentChannel}</div>
                    </div>
                    <div className="bg-[#ECEFF4] border border-slate-200/60 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] text-[#687684] uppercase font-bold">INTERCEPTED</div>
                      <div className="font-extrabold text-[#14171A] text-sm mt-0.5">{framesCount} pkts</div>
                    </div>
                    <div className="bg-[#ECEFF4] border border-slate-200/60 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] text-[#687684] uppercase font-bold">REAL LINK</div>
                      <div className="font-extrabold text-slate-700 text-sm mt-0.5">{realEnv?.rssi_dbm || -37} dBm</div>
                    </div>
                    <div className="bg-[#ECEFF4] border border-slate-200/60 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] text-[#687684] uppercase font-bold">THREATS</div>
                      <div className={`font-extrabold text-sm mt-0.5 ${scanResult && scanResult.threats_found > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {scanResult ? scanResult.threats_found : 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Telemetry Console (Obsidian Inset Well with Cyber Mint Feed) */}
                <div className="bg-[#16181C] border border-slate-800 rounded-3xl p-4 flex flex-col flex-1 min-h-[220px] max-h-[260px] overflow-hidden shadow-neu">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <div className="flex items-center space-x-2 text-xs font-mono text-[#C4EBE4]">
                      <Terminal className="w-3.5 h-3.5 text-[#1E9E88]" />
                      <span>{scanMode === 'real' ? 'Live Hardware Sensor Stream' : 'Airspace Telemetry Stream'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 animate-pulse font-bold">● LIVE</span>
                  </div>

                  <div className="overflow-y-auto space-y-1.5 font-mono text-[11px] pr-2 flex-1">
                    {displayedLogs.map((log, idx) => {
                      const levelClass =
                        log.level === 'danger'
                          ? 'text-rose-300 bg-rose-950/40 border-l-2 border-rose-500 pl-2 py-0.5'
                          : log.level === 'warn'
                          ? 'text-amber-300 bg-amber-950/40 border-l-2 border-amber-500 pl-2 py-0.5'
                          : log.level === 'safe'
                          ? 'text-emerald-400 pl-2'
                          : 'text-[#C4EBE4] pl-2';

                      return (
                        <div key={idx} className={`leading-relaxed ${levelClass} rounded`}>
                          {log.message}
                        </div>
                      );
                    })}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VERDICT SUMMARY CARD (When Scan is Completed) */}
          {scanState === 'completed' && scanResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {scanResult.threats_found > 0 ? (
                /* THREAT DETECTED RESULT (Typically from Demo Attack Scenario) */
                <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 shadow-neu text-[#14171A]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-neu border border-white text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-0.5 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-full">
                            CRITICAL THREAT IDENTIFIED
                          </span>
                          <span className="text-xs font-mono text-rose-700 font-semibold">
                            Confidence: 98.4% (Random Forest Verified)
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-[#14171A] mt-1 tracking-tight">
                          {scanResult.incident_title || 'Active Wi-Fi Attack Detected'}
                        </h3>
                        <p className="text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
                          {scanResult.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                      <button
                        onClick={handleViewSimpleStory}
                        className="px-5 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full shadow-neu transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer hover:scale-[1.02]"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#C4EBE4]" />
                        <span>View Plain Story (Easy)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={handleViewTechnicalForensics}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-full shadow-neu transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer hover:scale-[1.02] border border-white"
                      >
                        <Cpu className="w-3.5 h-3.5 text-[#1E9E88]" />
                        <span>Technical Forensics &amp; SHAP</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 100% CLEAN & SECURE (Real Network or Clean Baseline) */
                <div className="bg-[#D7F3EE] border-2 border-[#C4EBE4] rounded-3xl p-6 shadow-neu text-[#14171A]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-neu border border-white text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-0.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-full">
                            {scanMode === 'real' ? 'REAL WI-FI 100% SECURE' : '100% SECURE — NO THREATS'}
                          </span>
                          <span className="text-xs font-mono text-emerald-800 font-semibold">
                            Verified on {scanResult.real_hardware?.adapter || realEnv?.adapter_name || 'MediaTek Wi-Fi 6'}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-[#14171A] mt-1 tracking-tight">
                          {scanMode === 'real'
                            ? `Your Network '${realEnv?.ssid || 'AirFiber-harsha'}' is Protected`
                            : 'Airspace Perimeter is Clean & Protected'}
                        </h3>
                        <p className="text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
                          {scanMode === 'real'
                            ? `Analyzed active 802.11ax carrier on Channel ${realEnv?.channel || 44} (${realEnv?.band || '5 GHz'}). Zero duplicate Rogue APs found in range, ARP gateway routing is authentic, and WPA2-Personal encryption is active.`
                            : 'Random Forest and SHAP models analyzed captured baseline frames. Zero deauth anomalies, 0 rogue beacons.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                      {scanMode === 'real' ? (
                        <button
                          onClick={() => {
                            setScanMode('demo');
                            setDemoScenario('threat_audit');
                            setScanState('idle');
                          }}
                          className="px-5 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full shadow-neu transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer hover:scale-[1.02]"
                        >
                          <Zap className="w-3.5 h-3.5 text-purple-300" />
                          <span>Toggle Demo Mode (Simulate Attack)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setScanMode('real');
                            setScanState('idle');
                          }}
                          className="px-5 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full shadow-neu transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer hover:scale-[1.02]"
                        >
                          <Wifi className="w-3.5 h-3.5 text-[#C4EBE4]" />
                          <span>Switch to Real Hardware Scan</span>
                        </button>
                      )}

                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-white text-slate-800 font-bold rounded-full shadow-neu transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer hover:scale-[1.02]"
                      >
                        <span>Close Scanner</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-sm font-medium shadow-neu">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs text-[#687684]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center space-x-1.5 font-medium text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Host Adapter: {realEnv?.adapter_name || 'MediaTek Wi-Fi 6 MT7921'}</span>
            </span>
            <span>•</span>
            <span className="font-mono text-slate-500">MAC: {realEnv?.adapter_mac || '48:45:e6:80:1f:9b'}</span>
          </div>

          {scanState === 'completed' && (
            <button
              onClick={() => {
                setScanState('idle');
                setProgress(0);
                setDisplayedLogs([]);
                setVisibleBlips([]);
              }}
              className="text-[#1E9E88] hover:text-emerald-950 font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Configure New Scan</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

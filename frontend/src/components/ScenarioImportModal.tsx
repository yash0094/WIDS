import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle, AlertCircle, X, Play, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../api/client';

interface ScenarioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScenarioImportModal: React.FC<ScenarioImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'wifi_scenario_rogue_ap_evil_twin',
      name: 'Evil Twin / Rogue AP Hijack (Multi-Stage)',
      desc: 'Deauth burst -> Disassociation -> Rogue AP beacon broadcast with cloned SSID.',
      badge: 'CRITICAL',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      id: 'wifi_scenario_deauth_flood',
      name: 'Targeted Deauthentication Flood',
      desc: '15 consecutive deauth frames targeting single client workstation.',
      badge: 'HIGH',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      id: 'wifi_scenario_beacon_flood',
      name: '802.11 Beacon Frame Flooding',
      desc: 'Massive random high-entropy SSIDs flooding AP beacon tables.',
      badge: 'HIGH',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
    {
      id: 'wifi_scenario_normal_burst_benign',
      name: 'Benign High-Volume Traffic Burst',
      desc: 'High packet rate legitimate data frames. Verifies zero false incident creation.',
      badge: 'BENIGN',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'wifi_scenario_mixed_unrelated_alerts',
      name: 'Unrelated Alerts Close in Time',
      desc: 'Tests anti-false correlation: ensures alerts with no shared entity remain separate.',
      badge: 'ISOLATED',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'sample_wireless',
      name: 'Live 802.11 PCAP Packet Capture',
      desc: 'Authentic 802.11 PCAP containing RadioTap, Dot11Beacon, and Dot11Deauth frames.',
      badge: 'PCAP FILE',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  ];

  const handleImportSample = async (scenarioId: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.importSampleScenario(scenarioId);
      setStatusMsg({
        type: 'success',
        text: `Successfully analyzed ${res.total_records} records, discovered ${res.total_incidents} incidents and ${res.total_edges} correlation edges.`
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.uploadCapture(selectedFile, selectedFile.name.endsWith('.pcap') ? 'pcap' : 'csv');
      setStatusMsg({
        type: 'success',
        text: `Successfully uploaded ${selectedFile.name} (${res.total_records} records processed, ${res.total_incidents} incidents).`
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'File upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16181C]/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#ECEFF4] border border-white/80 rounded-[36px] sm:rounded-[40px] max-w-2xl w-full p-6 sm:p-8 shadow-[0_30px_70px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.8)] relative space-y-6 animate-in fade-in zoom-in-95 duration-200 text-[#14171A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-neu border border-white flex items-center justify-center text-[#1E9E88] shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#14171A] tracking-tight">Import Telemetry &amp; Run Analysis</h3>
              <p className="text-xs text-[#687684]">Load verified test scenarios or upload custom CSV/PCAP capture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-neu border border-white flex items-center justify-center text-slate-500 hover:text-black transition-colors cursor-pointer hover:scale-105 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2 font-medium shadow-neu ${
              statusMsg.type === 'success'
                ? 'bg-[#D7F3EE] text-[#1E9E88] border border-[#C4EBE4]'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. Pre-built Benchmark Scenarios */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            1-Click Benchmark Scenarios
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {scenarios.map((scen) => (
              <button
                key={scen.id}
                disabled={loading}
                onClick={() => handleImportSample(scen.id)}
                className="p-4 bg-white hover:bg-slate-50/80 border border-white rounded-2xl shadow-neu text-left transition flex flex-col justify-between group disabled:opacity-50 cursor-pointer hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#14171A] group-hover:text-[#1E9E88] transition">
                      {scen.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECEFF4] text-slate-700 border border-slate-200/60">
                      {scen.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687684] line-clamp-2 leading-relaxed">{scen.desc}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center text-[10px] text-[#1E9E88] font-bold space-x-1.5">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute Analysis Pipeline</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Custom File Upload */}
        <form onSubmit={handleFileUpload} className="space-y-3 pt-4 border-t border-slate-200/80">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Or Upload Custom Wireless Capture (CSV or PCAP)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="file"
              accept=".csv,.pcap"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="flex-1 text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#16181C] file:text-white hover:file:bg-black bg-white p-2 rounded-full shadow-neu border border-white"
            />
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="px-6 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold text-xs rounded-full shadow-neu transition disabled:opacity-50 cursor-pointer hover:scale-[1.02] shrink-0"
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

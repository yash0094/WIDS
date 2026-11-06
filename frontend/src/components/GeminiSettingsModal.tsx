import React, { useState, useEffect } from 'react';
import { Sparkles, Key, CheckCircle2, AlertCircle, X, ExternalLink, Shield } from 'lucide-react';
import { api } from '../api/client';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [apiKey, setApiKey] = useState('');
  const [currentConfig, setCurrentConfig] = useState<{
    configured: boolean;
    model: string;
    api_key_masked: string | null;
    mode: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getGeminiConfig()
        .then(setCurrentConfig)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setMsg({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      await api.setGeminiConfig(apiKey.trim());
      setMsg({ type: 'success', text: 'Gemini API key verified and connected to Gemini 2.5 Flash!' });
      setApiKey('');
      const updated = await api.getGeminiConfig();
      setCurrentConfig(updated);
      onConfigUpdated();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save Gemini API key' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16181C]/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#ECEFF4] border border-white/80 rounded-[36px] sm:rounded-[40px] max-w-lg w-full p-6 sm:p-8 shadow-[0_30px_70px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.8)] relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-[#14171A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-neu border border-white flex items-center justify-center text-purple-600 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#14171A] flex items-center space-x-2 tracking-tight">
                <span>Google Gemini AI Engine</span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-mono px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
                  gemini-2.5-flash
                </span>
              </h3>
              <p className="text-xs text-[#687684]">Direct LLM reasoning on extracted local 802.11 telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-neu border border-white flex items-center justify-center text-slate-500 hover:text-black transition-colors cursor-pointer hover:scale-105 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-4 bg-white rounded-2xl border border-white shadow-neu space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#687684] font-medium">Current AI Engine:</span>
            <span className="font-mono font-bold text-[#1E9E88] bg-[#D7F3EE] px-2.5 py-0.5 rounded-full">
              {currentConfig?.mode || 'Detecting...'}
            </span>
          </div>
          {currentConfig?.configured ? (
            <div className="flex items-center space-x-2 text-xs text-emerald-700 font-medium pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Active Cloud Key: <strong className="font-mono text-[#14171A]">{currentConfig.api_key_masked}</strong></span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-amber-800 font-medium pt-1">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Running in high-fidelity local mode. Enter your API key for live Gemini 2.5 Flash calls.</span>
            </div>
          )}
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2 font-medium shadow-neu ${
              msg.type === 'success'
                ? 'bg-[#D7F3EE] text-[#1E9E88] border border-[#C4EBE4]'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* API Key Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                <span>Google Gemini API Key</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#1E9E88] hover:text-emerald-950 inline-flex items-center space-x-1 text-[11px] font-bold"
              >
                <span>Get key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              placeholder="Paste AIzaSy... API key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white border border-white focus:ring-2 focus:ring-[#1E9E88]/40 rounded-full px-4 py-2.5 text-xs text-[#14171A] placeholder-slate-400 font-mono shadow-neu focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-[#687684] leading-relaxed">
            When configured, local wireless packets and extracted 802.11 features will be streamed to Gemini 2.5 Flash for intrusion classification, SHAP-style attribution, attack hypothesis formulation, and SOC action steps.
          </p>

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-black bg-white rounded-full shadow-neu border border-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="px-6 py-2 bg-[#16181C] hover:bg-black text-white font-bold text-xs rounded-full shadow-neu transition disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
            >
              {loading ? 'Validating...' : 'Connect Gemini AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

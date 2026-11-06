import React, { useState } from 'react';
import { AnalystReview } from '../types';
import { ShieldCheck, X, AlertTriangle, CheckCircle, HelpCircle, History } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: number;
  incidentTitle: string;
  reviews: AnalystReview[];
  onSubmitReview: (decision: 'confirmed' | 'rejected' | 'needs_more_evidence', notes: string, name: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  incidentId,
  incidentTitle,
  reviews,
  onSubmitReview
}) => {
  const [decision, setDecision] = useState<'confirmed' | 'rejected' | 'needs_more_evidence'>('confirmed');
  const [notes, setNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('Security Analyst');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide analyst investigation notes to support the decision.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmitReview(decision, notes, reviewerName);
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16181C]/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#ECEFF4] border border-white/80 rounded-[36px] sm:rounded-[40px] max-w-xl w-full p-6 sm:p-8 shadow-[0_30px_70px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.8)] relative space-y-6 animate-in fade-in zoom-in-95 duration-200 text-[#14171A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-neu border border-white flex items-center justify-center text-[#1E9E88] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#14171A] tracking-tight">Analyst Incident Assessment</h3>
              <p className="text-xs text-[#687684]">Incident #{incidentId}: {incidentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-neu border border-white flex items-center justify-center text-slate-500 hover:text-black transition-colors cursor-pointer hover:scale-105 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium shadow-neu">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decision Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Assessment Verdict</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDecision('confirmed')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  decision === 'confirmed'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-neu ring-2 ring-rose-300'
                    : 'bg-white border-white text-slate-700 shadow-neu hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirmed</span>
                </div>
                <span className="text-[10px] mt-1 text-[#687684]">True wireless attack verified</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  decision === 'rejected'
                    ? 'bg-[#D7F3EE] border-[#1E9E88] text-slate-900 shadow-neu ring-2 ring-[#C4EBE4]'
                    : 'bg-white border-white text-slate-700 shadow-neu hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs text-[#1E9E88]">
                  <CheckCircle className="w-4 h-4" />
                  <span>Rejected</span>
                </div>
                <span className="text-[10px] mt-1 text-[#687684]">Benign traffic / false alert</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('needs_more_evidence')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  decision === 'needs_more_evidence'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-neu ring-2 ring-amber-300'
                    : 'bg-white border-white text-slate-700 shadow-neu hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-700">
                  <HelpCircle className="w-4 h-4" />
                  <span>Inconclusive</span>
                </div>
                <span className="text-[10px] mt-1 text-[#687684]">Needs additional telemetry</span>
              </button>
            </div>
          </div>

          {/* Reviewer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Investigator Name / ID</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full bg-white border border-white rounded-full px-4 py-2.5 text-xs text-[#14171A] focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 font-mono shadow-neu"
            />
          </div>

          {/* Justification Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Investigation Notes &amp; Rationale</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail reasons for decision, physical RF findings, or why alternative benign hypotheses were ruled out..."
              className="w-full bg-white border border-white rounded-2xl p-3.5 text-xs text-[#14171A] focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 placeholder-slate-400 shadow-neu"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-black bg-white shadow-neu border border-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#16181C] hover:bg-black transition shadow-neu disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
            >
              {loading ? 'Submitting...' : 'Record Verdict'}
            </button>
          </div>
        </form>

        {/* Audit History */}
        {reviews && reviews.length > 0 && (
          <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <History className="w-3.5 h-3.5" />
              <span>Prior Review History ({reviews.length})</span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {reviews.map((r) => (
                <div key={r.id} className="p-3 rounded-2xl bg-white border border-white shadow-neu text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14171A]">{r.reviewer_name}</span>
                    <span className="text-[10px] text-[#687684] font-mono">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{r.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

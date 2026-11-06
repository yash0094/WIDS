import React from 'react';
import { Narrative } from '../types';
import { FileSearch, CheckCircle2, AlertOctagon, HelpCircle, ListFilter, ArrowRightCircle, Clock } from 'lucide-react';

interface NarrativeCardProps {
  narrative: Narrative;
  onSelectEvent: (eventId: number) => void;
}

export const NarrativeCard: React.FC<NarrativeCardProps> = ({ narrative, onSelectEvent }) => {
  return (
    <div className="bg-white rounded-3xl border border-white p-6 shadow-neu space-y-6 text-[#14171A]">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#D7F3EE] text-[#1E9E88] rounded-2xl shadow-inner">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#14171A] tracking-tight">{narrative.title}</h3>
            <p className="text-xs text-[#687684]">Deterministic Evidence-Linked Investigation Report</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-[#ECEFF4] text-[#14171A] border border-slate-200/60">
          Status: {narrative.status}
        </span>
      </div>

      {/* 1. Observed Facts (with clickable event links) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#14171A] uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-[#1E9E88]" />
          <span>Observed Evidence &amp; Claims</span>
        </div>

        <div className="space-y-2.5">
          {narrative.observed_facts.map((fact, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 text-xs text-[#14171A] flex items-start justify-between space-x-3 shadow-xs"
            >
              <div className="space-y-1">
                <p className="leading-relaxed font-semibold text-[#14171A]">{fact.claim}</p>
                <p className="text-[11px] text-[#687684]">{fact.evidence_note}</p>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#687684] border border-slate-200 font-bold">
                  {fact.confidence_level}
                </span>
                <div className="flex items-center space-x-1">
                  {fact.supporting_event_ids.map((eid) => (
                    <button
                      key={eid}
                      onClick={() => onSelectEvent(eid)}
                      title={`Inspect Event #${eid}`}
                      className="px-2 py-0.5 rounded-full bg-white hover:bg-[#16181C] hover:text-white text-[#1E9E88] border border-slate-200 font-mono text-[10px] font-bold transition shadow-xs cursor-pointer"
                    >
                      #{eid}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Forensic Chronology & Attack Progression */}
      {narrative.chronological_narrative && (
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1E9E88] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#1E9E88]" />
            <span>Forensic Chronology &amp; Attack Progression</span>
          </div>
          <div className="p-4 bg-[#ECEFF4]/80 rounded-2xl border border-slate-200/60 text-xs text-[#14171A] leading-relaxed font-sans whitespace-pre-wrap space-y-2 shadow-xs">
            {narrative.chronological_narrative}
          </div>
        </div>
      )}

      {/* 3. Attack Hypothesis */}
      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200/80 space-y-2 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span>Primary Adversary Attack Hypothesis</span>
        </div>
        <p className="text-xs text-rose-950 font-medium leading-relaxed">
          {narrative.attack_hypothesis}
        </p>
      </div>

      {/* 4. Alternative Benign Explanations */}
      <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>Plausible Benign / Non-Malicious Alternatives</span>
        </div>
        <ul className="space-y-1.5 text-xs text-amber-950 font-medium list-disc list-inside">
          {narrative.alternative_explanations.map((alt, i) => (
            <li key={i} className="leading-relaxed">
              <span>{alt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Missing Evidence and Unknowns */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#687684] uppercase tracking-wider">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <span>Known Limitations &amp; Missing Telemetry</span>
        </div>
        <ul className="space-y-1.5 text-xs text-[#687684] list-disc list-inside bg-[#ECEFF4] p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
          {narrative.missing_evidence_and_unknowns.map((miss, i) => (
            <li key={i} className="leading-relaxed">{miss}</li>
          ))}
        </ul>
      </div>

      {/* 6. Recommended Next Investigation Steps */}
      <div className="space-y-2.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1E9E88] uppercase tracking-wider">
          <ArrowRightCircle className="w-4 h-4 text-[#1E9E88]" />
          <span>Recommended SOC Action Plan</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {narrative.recommended_investigation_steps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-[#ECEFF4] border border-slate-200/60 text-xs text-[#14171A] flex items-start space-x-2.5 shadow-xs font-medium"
            >
              <span className="font-mono text-[#1E9E88] font-bold">{idx + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { IncidentListItem } from '../types';
import { api } from '../api/client';
import { Shield, Search, Filter, Clock, ChevronRight, AlertTriangle, CheckCircle, HelpCircle, Radio } from 'lucide-react';

interface IncidentsPageProps {
  onSelectIncident: (id: number) => void;
  onOpenScanner?: () => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ onSelectIncident, onOpenScanner }) => {

  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    api.getIncidents()
      .then(setIncidents)
      .catch((err) => console.error('Failed to load incidents', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.attack_type.toLowerCase().includes(search.toLowerCase()) ||
      (inc.primary_entity && inc.primary_entity.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#14171A] tracking-tight">Wi-Fi Threat Incidents</h2>
          <p className="text-xs text-[#687684]">
            Detected wireless attacks grouped by campaign with explainable AI reasoning &amp; evidence links
          </p>
        </div>
        <div className="text-xs font-mono text-slate-700 bg-white px-3.5 py-1.5 rounded-full shadow-neu border border-white self-start sm:self-auto font-medium">
          Showing {filtered.length} of {incidents.length} threats
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, attack, MAC, SSID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-0 rounded-full pl-10 pr-4 py-2.5 text-xs text-[#14171A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 shadow-neu"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border-0 rounded-full px-4 py-2.5 text-xs text-[#14171A] focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 shadow-neu cursor-pointer font-medium"
        >
          <option value="all">All Workflow Statuses</option>
          <option value="candidate">Candidate (Unreviewed)</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="analyst_confirmed">Analyst Confirmed</option>
          <option value="rejected">Rejected (False Positive)</option>
          <option value="needs_more_evidence">Needs More Evidence</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-white border-0 rounded-full px-4 py-2.5 text-xs text-[#14171A] focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 shadow-neu cursor-pointer font-medium"
        >
          <option value="all">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      {/* Incidents Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-white text-center space-y-3 shadow-neu">
            <div className="p-3 bg-[#D7F3EE] text-[#1E9E88] rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#14171A]">All Clear — Airspace Is Secure</h3>
            <p className="text-xs text-[#687684] max-w-md mx-auto leading-relaxed">
              No deauthentication bursts, rogue access points, or beacon flood anomalies were detected.
            </p>
            {onOpenScanner && (
              <div className="pt-2">
                <button
                  onClick={onOpenScanner}
                  className="px-5 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full text-xs shadow-neu transition inline-flex items-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Radio className="w-3.5 h-3.5 text-[#C4EBE4] animate-spin" />
                  <span>Scan Wi-Fi Airspace for Threats</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filtered.map((inc) => {
            let sevColor = 'text-slate-600 bg-slate-100 border-slate-200';
            if (inc.severity === 'CRITICAL') sevColor = 'text-rose-700 bg-rose-50 border-rose-200';
            else if (inc.severity === 'HIGH') sevColor = 'text-amber-700 bg-amber-50 border-amber-200';
            else if (inc.severity === 'MEDIUM') sevColor = 'text-teal-700 bg-teal-50 border-teal-200';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="p-5 bg-white rounded-3xl border border-white hover:border-[#C4EBE4] hover:shadow-neu-card cursor-pointer transition shadow-neu group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${sevColor}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#687684]">#{inc.id}</span>
                    <span className="text-xs text-indigo-600 font-mono font-semibold">[{inc.attack_type}]</span>
                    <span className="text-[11px] font-mono text-slate-600 capitalize px-2.5 py-0.5 rounded-full bg-[#ECEFF4] border border-slate-200/60 font-medium">
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#14171A] group-hover:text-[#1E9E88] transition">
                    {inc.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#687684] font-mono">
                    <span>Linked Events: <strong className="text-[#14171A]">{inc.event_count}</strong></span>
                    <span>Primary Entity: <strong className="text-[#1E9E88]">{inc.primary_entity || 'N/A'}</strong></span>
                    {inc.start_time && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(inc.start_time).toLocaleTimeString()}</span>
                      </span>
                    )}
                  </div>

                  {inc.latest_review && (
                    <div className="text-[11px] text-[#687684] mt-1 bg-[#ECEFF4] p-2.5 rounded-2xl border border-slate-200/60 flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">Latest Review ({inc.latest_review.reviewer_decision}):</span>
                      <span className="truncate italic">"{inc.latest_review.notes}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(inc.id);
                    }}
                    className="px-4 py-2 bg-[#16181C] group-hover:bg-black text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-neu hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Investigate Threat</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { EventRecord } from '../types';
import { api } from '../api/client';
import { Radio, Search, Filter, Database, CheckCircle, Clock, Eye } from 'lucide-react';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { ShapWaterfall } from '../components/ShapWaterfall';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [labelFilter, setLabelFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getEvents(undefined, undefined, 200)
      .then((data) => {
        setEvents(data);
        if (data.length > 0) setSelectedEvent(data[0]);
      })
      .catch((err) => console.error('Failed to load events', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((ev) => {
    const pred = ev.detection?.predicted_label || ev.event_type;
    const matchesFilter = labelFilter === 'all' || pred === labelFilter;
    const matchesSearch =
      ev.event_type.toLowerCase().includes(search.toLowerCase()) ||
      (ev.source_ref && ev.source_ref.toLowerCase().includes(search.toLowerCase())) ||
      (ev.entity_ids?.bssid && ev.entity_ids.bssid.toLowerCase().includes(search.toLowerCase())) ||
      (ev.entity_ids?.dst_mac && ev.entity_ids.dst_mac.toLowerCase().includes(search.toLowerCase())) ||
      (ev.entity_ids?.ssid && ev.entity_ids.ssid.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#14171A] tracking-tight">802.11 Wireless Event Telemetry</h2>
          <p className="text-xs text-[#687684]">
            Raw captured frames normalized into standardized feature records with Random Forest predictions and SHAP attributions
          </p>
        </div>
        <div className="text-xs font-mono text-slate-700 bg-white px-3.5 py-1.5 rounded-full shadow-neu border border-white self-start sm:self-auto font-medium">
          Showing {filtered.length} of {events.length} records
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by source ref, BSSID, client MAC, SSID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-0 rounded-full pl-10 pr-4 py-2.5 text-xs text-[#14171A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 shadow-neu"
          />
        </div>

        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="bg-white border-0 rounded-full px-4 py-2.5 text-xs text-[#14171A] focus:outline-none focus:ring-2 focus:ring-[#1E9E88]/40 shadow-neu cursor-pointer font-medium"
        >
          <option value="all">All Classifications</option>
          <option value="Deauth_Attack">Deauth_Attack</option>
          <option value="Rogue_AP">Rogue_AP</option>
          <option value="Disassoc_Attack">Disassoc_Attack</option>
          <option value="Beacon_Flood">Beacon_Flood</option>
          <option value="Normal">Normal</option>
        </select>
      </div>

      {/* Split view: Events Table on Left (7 cols), Selected Event Evidence & SHAP on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-white shadow-neu overflow-hidden flex flex-col max-h-[700px]">
          <div className="overflow-x-auto flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ECEFF4] text-[#687684] uppercase font-mono text-[10px] border-b border-slate-200/60 sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-3 font-semibold">ID</th>
                  <th className="px-3.5 py-3 font-semibold">Timestamp</th>
                  <th className="px-3.5 py-3 font-semibold">Predicted Label</th>
                  <th className="px-3.5 py-3 font-semibold">Channel</th>
                  <th className="px-3.5 py-3 font-semibold">Entities (BSSID / MAC)</th>
                  <th className="px-3.5 py-3 font-semibold">Source Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtered.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  const pred = ev.detection?.predicted_label || ev.event_type;

                  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (pred.includes('Deauth')) badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                  else if (pred.includes('Rogue')) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                  else if (pred.includes('Disassoc')) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (pred.includes('Beacon')) badgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
                  else if (pred.includes('Normal')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#D7F3EE]/50 text-[#14171A] border-l-4 border-[#1E9E88]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-[#687684]">#{ev.id}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[#687684]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}>
                          {pred}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[#1E9E88] font-bold">
                        Ch {ev.entity_ids?.channel || 6}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] truncate max-w-[140px] text-slate-600">
                        {ev.entity_ids?.bssid || ev.entity_ids?.dst_mac || 'Broadcast'}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                        {ev.source_ref}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Event Details Panel */}
        <div className="lg:col-span-5 space-y-4">
          {selectedEvent ? (
            <>
              <ShapWaterfall
                explanation={selectedEvent.detection?.explanation_json}
                predictedLabel={selectedEvent.detection?.predicted_label || 'Normal'}
                confidence={selectedEvent.detection?.score_json?.confidence || 0.0}
              />
              <EvidenceViewer event={selectedEvent} />
            </>
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-white text-center text-[#687684] text-xs shadow-neu">
              Select any event record from the table to view its full SHAP attribution waterfall and decoded 802.11 features.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { EventRecord } from '../types';
import { Clock } from 'lucide-react';

interface TimelineViewProps {
  events: EventRecord[];
  selectedEventId: number | null;
  onSelectEvent: (id: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  selectedEventId,
  onSelectEvent
}) => {
  if (!events || events.length === 0) {
    return <div className="text-[#687684] text-xs p-6 text-center font-medium">No events in this incident sequence.</div>;
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const t0 = new Date(sortedEvents[0].timestamp).getTime();

  return (
    <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 my-2">
      {sortedEvents.map((ev) => {
        const isSelected = selectedEventId === ev.id;
        const evTime = new Date(ev.timestamp);
        const deltaSec = ((evTime.getTime() - t0) / 1000).toFixed(1);
        const pred = ev.detection?.predicted_label || ev.event_type;
        const conf = ev.detection?.score_json?.confidence;

        // Label coloring
        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
        if (pred.includes('Deauth')) badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        else if (pred.includes('Rogue')) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
        else if (pred.includes('Disassoc')) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        else if (pred.includes('Beacon')) badgeColor = 'bg-teal-50 text-teal-700 border-teal-200';

        return (
          <div
            key={ev.id}
            onClick={() => onSelectEvent(ev.id)}
            className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
              isSelected
                ? 'bg-white border-[#1E9E88] shadow-neu ring-2 ring-[#1E9E88]/30'
                : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            {/* Timeline bullet on the left border */}
            <div
              className={`absolute -left-[23px] w-3 h-3 rounded-full border-2 transition-all ${
                isSelected
                  ? 'bg-[#1E9E88] border-white scale-125 shadow-sm'
                  : 'bg-slate-300 border-[#ECEFF4]'
              }`}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#687684]">
                  #{ev.id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${badgeColor}`}>
                  {pred}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-[11px] text-[#687684] font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">+{deltaSec}s</span>
                <span className="text-slate-400">({evTime.toLocaleTimeString()})</span>
              </div>
            </div>

            {/* Entity details & Reference */}
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#14171A]">
              <div className="truncate">
                <span className="text-[#687684]">Target: </span>
                <span className="font-mono text-[#1E9E88] font-bold">
                  {ev.entity_ids?.bssid || ev.entity_ids?.dst_mac || 'N/A'}
                </span>
              </div>
              <div className="truncate">
                <span className="text-[#687684]">SSID: </span>
                <span className="font-bold text-[#14171A]">
                  {ev.entity_ids?.ssid || 'N/A'}
                </span>
              </div>
            </div>

            {/* Sub-bar: Confidence & Source Reference */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#687684]">
              <span>Source Ref: <span className="font-mono text-[#14171A] font-medium">{ev.source_ref || 'row_idx'}</span></span>
              {conf !== undefined && (
                <span className="flex items-center space-x-1">
                  <span>Confidence:</span>
                  <span className="font-mono font-bold text-[#1E9E88]">{(conf * 100).toFixed(1)}%</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

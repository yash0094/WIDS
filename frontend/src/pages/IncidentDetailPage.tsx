import React, { useState, useEffect } from 'react';
import { IncidentDetail, EventRecord } from '../types';
import { api } from '../api/client';
import { IncidentGraph } from '../components/IncidentGraph';
import { TimelineView } from '../components/TimelineView';
import { ShapWaterfall } from '../components/ShapWaterfall';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { NarrativeCard } from '../components/NarrativeCard';
import { ReviewModal } from '../components/ReviewModal';
import { SimpleIncidentView } from '../components/SimpleIncidentView';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  Network,
  Activity,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Eye,
  BookOpen
} from 'lucide-react';


interface IncidentDetailPageProps {
  incidentId: number;
  initialView?: 'simple' | 'technical';
  onBack: () => void;
  onViewReports: () => void;
}

export const IncidentDetailPage: React.FC<IncidentDetailPageProps> = ({
  incidentId,
  initialView = 'simple',
  onBack,
  onViewReports
}) => {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>(initialView);

  const [activeViewTab, setActiveViewTab] = useState<'graph' | 'timeline'>('graph');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  const loadData = () => {
    setLoading(true);
    api.getIncidentDetail(incidentId)
      .then((data) => {
        setIncident(data);
        if (data.events && data.events.length > 0 && selectedEventId === null) {
          setSelectedEventId(data.events[0].id);
        }
      })
      .catch((err) => console.error('Failed to load incident detail', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [incidentId]);

  const handleReviewSubmit = async (
    decision: 'confirmed' | 'rejected' | 'needs_more_evidence',
    notes: string,
    reviewerName: string
  ) => {
    if (!incident) return;
    await api.submitReview(incident.id, decision, notes, reviewerName);
    loadData();
  };

  const handleGeminiReanalyze = async () => {
    if (!incident) return;
    setReanalyzing(true);
    try {
      const res = await api.reanalyzeIncidentWithGemini(incident.id);
      setIncident((prev) => prev ? { ...prev, narrative: res.narrative } : null);
      setReportSuccessMsg(`Telemetry sent to ${res.engine || 'Gemini 2.5 Flash'} and investigation narrative updated!`);
      setTimeout(() => setReportSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Gemini analysis failed: ${err.message}`);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!incident) return;
    try {
      const rep = await api.generateReport(incident.id);
      setReportSuccessMsg(`Investigation report #${rep.id} generated successfully!`);
      setTimeout(() => setReportSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    }
  };

  if (loading || !incident) {
    return (
      <div className="p-16 text-center text-[#687684] bg-white rounded-3xl shadow-neu border border-white">
        <Activity className="w-8 h-8 animate-spin mx-auto text-[#1E9E88] mb-3" />
        <p className="text-sm font-medium">Loading incident telemetry, correlation graph, and SHAP explanations...</p>
      </div>
    );
  }

  const selectedEvent = incident.events.find((e) => e.id === selectedEventId) || incident.events[0];

  let sevColor = 'text-slate-600 bg-slate-100 border-slate-200';
  if (incident.severity === 'CRITICAL') sevColor = 'text-rose-700 bg-rose-50 border-rose-200';
  else if (incident.severity === 'HIGH') sevColor = 'text-amber-700 bg-amber-50 border-amber-200';
  else if (incident.severity === 'MEDIUM') sevColor = 'text-teal-700 bg-teal-50 border-teal-200';

  return (
    <div className="space-y-6">
      {/* Top Cockpit Header */}
      <div className="bg-white rounded-3xl border border-white p-5 shadow-neu flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 bg-[#ECEFF4] hover:bg-slate-200 text-[#14171A] rounded-full transition shadow-inner cursor-pointer"
            title="Back to incident list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${sevColor}`}>
                {incident.severity}
              </span>
              <span className="text-xs font-mono font-bold text-[#687684]">Incident #{incident.id}</span>
              <span className="text-xs text-indigo-600 font-mono font-semibold">[{incident.attack_type}]</span>
              <span className="text-[11px] font-mono text-slate-600 px-2.5 py-0.5 rounded-full bg-[#ECEFF4] border border-slate-200/60 capitalize font-medium">
                {incident.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#14171A] mt-1 tracking-tight">{incident.title}</h2>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#ECEFF4] p-1 rounded-full shadow-inner text-xs shrink-0">
          <button
            onClick={() => setViewMode('simple')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
              viewMode === 'simple'
                ? 'bg-white text-[#14171A] shadow-neu'
                : 'text-[#687684] hover:text-[#14171A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Simple Story (Easy)</span>
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
              viewMode === 'technical'
                ? 'bg-[#16181C] text-white shadow-neu'
                : 'text-[#687684] hover:text-[#14171A]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Technical Forensics</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGeminiReanalyze}
            disabled={reanalyzing}
            className="flex items-center space-x-1.5 bg-[#D7F3EE] hover:bg-[#C4EBE4] text-[#1E9E88] px-3.5 py-2 rounded-full text-xs font-bold transition shadow-neu disabled:opacity-50 cursor-pointer"
            title="Send extracted local telemetry to Gemini API for fresh LLM investigation"
          >
            <Sparkles className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Analyzing with Gemini...' : 'Analyze with Gemini AI'}</span>
          </button>

          <button
            onClick={() => setIsReviewOpen(true)}
            className="flex items-center space-x-1.5 bg-[#ECEFF4] hover:bg-white text-slate-800 px-3.5 py-2 rounded-full text-xs font-semibold shadow-neu transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E9E88]" />
            <span>Analyst Review</span>
          </button>

          <button
            onClick={handleGenerateReport}
            className="flex items-center space-x-1.5 bg-[#16181C] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-neu cursor-pointer hover:scale-[1.02]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {reportSuccessMsg && (
        <div className="p-3.5 bg-[#D7F3EE] border border-[#C4EBE4] rounded-2xl text-[#1E9E88] text-xs flex items-center justify-between shadow-neu font-medium">
          <span className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{reportSuccessMsg}</span>
          </span>
          <button onClick={onViewReports} className="underline font-bold hover:text-emerald-950">
            View in Reports tab &rarr;
          </button>
        </div>
      )}

      {/* Conditional View: Simple Story vs Technical Deep Dive */}
      {viewMode === 'simple' ? (
        <SimpleIncidentView
          incident={incident}
          onSwitchToTechnical={() => setViewMode('technical')}
          onSelectEvent={(eid) => {
            setSelectedEventId(eid);
            setViewMode('technical');
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Main Investigation Split Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (7 cols): Cytoscape Graph / Timeline View */}
            <div className="lg:col-span-7 space-y-3 flex flex-col">
              {/* View Tab Selector */}
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-white shadow-neu">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveViewTab('graph')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      activeViewTab === 'graph'
                        ? 'bg-[#16181C] text-white shadow-sm'
                        : 'text-[#687684] hover:text-[#14171A]'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Interactive Correlation Graph</span>
                  </button>
                  <button
                    onClick={() => setActiveViewTab('timeline')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      activeViewTab === 'timeline'
                        ? 'bg-[#16181C] text-white shadow-sm'
                        : 'text-[#687684] hover:text-[#14171A]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Event Timeline ({incident.events.length})</span>
                  </button>
                </div>
                <span className="text-[11px] text-[#687684] font-mono">
                  Selected: #{selectedEventId || 'none'}
                </span>
              </div>

              {/* Graph or Timeline Content */}
              <div className="flex-1 min-h-[460px]">
                {activeViewTab === 'graph' ? (
                  <IncidentGraph
                    elements={incident.cytoscape_elements}
                    selectedEventId={selectedEventId}
                    onSelectEvent={(eid) => setSelectedEventId(eid)}
                  />
                ) : (
                  <div className="bg-white p-4 rounded-3xl border border-white shadow-neu max-h-[500px] overflow-y-auto">
                    <TimelineView
                      events={incident.events}
                      selectedEventId={selectedEventId}
                      onSelectEvent={(eid) => setSelectedEventId(eid)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (5 cols): SHAP Feature Attributions + Evidence Inspector */}
            <div className="lg:col-span-5 space-y-4">
              <ShapWaterfall
                explanation={selectedEvent?.detection?.explanation_json}
                predictedLabel={selectedEvent?.detection?.predicted_label || 'Unknown'}
                confidence={selectedEvent?.detection?.score_json?.confidence || 0.0}
              />

              <EvidenceViewer event={selectedEvent} />
            </div>
          </div>

          {/* Bottom Section: Full Evidence-Linked Investigation Narrative Card */}
          <div>
            <NarrativeCard
              narrative={incident.narrative}
              onSelectEvent={(eid) => setSelectedEventId(eid)}
            />
          </div>
        </div>
      )}

      {/* Analyst Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        incidentId={incident.id}
        incidentTitle={incident.title}
        reviews={incident.reviews}
        onSubmitReview={handleReviewSubmit}
      />
    </div>
  );
};

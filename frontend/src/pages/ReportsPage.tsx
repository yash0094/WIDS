import React, { useState, useEffect } from 'react';
import { ReportItem } from '../types';
import { api } from '../api/client';
import { FileText, Download, Printer, Shield, CheckCircle, Clock, AlertTriangle, Layers } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReports()
      .then((data) => {
        setReports(data);
        if (data.length > 0) setSelectedReport(data[0]);
      })
      .catch((err) => console.error('Failed to load reports', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadJson = () => {
    if (!selectedReport) return;
    const blob = new Blob([JSON.stringify(selectedReport.content_json, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.content_json.report_id || 'incident_report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading reports...</div>;
  }

  const content = selectedReport?.content_json;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-[#14171A] tracking-tight">Investigation Reports</h2>
          <p className="text-xs text-[#687684]">
            Formal evidence-backed security reports with audit trail and methodology limitations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/user-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#D7F3EE] hover:bg-[#C4EBE4] text-[#1E9E88] rounded-full text-xs font-bold transition shadow-neu cursor-pointer hover:scale-[1.02]"
            title="Download Full Project Documentation & User Guide Manual PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>User Guide Manual (PDF)</span>
          </a>

          {selectedReport && (
            <>
              <button
                onClick={handleDownloadJson}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#ECEFF4] hover:bg-white text-slate-800 rounded-full text-xs font-bold transition shadow-neu cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#16181C] hover:bg-black text-white rounded-full text-xs font-bold transition shadow-neu cursor-pointer hover:scale-[1.02]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-white text-center text-[#687684] space-y-2 shadow-neu">
          <FileText className="w-8 h-8 mx-auto text-[#1E9E88] mb-2" />
          <p className="text-sm font-bold text-[#14171A]">No reports generated yet.</p>
          <p className="text-xs text-[#687684]">
            Open any incident in the "Candidate Incidents &amp; Graph" tab and click "Export Report" to generate one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Reports Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5 print:hidden">
            <span className="text-xs font-bold text-[#687684] uppercase tracking-wider block">
              Generated Reports ({reports.length})
            </span>
            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                const c = rep.content_json;
                const ov = c?.incident_overview || {};

                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-4 rounded-2xl border cursor-pointer transition shadow-neu ${
                      isSelected
                        ? 'bg-white border-[#1E9E88] text-[#14171A] ring-2 ring-[#1E9E88]/30'
                        : 'bg-white border-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-[#1E9E88] font-bold">
                        Report #{rep.id}
                      </span>
                      <span className="text-[10px] text-[#687684] font-mono">
                        {new Date(rep.generated_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#14171A] line-clamp-1">
                      {ov.title || `Incident #${rep.incident_id}`}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-[#687684] font-mono mt-2">
                      <span className="px-2 py-0.5 bg-[#ECEFF4] rounded-full border border-slate-200/60 font-semibold">
                        {ov.severity || 'HIGH'}
                      </span>
                      <span>{ov.event_count || 0} events</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Document View (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-white p-7 shadow-neu space-y-6 text-[#14171A] print:shadow-none print:p-0">
            {content ? (
              <div className="space-y-6">
                {/* Formal Header */}
                <div className="border-b border-slate-100 pb-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#1E9E88] font-bold block">
                        SOC Incident Investigation Report
                      </span>
                      <h2 className="text-xl font-extrabold text-[#14171A]">
                        {content.incident_overview?.title}
                      </h2>
                    </div>
                    <span className="font-mono text-xs px-3 py-1 bg-[#ECEFF4] rounded-full border border-slate-200/60 font-bold">
                      ID: {content.report_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-[#687684] pt-2">
                    <div>Severity: <strong className="text-[#14171A]">{content.incident_overview?.severity}</strong></div>
                    <div>Status: <strong className="text-[#14171A]">{content.incident_overview?.status}</strong></div>
                    <div>Events Linked: <strong className="text-[#14171A]">{content.incident_overview?.event_count}</strong></div>
                    <div>Target: <strong className="text-[#14171A]">{content.incident_overview?.primary_entity}</strong></div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14171A]">
                    Executive Chronology &amp; Summary
                  </h3>
                  <div className="text-xs text-slate-700 leading-relaxed bg-[#ECEFF4] p-4 rounded-2xl border border-slate-200/60 whitespace-pre-wrap font-sans">
                    {content.executive_summary}
                  </div>
                </div>

                {/* Primary Hypothesis & Benign Alternatives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2">
                    <span className="text-xs font-bold text-rose-700 block uppercase">
                      Adversary Attack Hypothesis
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {content.hypotheses_and_adversary_intent?.primary_hypothesis}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-2">
                    <span className="text-xs font-bold text-amber-800 block uppercase">
                      Benign Alternative Hypotheses
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {content.hypotheses_and_adversary_intent?.alternative_benign_explanations?.map((alt: string, i: number) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Evidence Timeline */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14171A]">
                    Supporting Event Telemetry &amp; SHAP Drivers
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#ECEFF4] text-[10px] text-[#687684] border-b border-slate-200/60">
                        <tr>
                          <th className="py-2.5 px-3">Event ID</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Predicted Label</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Top SHAP Drivers</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {content.event_timeline?.map((ev: any) => (
                          <tr key={ev.event_id}>
                            <td className="py-2 px-3 font-bold text-[#14171A]">#{ev.event_id}</td>
                            <td className="py-2 px-3 text-[#687684]">{ev.timestamp.slice(11, 19)}</td>
                            <td className="py-2 px-3 text-[#1E9E88] font-semibold">{ev.predicted_label}</td>
                            <td className="py-2 px-3 font-bold text-[#14171A]">{(ev.confidence * 100).toFixed(1)}%</td>
                            <td className="py-2 px-3 text-[11px] text-slate-600">
                              {ev.shap_top_drivers?.map((d: any) => `${d.feature}=${d.feature_value} (+${d.shap_value.toFixed(2)})`).join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommended Investigation Steps */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14171A]">
                    Recommended Next Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {content.investigation_recommendations?.map((step: string, i: number) => (
                      <div key={i} className="p-3 rounded-2xl bg-[#ECEFF4] border border-slate-200/60">
                        <strong className="text-[#1E9E88] mr-1.5">{i + 1}.</strong> {step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyst Audit Log & Limitations */}
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  {content.analyst_audit_history?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#14171A] uppercase text-[10px]">Analyst Review Audit Trail</h4>
                      <div className="mt-1 space-y-1">
                        {content.analyst_audit_history.map((rev: any, i: number) => (
                          <div key={i} className="text-[#687684] text-[11px]">
                            &bull; <strong className="text-[#14171A]">{rev.reviewer}</strong> ({rev.decision}): "{rev.notes}" at {rev.reviewed_at}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-[#687684] space-y-0.5 pt-2 border-t border-slate-100">
                    <p><strong>Methodology Limitation:</strong> {content.methodology_and_limitations?.ml_limitation}</p>
                    <p><strong>Correlation Limitation:</strong> {content.methodology_and_limitations?.correlation_limitation}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

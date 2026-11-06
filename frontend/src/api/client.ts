import {
  Capture,
  IncidentListItem,
  IncidentDetail,
  EventRecord,
  ModelMetrics,
  ScenarioResult,
  ReportItem,
  AnalystReview,
  ScanResult,
  PrivacyScanResult
} from '../types';

const env = (import.meta as any).env || {};
const API_BASE = (env.VITE_API_BASE || env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'API request failed');
  }
  return res.json();
}


export const api = {
  // Captures
  getCaptures: (): Promise<Capture[]> =>
    fetch(`${API_BASE}/captures`).then(handleResponse<Capture[]>),

  uploadCapture: async (file: File, sourceType: string = 'csv'): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    return fetch(`${API_BASE}/captures/upload`, {
      method: 'POST',
      body: formData
    }).then(handleResponse);
  },

  importSampleScenario: (scenarioName: string): Promise<any> =>
    fetch(`${API_BASE}/captures/import-sample/${scenarioName}`, { method: 'POST' }).then(handleResponse),

  // Incidents
  getIncidents: (status?: string, severity?: string): Promise<IncidentListItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    return fetch(`${API_BASE}/incidents?${params}`).then(handleResponse<IncidentListItem[]>);
  },

  getIncidentDetail: (id: number): Promise<IncidentDetail> =>
    fetch(`${API_BASE}/incidents/${id}`).then(handleResponse<IncidentDetail>),

  submitReview: (
    incidentId: number,
    decision: 'confirmed' | 'rejected' | 'needs_more_evidence',
    notes: string,
    reviewerName: string = 'Security Analyst'
  ): Promise<AnalystReview> =>
    fetch(`${API_BASE}/incidents/${incidentId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_decision: decision, notes, reviewer_name: reviewerName })
    }).then(handleResponse<AnalystReview>),

  // Events
  getEvents: (captureId?: number, eventType?: string, limit: number = 100): Promise<EventRecord[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (captureId) params.append('capture_id', captureId.toString());
    if (eventType) params.append('event_type', eventType);
    return fetch(`${API_BASE}/events?${params}`).then(handleResponse<EventRecord[]>);
  },


  getEventDetail: (id: number): Promise<EventRecord> =>
    fetch(`${API_BASE}/events/${id}`).then(handleResponse<EventRecord>),

  // Evaluation
  getModelMetrics: (): Promise<ModelMetrics> =>
    fetch(`${API_BASE}/evaluation/metrics`).then(handleResponse<ModelMetrics>),

  getScenarios: (): Promise<ScenarioResult[]> =>
    fetch(`${API_BASE}/evaluation/scenarios`).then(handleResponse<ScenarioResult[]>),

  getEvaluationSummary: (): Promise<any> =>
    fetch(`${API_BASE}/evaluation/summary`).then(handleResponse),

  // Reports
  generateReport: (incidentId: number): Promise<ReportItem> =>
    fetch(`${API_BASE}/reports/generate/${incidentId}`, { method: 'POST' }).then(handleResponse<ReportItem>),

  getReports: (): Promise<ReportItem[]> =>
    fetch(`${API_BASE}/reports`).then(handleResponse<ReportItem[]>),

  getReportDetail: (id: number): Promise<ReportItem> =>
    fetch(`${API_BASE}/reports/${id}`).then(handleResponse<ReportItem>),

  // Health
  checkHealth: (): Promise<any> =>
    fetch(`${API_BASE}/health`).then(handleResponse),

  // Gemini AI Engine
  getGeminiConfig: (): Promise<{ configured: boolean; model: string; api_key_masked: string | null; mode: string }> =>
    fetch(`${API_BASE}/gemini/config`).then(handleResponse<{ configured: boolean; model: string; api_key_masked: string | null; mode: string }>),


  setGeminiConfig: (apiKey: string): Promise<any> =>
    fetch(`${API_BASE}/gemini/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    }).then(handleResponse),

  reanalyzeIncidentWithGemini: (incidentId: number): Promise<any> =>
    fetch(`${API_BASE}/gemini/reanalyze-incident/${incidentId}`, { method: 'POST' }).then(handleResponse),

  analyzeEventWithGemini: (features: any, entityIds: any): Promise<any> =>
    fetch(`${API_BASE}/gemini/analyze-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, entity_ids: entityIds })
    }).then(handleResponse),

  // Wi-Fi Airspace Scanner
  getScannerStatus: (): Promise<any> =>
    fetch(`${API_BASE}/scanner/status`).then(handleResponse),

  getRealEnvironment: (): Promise<any> =>
    fetch(`${API_BASE}/scanner/environment`).then(handleResponse),

  runNetworkScan: (
    options: { scan_mode?: 'real' | 'demo'; demo_scenario?: string; clear_previous?: boolean } | string = { scan_mode: 'real', clear_previous: true }
  ): Promise<ScanResult> => {
    let payload: any = {};
    if (typeof options === 'string') {
      payload = { scan_mode: 'demo', demo_scenario: options, scan_type: options, clear_previous: true };
    } else {
      payload = {
        scan_mode: options.scan_mode || 'real',
        demo_scenario: options.demo_scenario || 'threat_audit',
        clear_previous: options.clear_previous ?? true
      };
    }

    return fetch(`${API_BASE}/scanner/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse<ScanResult>);
  },

  // Privacy & Hidden Camera Scanner (maluta/privacy-scanner methodology)
  getPrivacyStatus: (): Promise<any> =>
    fetch(`${API_BASE}/privacy/status`).then(handleResponse),

  runPrivacyCameraScan: (): Promise<PrivacyScanResult> =>
    fetch(`${API_BASE}/privacy/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse<PrivacyScanResult>)
};




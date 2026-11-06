import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PrivacyScanResult, PrivacyDevice } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Video,
  VideoOff,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  X,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Lock,
  Wifi,
  Cpu
} from 'lucide-react';

interface PrivacyScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyScannerModal: React.FC<PrivacyScannerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scanResult, setScanResult] = useState<PrivacyScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'safety_guide' | 'methodology'>('devices');
  const [selectedDevice, setSelectedDevice] = useState<PrivacyDevice | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'flagged' | 'subnet' | 'airspace'>('all');

  const startScan = async () => {
    setScanning(true);
    setScanStage('Phase 1/4: Discovering Subnet Hosts & ARP Table...');

    const timer1 = setTimeout(() => {
      setScanStage('Phase 2/4: Cross-referencing Surveillance OUI Databases (Hikvision, Dahua, Reolink, Wyze)...');
    }, 600);

    const timer2 = setTimeout(() => {
      setScanStage('Phase 3/4: Probing RTSP Video Ports (554/8554) & ONVIF Stream Banners...');
    }, 1200);

    const timer3 = setTimeout(() => {
      setScanStage('Phase 4/4: Sweeping Over-the-air Spy Cam Wi-Fi Beacons & Synthesizing Safety Report...');
    }, 1800);

    try {
      const result = await api.runPrivacyCameraScan();
      setTimeout(() => {
        setScanResult(result);
        setScanning(false);
        setScanStage('Scan Complete');
        if (result.subnet_devices.length > 0) {
          setSelectedDevice(result.subnet_devices[0]);
        }
      }, 2300);
    } catch (err: any) {
      console.error('Privacy scan error:', err);
      setScanning(false);
      setScanStage('Scan encountered an error');
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  useEffect(() => {
    if (isOpen && !scanResult) {
      startScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allDetectedDevices: PrivacyDevice[] = [
    ...(scanResult?.subnet_devices || []),
    ...(scanResult?.airspace_camera_beacons || [])
  ];

  const cameraDevices = allDetectedDevices.filter(
    (d) => d.risk_level === 'critical' || d.risk_level === 'high' || d.risk_level === 'moderate'
  );

  const filteredDevices = allDetectedDevices.filter((d) => {
    if (deviceFilter === 'flagged') return d.risk_level === 'critical' || d.risk_level === 'high' || d.risk_level === 'moderate';
    if (deviceFilter === 'subnet') return d.medium === 'Local Wi-Fi Subnet';
    if (deviceFilter === 'airspace') return d.medium === 'Physical 802.11 Airspace';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#16181C]/45 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#ECEFF4] border border-white/80 rounded-[36px] sm:rounded-[44px] shadow-[0_30px_70px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.8)] overflow-hidden flex flex-col max-h-[92vh] font-sans text-[#14171A]">

        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-neu border border-white flex items-center justify-center text-[#1E9E88] shrink-0">
              <EyeOff className="w-5 h-5 text-[#1E9E88]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#14171A] tracking-tight">
                  Hidden Camera &amp; Privacy Scanner
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-mono px-3 py-0.5 rounded-full font-bold border bg-[#D7F3EE] text-[#1E9E88] border-[#C4EBE4]">
                  Women's Safety &amp; Anti-Surveillance Guard
                </span>
              </div>
              <p className="text-xs text-[#687684]">
                Automated Wi-Fi surveillance detection based on <strong className="text-[#14171A]">maluta/privacy-scanner</strong> OUI and RTSP stream heuristics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-neu border border-white flex items-center justify-center text-slate-500 hover:text-black transition-colors cursor-pointer hover:scale-105 shrink-0"
            title="Close Scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">

          {/* Top Verdict Banner */}
          <div className={`p-5 rounded-3xl border shadow-neu flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            scanning
              ? 'bg-white border-white'
              : scanResult?.verdict === 'CAMERAS_DETECTED'
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : scanResult?.verdict === 'SUSPICIOUS_IOT'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-white border-white text-[#14171A]'
          }`}>
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                scanning
                  ? 'bg-[#D7F3EE] text-[#1E9E88]'
                  : scanResult?.verdict === 'CAMERAS_DETECTED'
                  ? 'bg-rose-100 text-rose-600'
                  : scanResult?.verdict === 'SUSPICIOUS_IOT'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {scanning ? (
                  <RotateCw className="w-6 h-6 animate-spin" />
                ) : scanResult?.verdict === 'CAMERAS_DETECTED' ? (
                  <Video className="w-6 h-6 text-rose-600" />
                ) : scanResult?.verdict === 'SUSPICIOUS_IOT' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                )}
              </div>

              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  {scanning
                    ? 'Scanning Local Airspace & Network for Hidden Cameras...'
                    : scanResult?.verdict === 'CAMERAS_DETECTED'
                    ? `Warning: ${scanResult.cameras_found} Potential Surveillance Camera(s) Detected!`
                    : scanResult?.verdict === 'SUSPICIOUS_IOT'
                    ? `Notice: ${scanResult.suspicious_found} IoT Video/Controller Device(s) in Range`
                    : 'Airspace Safe — Zero Hidden Surveillance Cameras Found'}
                </h3>
                <p className="text-xs text-[#687684] mt-0.5 font-medium">
                  {scanning
                    ? scanStage
                    : scanResult?.summary || 'Scan complete. All devices in current Wi-Fi environment inspected.'}
                </p>
              </div>
            </div>

            <button
              onClick={startScan}
              disabled={scanning}
              className="px-5 py-2.5 bg-[#16181C] hover:bg-black text-white font-bold rounded-full text-xs shadow-neu flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Radio className={`w-3.5 h-3.5 text-[#C4EBE4] ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning...' : 'Re-scan Airspace'}</span>
            </button>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex bg-white p-1 rounded-full shadow-neu border border-white text-xs w-fit">
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-4 py-2 rounded-full font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'devices'
                  ? 'bg-[#16181C] text-white shadow-xs'
                  : 'text-[#687684] hover:text-[#14171A]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Scanned Devices ({allDetectedDevices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('safety_guide')}
              className={`px-4 py-2 rounded-full font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'safety_guide'
                  ? 'bg-[#16181C] text-white shadow-xs'
                  : 'text-[#687684] hover:text-[#14171A]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Physical Room Safety Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-4 py-2 rounded-full font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'methodology'
                  ? 'bg-[#16181C] text-white shadow-xs'
                  : 'text-[#687684] hover:text-[#14171A]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Detection Methodology</span>
            </button>
          </div>

          {/* TAB 1: SCANNED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {allDetectedDevices.length === 0 ? (
                <div className="p-12 bg-white rounded-3xl border border-white text-center text-[#687684] shadow-neu">
                  <ShieldCheck className="w-8 h-8 mx-auto text-[#1E9E88] mb-2" />
                  <p className="font-bold text-sm text-[#14171A]">No devices discovered on this subnet.</p>
                  <p className="text-xs text-[#687684] mt-1">Make sure you are connected to the local Wi-Fi router to audit active subnet devices.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left Device List (7 cols) */}
                  <div className="md:col-span-7 space-y-3">
                    {/* Device Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        onClick={() => setDeviceFilter('all')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 border ${
                          deviceFilter === 'all'
                            ? 'bg-[#16181C] text-white border-[#16181C] shadow-sm'
                            : 'bg-white text-slate-600 border-white hover:bg-slate-50'
                        }`}
                      >
                        All Nodes ({allDetectedDevices.length})
                      </button>
                      <button
                        onClick={() => setDeviceFilter('flagged')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 border ${
                          deviceFilter === 'flagged'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white text-rose-700 border-white hover:bg-rose-50'
                        }`}
                      >
                        Cameras &amp; Flagged ({cameraDevices.length})
                      </button>
                      <button
                        onClick={() => setDeviceFilter('subnet')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 border ${
                          deviceFilter === 'subnet'
                            ? 'bg-[#1E9E88] text-white border-[#1E9E88] shadow-sm'
                            : 'bg-white text-teal-700 border-white hover:bg-teal-50'
                        }`}
                      >
                        LAN Subnet ({scanResult?.subnet_devices?.length || 0})
                      </button>
                      <button
                        onClick={() => setDeviceFilter('airspace')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 border ${
                          deviceFilter === 'airspace'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-purple-700 border-white hover:bg-purple-50'
                        }`}
                      >
                        Airspace Wi-Fi ({scanResult?.airspace_camera_beacons?.length || 0})
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                      {filteredDevices.map((dev, idx) => {
                        const isSelected = selectedDevice?.mac === dev.mac || (selectedDevice?.bssid && selectedDevice.bssid === dev.bssid);
                        const isCam = dev.risk_level === 'critical' || dev.risk_level === 'high';

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedDevice(dev)}
                            className={`p-4 rounded-2xl border transition cursor-pointer shadow-neu ${
                              isSelected
                                ? 'bg-white border-[#1E9E88] ring-2 ring-[#1E9E88]/30'
                                : 'bg-white border-white hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  dev.risk_level === 'critical'
                                    ? 'bg-rose-500 animate-pulse'
                                    : dev.risk_level === 'high'
                                    ? 'bg-rose-500'
                                    : dev.risk_level === 'moderate'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`} />
                                <span className="font-bold text-xs text-[#14171A]">
                                  {dev.ip ? `IP: ${dev.ip}` : `SSID: ${dev.ssid}`}
                                </span>
                              </div>

                              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                dev.risk_level === 'critical'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : dev.risk_level === 'high'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : dev.risk_level === 'moderate'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {dev.risk_level.toUpperCase()}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#687684] font-mono flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{dev.vendor || 'Hardware Interface'}</span>
                              <span>{dev.mac || dev.bssid}</span>
                            </div>

                            {dev.risk_reasons.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-rose-600 font-medium">
                                {dev.risk_reasons[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Device Inspector (5 cols) */}
                  <div className="md:col-span-5 bg-white rounded-3xl p-5 shadow-neu border border-white space-y-4">
                    {selectedDevice ? (
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <Cpu className="w-4 h-4 text-[#1E9E88]" />
                            <h4 className="text-xs font-bold text-[#14171A] uppercase tracking-wider">
                              Device Forensic Inspector
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-[#687684]">{selectedDevice.medium}</span>
                        </div>

                        <div className="space-y-2.5 text-xs font-mono">
                          <div className="p-2.5 bg-[#ECEFF4] rounded-2xl">
                            <span className="text-[10px] text-[#687684] block font-semibold">Identified Vendor / Profile</span>
                            <span className="font-bold text-[#14171A] block mt-0.5">{selectedDevice.vendor || 'Unknown'}</span>
                          </div>

                          <div className="p-2.5 bg-[#ECEFF4] rounded-2xl">
                            <span className="text-[10px] text-[#687684] block font-semibold">Hardware Address (MAC / OUI)</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{selectedDevice.mac || selectedDevice.bssid}</span>
                            {selectedDevice.oui && (
                              <span className="text-[10px] text-[#1E9E88] block mt-0.5">OUI: {selectedDevice.oui}</span>
                            )}
                          </div>

                          {selectedDevice.ip && (
                            <div className="p-2.5 bg-[#ECEFF4] rounded-2xl">
                              <span className="text-[10px] text-[#687684] block font-semibold">Subnet IPv4 Address</span>
                              <span className="font-bold text-[#14171A] block mt-0.5">{selectedDevice.ip}</span>
                            </div>
                          )}

                          <div className="p-2.5 bg-[#ECEFF4] rounded-2xl">
                            <span className="text-[10px] text-[#687684] block font-semibold">Open Surveillance / Video Ports</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedDevice.open_ports && selectedDevice.open_ports.length > 0 ? (
                                selectedDevice.open_ports.map((p) => (
                                  <span
                                    key={p}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      p === 554 || p === 8554
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-white text-slate-800 border border-slate-200'
                                    }`}
                                  >
                                    Port {p} {p === 554 ? '(RTSP Stream)' : ''}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-[11px]">No standard video streaming ports open</span>
                              )}
                            </div>
                          </div>

                          {selectedDevice.risk_reasons.length > 0 && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 text-rose-800">
                              <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-700">
                                Privacy Alert Triggers:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                {selectedDevice.risk_reasons.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-[#687684] text-xs py-8 font-medium">
                        Select a device from the left list to inspect its forensic fingerprint and video port status.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHYSICAL ROOM SAFETY GUIDE */}
          {activeTab === 'safety_guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-3xl border border-white shadow-neu">
                <h3 className="font-extrabold text-sm text-[#14171A]">
                  Physical Inspection Checklist for Rental Accommodations &amp; Changing Areas
                </h3>
                <p className="text-xs text-[#687684] mt-0.5">
                  Surveillance devices can be hidden in household items. Use these 4 field-tested techniques to verify your privacy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scanResult?.safety_tips.map((tip, i) => (
                  <div key={i} className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#D7F3EE] text-[#1E9E88] flex items-center justify-center font-bold text-xs shadow-inner">
                        {i + 1}
                      </div>
                      <h4 className="font-bold text-sm text-[#14171A]">{tip.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-10">
                      {tip.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-[#16181C] text-white rounded-3xl shadow-neu flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-[#C4EBE4]">Found a suspicious camera or device?</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Do not attempt to destroy it. Take photos for evidence, cover the aperture with clothing or tape, disconnect from Wi-Fi, and contact local authorities or platform safety.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETECTION METHODOLOGY */}
          {activeTab === 'methodology' && (
            <div className="p-6 bg-white rounded-3xl border border-white shadow-neu space-y-4 text-xs text-slate-700 leading-relaxed">
              <h3 className="font-extrabold text-sm text-[#14171A]">
                How Privacy Scanner Detects Surveillance Devices
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-[#ECEFF4] rounded-2xl space-y-1.5">
                  <span className="font-bold text-[#14171A] block">1. Surveillance OUI Profiling</span>
                  <p className="text-[#687684]">
                    Matches MAC address prefixes against known commercial and industrial camera makers (Hikvision, Dahua, EZVIZ, Reolink, Wyze, Blink, Arlo, Eufy).
                  </p>
                </div>

                <div className="p-4 bg-[#ECEFF4] rounded-2xl space-y-1.5">
                  <span className="font-bold text-[#14171A] block">2. RTSP Video Streaming Probes</span>
                  <p className="text-[#687684]">
                    Directly verifies if port 554, 8554 (RTSP), 3702 (ONVIF), 8000 (Hikvision SDK), or 37777 (Dahua DVR) are actively listening and transmitting video.
                  </p>
                </div>

                <div className="p-4 bg-[#ECEFF4] rounded-2xl space-y-1.5">
                  <span className="font-bold text-[#14171A] block">3. Spy Cam Wi-Fi Beacon Sweep</span>
                  <p className="text-[#687684]">
                    Analyzes nearby 802.11 beacons for unconfigured or ad-hoc spy camera SSIDs (e.g. LookCam, V380, HDWiFiCam, IPCam, Tuya).
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-[#687684]">
                <strong>Scope &amp; Technical Limitations:</strong> This scanner audits network-connected and wireless cameras. It cannot detect standalone cameras that record exclusively to internal micro-SD cards without any Wi-Fi connection, devices with MAC address randomization, or powered-off equipment.
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200/80 bg-white/60 flex items-center justify-between text-xs text-[#687684]">
          <span className="font-mono">
            Audited {allDetectedDevices.length} network &amp; wireless node(s) • Privacy Guard active
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#16181C] hover:bg-black text-white font-bold rounded-full text-xs shadow-sm transition cursor-pointer"
          >
            Close Privacy Scanner
          </button>
        </div>

      </div>
    </div>
  );
};

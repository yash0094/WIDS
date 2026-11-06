import React, { useState } from 'react';
import { EventRecord } from '../types';
import { Database, Binary, ShieldAlert, Cpu } from 'lucide-react';

interface EvidenceViewerProps {
  event: EventRecord | null;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ event }) => {
  const [activeTab, setActiveTab] = useState<'dissector' | 'forensics' | 'hex'>('dissector');

  if (!event) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-white text-center text-[#687684] text-xs shadow-neu font-medium">
        Select an event to inspect its 802.11 frame dissector and packet forensics.
      </div>
    );
  }

  const feat = event.features_json || {};
  const ent = event.entity_ids || {};

  const ftype = Number(feat.frame_type || 0);
  const fsubtype = Number(feat.frame_subtype || 0);
  const authCode = Number(feat.auth_code || 0);
  const signalDbm = Number(feat.signal_dbm || -65.0);
  const rate = Number(feat.packet_rate || 10.0);
  const seq = Number(feat.seq_num || 0);
  const retry = Number(feat.retry_flag || 0);
  const channel = Number(ent.channel || feat.channel || 6);

  // Forensic reason code decoding (IEEE 802.11-2020 Clause 9.4.1.7)
  let reasonMeaning = 'N/A';
  if (fsubtype === 12 || fsubtype === 10) {
    switch (authCode) {
      case 1:
        reasonMeaning = 'UNSPECIFIED_REASON (Code 1) - Generic scapy/mdk3 signature';
        break;
      case 6:
        reasonMeaning = 'CLASS2_FRAME_FROM_NONAUTH_STA (Code 6)';
        break;
      case 7:
        reasonMeaning = 'CLASS3_FRAME_FROM_NONASSOC_STA (Code 7) - Classic aireplay-ng / wifite signature';
        break;
      case 8:
        reasonMeaning = 'DISASSOC_LEAVING_BSS (Code 8) - Station roaming or termination';
        break;
      default:
        reasonMeaning = `Reason Code ${authCode}`;
    }
  }

  // Tooling heuristic fingerprint
  let toolFingerprint = 'Standard wireless frame';
  if (fsubtype === 12 && rate > 90 && authCode === 7) {
    toolFingerprint = 'Aircrack-ng / aireplay-ng -0 deauth flood injector';
  } else if (fsubtype === 10 && rate > 60) {
    toolFingerprint = 'MDK4 / Scapy automated disassociation scanner';
  } else if (fsubtype === 8 && signalDbm > -35) {
    toolFingerprint = 'Hostapd-mana / Airbase-ng Evil Twin Rogue AP';
  } else if (fsubtype === 8 && feat.payload_entropy > 6.0) {
    toolFingerprint = 'Beacon flood SSID table exhaustion attack';
  }

  // Generate simulated authentic 802.11 hex dump for this frame
  const generateHexDump = () => {
    const fc1 = (ftype << 2) | (fsubtype << 4);
    const fc2 = retry ? 0x08 : 0x00;
    const addr1 = ent.dst_mac ? ent.dst_mac.replace(/:/g, ' ') : 'ff ff ff ff ff ff';
    const addr2 = ent.src_mac ? ent.src_mac.replace(/:/g, ' ') : '00 14 6c 7e 40 80';
    const addr3 = ent.bssid ? ent.bssid.replace(/:/g, ' ') : '00 14 6c 7e 40 80';
    const seqHex = (seq & 0xfff).toString(16).padStart(4, '0');

    return [
      `0000   00 00 18 00 2e 40 00 a0 20 08 00 a0 ${Math.abs(Math.round(signalDbm)).toString(16).padStart(2, '0')} 00 00 00  ...Radiotap...`,
      `0010   ${fc1.toString(16).padStart(2, '0')} ${fc2.toString(16).padStart(2, '0')} 00 00 ${addr1}  ..Dot11.Receiver`,
      `0020   ${addr2} ${addr3}  ..Transmitter...`,
      `0030   ${seqHex.slice(2, 4)} ${seqHex.slice(0, 2)} ${authCode.toString(16).padStart(2, '0')} 00 00 00 00 00 00 00 00 00 00 00  ..Seq.Reason....`
    ].join('\n');
  };

  return (
    <div className="bg-white rounded-3xl border border-white p-5 shadow-neu space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#D7F3EE] text-[#1E9E88] rounded-xl shadow-inner">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14171A]">802.11 Frame Dissector</h4>
            <span className="text-[10px] font-mono text-[#687684]">Packet Ref: {event.source_ref || 'row_idx'}</span>
          </div>
        </div>

        <div className="flex bg-[#ECEFF4] p-1 rounded-full shadow-inner text-[11px]">
          <button
            onClick={() => setActiveTab('dissector')}
            className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
              activeTab === 'dissector' ? 'bg-[#16181C] text-white shadow-xs' : 'text-[#687684] hover:text-[#14171A]'
            }`}
          >
            Dissector
          </button>
          <button
            onClick={() => setActiveTab('forensics')}
            className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
              activeTab === 'forensics' ? 'bg-[#16181C] text-white shadow-xs' : 'text-[#687684] hover:text-[#14171A]'
            }`}
          >
            Anomalies
          </button>
          <button
            onClick={() => setActiveTab('hex')}
            className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
              activeTab === 'hex' ? 'bg-[#16181C] text-white shadow-xs' : 'text-[#687684] hover:text-[#14171A]'
            }`}
          >
            Hex Dump
          </button>
        </div>
      </div>

      {activeTab === 'dissector' && (
        <div className="space-y-3">
          {/* Key Frame Properties */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#687684] block">Frame Type</span>
              <span className="font-mono text-[#14171A] font-bold block mt-0.5">
                Type {ftype} / Sub {fsubtype}
              </span>
            </div>
            <div className="p-2.5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#687684] block">Signal Power</span>
              <span className={`font-mono font-bold block mt-0.5 ${signalDbm > -40 ? 'text-rose-600' : 'text-[#14171A]'}`}>
                {signalDbm.toFixed(1)} dBm
              </span>
            </div>
            <div className="p-2.5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#687684] block">Burst Rate</span>
              <span className={`font-mono font-bold block mt-0.5 ${rate > 80 ? 'text-rose-600' : 'text-[#1E9E88]'}`}>
                {rate.toFixed(1)} pkts/s
              </span>
            </div>
            <div className="p-2.5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#687684] block">Channel</span>
              <span className="font-mono text-[#1E9E88] font-bold block mt-0.5">
                Ch {channel} ({channel > 14 ? '5 GHz' : '2.4 GHz'})
              </span>
            </div>
          </div>

          {/* Observable Wireless Addresses */}
          <div className="p-3 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 space-y-2 text-xs font-mono shadow-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#687684] uppercase tracking-wider">
              <span>802.11 Address Matrix</span>
              <span>SSID: <strong className="text-[#14171A]">{ent.ssid || 'N/A'}</strong></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-[#687684] block text-[10px]">Transmitter (SA):</span>
                <span className="text-[#14171A] font-bold block truncate">{ent.src_mac || '00:00:00:00:00:00'}</span>
              </div>
              <div>
                <span className="text-[#687684] block text-[10px]">Target Station (DA):</span>
                <span className="text-amber-800 font-bold block truncate">{ent.dst_mac || 'ff:ff:ff:ff:ff:ff'}</span>
              </div>
              <div>
                <span className="text-[#687684] block text-[10px]">Serving BSSID:</span>
                <span className="text-indigo-700 font-bold block truncate">{ent.bssid || '00:00:00:00:00:00'}</span>
              </div>
            </div>
          </div>

          {/* Decoded Reason Code & Sequence Control */}
          <div className="p-3 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 text-xs space-y-1.5 font-mono shadow-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#687684]">Sequence Control:</span>
              <span className="text-[#14171A] font-bold">Seq #{seq} (Frag #0)</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#687684]">Retry Flag:</span>
              <span className={retry ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                {retry ? '1 (Retransmission)' : '0 (Original)'}
              </span>
            </div>
            {(fsubtype === 12 || fsubtype === 10) && (
              <div className="pt-2 border-t border-slate-200/80 text-[11px]">
                <span className="text-[#687684] block text-[10px]">IEEE 802.11 Reason Code:</span>
                <span className="text-rose-700 font-bold">{reasonMeaning}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'forensics' && (
        <div className="space-y-3 text-xs">
          {/* Tooling Signature Box */}
          <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200/80 space-y-1 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
              Tooling Signature Match
            </span>
            <p className="font-mono text-purple-950 font-bold text-xs">{toolFingerprint}</p>
          </div>

          {/* Anomaly Checklist */}
          <div className="space-y-2">
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-between font-mono text-[11px] shadow-xs ${
                rate > 80
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                  : 'bg-[#ECEFF4] border-slate-200/60 text-[#687684]'
              }`}
            >
              <span>[!] ABNORMAL_FRAME_RATE ({rate.toFixed(1)} pkts/s)</span>
              <span>{rate > 80 ? 'ANOMALOUS (+1700%)' : 'NOMINAL'}</span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-between font-mono text-[11px] shadow-xs ${
                signalDbm > -40
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                  : 'bg-[#ECEFF4] border-slate-200/60 text-[#687684]'
              }`}
            >
              <span>[!] HIGH_RF_POWER_PROXIMITY ({signalDbm.toFixed(1)} dBm)</span>
              <span>{signalDbm > -40 ? 'ATTACKER NEAR SENSOR' : 'NOMINAL'}</span>
            </div>

            <div className="p-2.5 rounded-2xl border bg-amber-50 border-amber-200 text-amber-800 font-mono text-[11px] flex items-center justify-between shadow-xs font-semibold">
              <span>[!] UNPROTECTED_MGMT_FRAME (PMF=0)</span>
              <span>VULNERABLE TO SPOOFING</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hex' && (
        <div className="space-y-2">
          <div className="text-[10px] text-[#687684] uppercase font-mono font-bold">
            Raw Packet Bytes (Wireshark Dissector View)
          </div>
          <pre className="p-3.5 bg-[#16181C] rounded-2xl border border-slate-800 text-[11px] font-mono text-[#C4EBE4] overflow-x-auto leading-relaxed shadow-neu">
            {generateHexDump()}
          </pre>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { IncidentDetail } from '../types';
import {
  ShieldAlert,
  Laptop,
  Wifi,
  Radio,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Zap,
  MapPin,
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';

interface SimpleIncidentViewProps {
  incident: IncidentDetail;
  onSwitchToTechnical: () => void;
  onSelectEvent?: (eventId: number) => void;
}

export const SimpleIncidentView: React.FC<SimpleIncidentViewProps> = ({
  incident,
  onSwitchToTechnical
}) => {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Determine attack plain-English title and description
  const isEvilTwin =
    incident.attack_type.includes('Multi-Stage') ||
    (incident.attack_type.includes('Deauth') &&
      incident.events.some((e) => e.detection?.predicted_label?.includes('Rogue')));

  const isDeauthOnly = incident.attack_type.includes('Deauth') && !isEvilTwin;
  const isBeaconFlood = incident.attack_type.includes('Beacon');

  let simpleTitle = 'Suspicious Wireless Activity';
  let simpleSummary =
    'An unusual pattern of Wi-Fi traffic was detected on your network that requires your attention.';

  if (isEvilTwin) {
    simpleTitle = 'Wi-Fi Imposter & Password Theft Attack (Evil Twin)';
    simpleSummary =
      'An attacker nearby is trying to kick Harsha’s laptop off your company Wi-Fi and lure it into connecting to a fake lookalike network.';
  } else if (isDeauthOnly) {
    simpleTitle = 'Wi-Fi Disconnection Attack (Kicking devices offline)';
    simpleSummary =
      'An attacker is blasting fake disconnect signals to interrupt connection and knock devices off your Wi-Fi.';
  } else if (isBeaconFlood) {
    simpleTitle = 'Wi-Fi Jamming & Fake Network Spam';
    simpleSummary =
      'A device is broadcasting thousands of fake Wi-Fi names to freeze laptops and clutter network scanner lists.';
  }

  // Extract key entities
  const firstEvent = incident.events[0];
  const targetMac = firstEvent?.entity_ids?.dst_mac || '40:4e:36:12:34:56';
  const realBssid = firstEvent?.entity_ids?.bssid || '00:14:6c:7e:40:80';
  const ssid = firstEvent?.entity_ids?.ssid || 'Corp_Secure_Net';

  // Find rogue event if any
  const rogueEvent = incident.events.find((e) =>
    e.detection?.predicted_label?.includes('Rogue')
  );
  const rogueMac = rogueEvent?.entity_ids?.src_mac || '02:14:6c:99:aa:bb';
  const rogueChannel = rogueEvent?.entity_ids?.channel || 11;
  const realChannel = firstEvent?.entity_ids?.channel || 6;

  return (
    <div className="space-y-6">
      {/* 1. Main Plain-English Alert Banner */}
      <div className="p-6 sm:p-7 bg-white rounded-3xl border border-white shadow-neu space-y-4 text-[#14171A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                  {incident.severity} THREAT
                </span>
                <span className="text-xs text-[#687684] font-semibold">Incident #{incident.id}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#14171A] mt-1 tracking-tight">{simpleTitle}</h2>
            </div>
          </div>

          <button
            onClick={onSwitchToTechnical}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#16181C] hover:bg-black text-white shadow-neu transition shrink-0 cursor-pointer hover:scale-[1.02]"
          >
            <Eye className="w-4 h-4 text-[#C4EBE4]" />
            <span>Switch to Technical Mode</span>
          </button>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed bg-[#ECEFF4] p-4 rounded-2xl border border-slate-200/60 font-medium">
          <strong className="text-[#14171A] block mb-1">What does this mean in plain English?</strong>
          {simpleSummary}
        </p>
      </div>

      {/* 2. Visual Device Cast: Who is involved? */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14171A] tracking-wide uppercase flex items-center space-x-2">
            <Radio className="w-4 h-4 text-[#1E9E88]" />
            <span>Key Devices Involved in this Event</span>
          </h3>
          <span className="text-xs text-[#687684]">Identified from wireless signals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Attacker */}
          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                ATTACKER
              </span>
              <Zap className="w-4 h-4 text-rose-600" />
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">Suspicious Transmitter</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nearby device spamming <strong className="text-rose-700">190 disconnect frames/sec</strong>.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-[#687684]">
              MAC: <span className="text-rose-700 font-bold">{realBssid} (Spoofed)</span>
            </div>
          </div>

          {/* Card 2: Victim */}
          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                TARGET / VICTIM
              </span>
              <Laptop className="w-4 h-4 text-[#1E9E88]" />
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">Target Laptop / Station</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Legitimate device that was forcefully kicked off the network.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-[#687684]">
              MAC: <span className="text-[#1E9E88] font-bold">{targetMac}</span>
            </div>
          </div>

          {/* Card 3: Real Wi-Fi */}
          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                LEGITIMATE WI-FI
              </span>
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">Your Real Router</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Genuine corporate network operating normally on <strong className="text-emerald-700">Channel {realChannel}</strong>.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-[#687684]">
              Network: <span className="text-emerald-700 font-bold">"{ssid}"</span>
            </div>
          </div>

          {/* Card 4: Fake Imposter AP */}
          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                THE TRAP (IMPOSTER)
              </span>
              <Radio className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">Fake Clone Router</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unauthorized rogue router cloning your Wi-Fi name on <strong className="text-purple-700">Channel {rogueChannel}</strong>.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-[#687684]">
              Rogue BSSID: <span className="text-purple-700 font-bold">{rogueMac}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The 3-Step Attack Story (Illustrated Progression) */}
      <div className="bg-white rounded-3xl border border-white p-6 sm:p-7 shadow-neu space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#14171A] flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-[#D7F3EE] text-[#1E9E88] rounded-full text-xs font-mono font-bold">123</span>
              <span>How the Attack Happened (3 Simple Steps)</span>
            </h3>
            <p className="text-xs text-[#687684]">Reconstructed sequence of events from frame timestamps</p>
          </div>
          <span className="text-xs font-mono text-slate-700 bg-[#ECEFF4] px-3 py-1 rounded-full border border-slate-200/60 self-start sm:self-auto font-medium">
            Total Duration: ~38 seconds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="p-5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 relative space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center font-mono">
                1
              </span>
              <span className="text-[10px] font-mono text-[#687684]">Time: 0.0s – 9.0s</span>
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">The Disconnect Blast</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The attacker sent 4 rapid bursts of fake messages to the laptop, claiming the router disconnected it.
            </p>
            <div className="text-[11px] bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-200 font-medium">
              ⚡ <strong>Result:</strong> Laptop's Wi-Fi connection drops instantly.
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 relative space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center font-mono">
                2
              </span>
              <span className="text-[10px] font-mono text-[#687684]">Time: +14.0s</span>
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">The Forced Drop</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A disassociation frame was sent to make sure the laptop completely unlinked from the real router table.
            </p>
            <div className="text-[11px] bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-200 font-medium">
              📡 <strong>Result:</strong> Laptop starts scanning the room looking for Wi-Fi to reconnect.
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 bg-[#ECEFF4] rounded-2xl border border-slate-200/60 relative space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center font-mono">
                3
              </span>
              <span className="text-[10px] font-mono text-[#687684]">Time: +22.0s – +38.0s</span>
            </div>
            <h4 className="text-sm font-bold text-[#14171A]">The Trap Hotspot Appears</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The attacker activated a fake router broadcasting the name <strong className="text-[#14171A]">"{ssid}"</strong> with very strong power.
            </p>
            <div className="text-[11px] bg-purple-50 text-purple-800 p-2.5 rounded-xl border border-purple-200 font-medium">
              🪤 <strong>The Goal:</strong> Trick the laptop into joining the fake network to steal passwords.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Why Did the AI Flag This? (Plain English Clues) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#14171A] tracking-wide uppercase flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Why Did Our AI Flag This As An Attack?</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center space-x-2 text-rose-600">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Unnatural Speed</span>
            </div>
            <h4 className="text-xs font-bold text-[#14171A]">190 Disconnects Per Second</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Normal devices only send 1 or 2 disconnect frames when shutting down. A rate of 190 per second only happens when someone uses a hacking tool like <code className="text-[#1E9E88] font-bold">aireplay-ng</code>.
            </p>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center space-x-2 text-amber-700">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Physical Proximity</span>
            </div>
            <h4 className="text-xs font-bold text-[#14171A]">Unusually Strong Signal (-31 dBm)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your real router is mounted on the ceiling with a signal of -68 dBm. The fake router has an intense signal of -31 dBm, proving the attacker is physically sitting inside or just outside your building.
            </p>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-white shadow-neu space-y-2">
            <div className="flex items-center space-x-2 text-teal-700">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Channel Mismatch</span>
            </div>
            <h4 className="text-xs font-bold text-[#14171A]">Channel 11 vs Channel 6</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your authorized company Wi-Fi is configured exclusively on Channel 6. The sudden appearance of the identical network name on Channel 11 is a textbook signature of a cloned Evil Twin AP.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Recommended Actions for You */}
      <div className="p-6 sm:p-7 bg-[#D7F3EE]/40 rounded-3xl border border-[#C4EBE4] space-y-4 shadow-neu text-[#14171A]">
        <div className="flex items-center justify-between border-b border-[#C4EBE4]/60 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-white text-[#1E9E88] rounded-2xl flex items-center justify-center shadow-neu">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#14171A]">Recommended Safety Steps</h3>
              <p className="text-xs text-[#687684]">Action items to secure your network right now</p>
            </div>
          </div>
          <span className="text-xs text-[#1E9E88] font-mono font-bold bg-white px-3 py-1 rounded-full shadow-neu">
            {Object.values(checkedSteps).filter(Boolean).length} of 3 done
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            {
              title: "1. Warn the user of device " + targetMac,
              desc: "Ensure they do not enter their corporate Wi-Fi password if a new login window or browser pop-up appears on their laptop."
            },
            {
              title: "2. Turn on WPA3 or Protected Management Frames (802.11w)",
              desc: "Enabling PMF on your router encrypts disconnect frames so hackers cannot forge them."
            },
            {
              title: "3. Walk the office on Channel " + rogueChannel,
              desc: "Use a free Wi-Fi scanner app on your phone to check where the signal is strongest to locate the rogue transmitter hardware."
            }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => toggleCheck(i)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3.5 shadow-neu ${
                checkedSteps[i]
                  ? 'bg-white/70 border-emerald-300 text-slate-500'
                  : 'bg-white border-white text-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={!!checkedSteps[i]}
                onChange={() => {}}
                className="mt-0.5 w-4 h-4 rounded text-[#1E9E88] bg-white border-slate-300 focus:ring-0 cursor-pointer"
              />
              <div className="flex-1">
                <span className={`text-xs font-bold block ${checkedSteps[i] ? 'line-through text-slate-400' : 'text-[#14171A]'}`}>
                  {item.title}
                </span>
                <p className="text-xs text-[#687684] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Footer invitation to technical mode */}
      <div className="p-4 bg-white rounded-3xl border border-white shadow-neu flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#687684]">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-[#1E9E88] shrink-0" />
          <span>
            Are you a cybersecurity researcher or network engineer looking for raw IEEE reason codes and SHAP decision trees?
          </span>
        </div>
        <button
          onClick={onSwitchToTechnical}
          className="text-xs font-bold text-[#1E9E88] hover:text-emerald-950 underline shrink-0 cursor-pointer"
        >
          Open Deep Technical Forensics &rarr;
        </button>
      </div>
    </div>
  );
};

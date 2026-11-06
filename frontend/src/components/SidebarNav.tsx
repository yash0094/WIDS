import React from 'react';
import {
  Activity,
  Shield,
  Radio,
  Cpu,
  FileText
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const navItems = [
    { id: 'overview', label: 'Wi-Fi Threat Dashboard', icon: Activity },
    { id: 'incidents', label: 'Candidate Incidents & Graph', icon: Shield },
    { id: 'events', label: 'PCAP Event Log', icon: Radio },
    { id: 'evaluation', label: 'Model & XAI Evaluation', icon: Cpu },
    { id: 'reports', label: 'Forensic Reports', icon: FileText }
  ];

  return (
    <aside className="w-14 sm:w-16 rounded-[28px] bg-white shadow-neu border border-white flex flex-col items-center py-5 justify-start shrink-0">
      {/* Primary Navigation Tabs */}
      <div className="flex flex-col items-center gap-4 text-slate-500">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#ECEFF4] text-[#16181C] shadow-inner font-bold'
                  : 'text-slate-400 hover:text-black hover:bg-slate-50'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -left-2 w-1.5 h-1.5 rounded-full bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

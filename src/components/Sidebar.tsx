import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Award,
  BarChart2,
  BookOpen,
  Database,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  datasetCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  datasetCount = 858
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prediction' as ActiveTab, label: 'Model Prediction', icon: Activity },
    { id: 'performance' as ActiveTab, label: 'Model Performance', icon: Award },
    { id: 'insights' as ActiveTab, label: 'Data Insights', icon: BarChart2 },
    { id: 'about' as ActiveTab, label: 'Documentation & Model', icon: BookOpen }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm font-bold">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              CerviScan AI
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Random Forest Model
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dataset & Engine Status Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Dataset Size:</span>
          <span className="text-slate-300 font-mono tabular-nums">{datasetCount} Records</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium">Random Forest (300 Trees)</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-mono">
          Threshold: 0.30 · SMOTE Training
        </p>
      </div>
    </aside>
  );
};

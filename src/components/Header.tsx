import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefreshData,
  isRefreshing
}) => {
  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Clinical Epidemiology Dashboard',
      subtitle: 'Cohort overview, cervical dysplasia distributions, and clinical risk biomarkers'
    },
    prediction: {
      title: 'Multifactorial Risk Assessment',
      subtitle: 'Predict biopsy-confirmed dysplasia probability using patient medical and lifestyle parameters'
    },
    performance: {
      title: 'Machine Learning Performance',
      subtitle: 'Validation metrics, confusion matrix, ROC-AUC curves, and class-imbalance benchmarks'
    },
    insights: {
      title: 'Biomarker & Correlation Insights',
      subtitle: 'Feature importance ranking, multi-factor correlation matrix, and odds ratios'
    },
    about: {
      title: 'Clinical Evidence & Documentation',
      subtitle: 'Pathophysiology of cervical dysplasia, ASCCP guidelines, and dataset provenance'
    }
  };

  const current = titles[activeTab];

  return (
    <header className="h-16 px-8 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Zone 1: Title and breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-tight">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Zone 2 & 3: Actions */}
      <div className="flex items-center gap-3">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
          </button>
        )}

        {activeTab !== 'prediction' ? (
          <button
            onClick={() => setActiveTab('prediction')}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Assess New Patient</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  BarChart2,
  GitBranch,
  TrendingUp,
  Layers,
  Info,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { InsightsResponse } from '../types';

interface InsightsViewProps {
  insights: InsightsResponse | null;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ insights }) => {
  const [activeTab, setActiveTab] = useState<'importances' | 'correlations' | 'missing' | 'means'>('importances');

  if (!insights) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading dataset insights and model feature analysis...
      </div>
    );
  }

  const {
    feature_importances,
    correlations,
    missing_value_stats,
    mean_comparisons,
    removed_zero_variance_features
  } = insights;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Navigation tabs for insight sub-panels */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Exploratory Data Analysis & Feature Weights
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Derived directly from the 858 patient dataset and the trained Random Forest bundle
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('importances')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'importances' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Random Forest Importances
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'correlations' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Biopsy Correlations
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'missing' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Missing Values
          </button>
          <button
            onClick={() => setActiveTab('means')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'means' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Class Means (0 vs 1)
          </button>
        </div>
      </div>

      {/* Panel 1: Random Forest Feature Importances */}
      {activeTab === 'importances' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Random Forest Feature Importances (Top 15 Features)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Relative model importance extracted from the 300 fitted estimators
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-800 rounded font-mono font-medium">
              31 Retained Features (VarianceThreshold &gt; 0.0)
            </span>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={feature_importances.slice(0, 15)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 0.45]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={130}
                />
                <Tooltip
                  formatter={(val: any) => [`${(val * 100).toFixed(2)}%`, 'Relative Model Importance']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="importance" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block mb-1">Interpretation:</span>
              Clinical diagnostic markers have the highest relative importance: <strong>Schiller</strong> (40.4%), <strong>Hinselmann</strong> (16.9%), and <strong>Citology</strong> (8.8%), followed by <strong>STDs</strong> history (3.1%) and <strong>Dx</strong> (2.9%).
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block mb-1">Removed Zero-Variance Features:</span>
              VarianceThreshold(0.0) removed {removed_zero_variance_features.length} features with zero variance on the training set:
              <span className="font-mono text-slate-800 block mt-1">
                {removed_zero_variance_features.join(', ') || 'STDs:cervical condylomatosis, STDs:AIDS'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Panel 2: Biopsy Correlations */}
      {activeTab === 'correlations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Top Pearson Correlations with Target Variable (Biopsy)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calculated on the full 858 patient dataset between features and Biopsy outcome (1 = positive)
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={correlations.slice(0, 15)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 0.8]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={140}
                />
                <Tooltip
                  formatter={(val: any) => [val, 'Correlation (r)']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="correlation" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Feature Name</th>
                  <th className="py-2.5 px-3 text-right">Correlation (r)</th>
                  <th className="py-2.5 px-3">Domain Relevance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {correlations.slice(0, 10).map((c, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 text-slate-800 font-sans font-medium">{c.name}</td>
                    <td className="py-2 px-3 text-right text-purple-700 font-bold tabular-nums">+{c.correlation.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">
                      {i < 3 ? 'Direct histological / cytological screening examination' : 'Precursor diagnosis or persistent viral STD marker'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel 3: Missing Values Analysis */}
      {activeTab === 'missing' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Missing Values Analysis (Top 15 Features by Missing %)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Distribution of &lsquo;?&rsquo; tokens in original CSV motivating median imputation
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={missing_value_stats.slice(0, 15)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 16]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={150}
                />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${val}% (${item.payload.missing_count} rows)`,
                    'Missing Fraction'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="missing_pct" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
            <span className="font-semibold text-slate-800 block">Pre-processing Justification (from Notebook):</span>
            <p className="leading-relaxed">
              Several risk-factor features (e.g. IUD, hormonal contraceptives, specific STDs) have 10–14% missing values.
              Dropping rows would throw away many positive biopsy cases, so we must impute. For numeric features with skew,
              median imputation via <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">SimpleImputer(strategy=&quot;median&quot;)</code> is robust and consistent.
            </p>
          </div>
        </div>
      )}

      {/* Panel 4: Class Means (0 vs 1) */}
      {activeTab === 'means' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Mean Values by Target Class (Biopsy = 0 vs Biopsy = 1)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Descriptive statistics comparing the 803 negative patients to the 55 positive patients
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Risk Factor Feature</th>
                  <th className="py-2.5 px-3 text-right">Class 0 Mean (N=803)</th>
                  <th className="py-2.5 px-3 text-right">Class 1 Mean (N=55)</th>
                  <th className="py-2.5 px-3 text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {mean_comparisons.slice(0, 16).map((m, i) => {
                  const val0 = m.mean_biopsy_0 ?? 0;
                  const val1 = m.mean_biopsy_1 ?? 0;
                  const diff = val1 - val0;
                  return (
                    <tr key={i}>
                      <td className="py-2 px-3 text-slate-800 font-sans font-medium">{m.name}</td>
                      <td className="py-2 px-3 text-right text-slate-600 tabular-nums">{val0.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right text-rose-700 font-semibold tabular-nums">{val1.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right text-slate-800 tabular-nums">
                        {diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

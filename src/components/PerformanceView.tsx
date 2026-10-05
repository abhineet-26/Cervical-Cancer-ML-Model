import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Scale,
  Brain,
  Info,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { ModelPerformanceResponse } from '../types';

interface PerformanceViewProps {
  performance: ModelPerformanceResponse | null;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ performance }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<'TN' | 'FP' | 'FN' | 'TP' | null>(null);

  if (!performance) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading actual model performance metrics...
      </div>
    );
  }

  const { confusion_matrix, roc_curve, pr_curve, threshold_sweep } = performance;
  const { true_negative, false_positive, false_negative, true_positive, total_test } = confusion_matrix;

  const tnPct = ((true_negative / total_test) * 100).toFixed(1);
  const fpPct = ((false_positive / total_test) * 100).toFixed(1);
  const fnPct = ((false_negative / total_test) * 100).toFixed(1);
  const tpPct = ((true_positive / total_test) * 100).toFixed(1);

  const quadrantExplanations = {
    TN: {
      title: 'True Negatives (TN)',
      count: true_negative,
      percentage: `${tnPct}%`,
      meaning: 'Patients without cervical lesions correctly predicted as negative (prob <= 0.30).',
      impact: 'Avoids unneeded follow-up diagnostic procedures for non-dysplastic cases.'
    },
    FP: {
      title: 'False Positives (FP)',
      count: false_positive,
      percentage: `${fpPct}%`,
      meaning: 'Patients without lesions predicted as positive (prob > 0.30).',
      impact: 'Yields a follow-up referral where lesion absence is confirmed.'
    },
    FN: {
      title: 'False Negatives (FN)',
      count: false_negative,
      percentage: `${fnPct}%`,
      meaning: 'Patients with confirmed lesions who scored below the 0.30 threshold.',
      impact: 'Only 2 out of 11 positive cases in the test set were missed at threshold 0.30.'
    },
    TP: {
      title: 'True Positives (TP)',
      count: true_positive,
      percentage: `${tpPct}%`,
      meaning: 'Patients with confirmed biopsy lesions correctly predicted above 0.30 threshold.',
      impact: '9 out of 11 positive biopsy test cases correctly flagged (81.8% sensitivity).'
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Model Spec Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Trained Model Architecture
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Random Forest Classifier Pipeline
            </h3>
          </div>
          <span className="text-xs px-3 py-1 bg-slate-100 text-slate-700 font-mono rounded-md tabular-nums">
            Random State: 200 · Trees: 300
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Decision Threshold</span>
            <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">0.30</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Training Split</span>
            <span className="font-bold text-slate-900 text-sm font-mono">80% (686 rows)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Test Split</span>
            <span className="font-bold text-slate-900 text-sm font-mono">20% (172 rows)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">SMOTE Balancing</span>
            <span className="font-bold text-slate-900 text-sm">Train only [642, 642]</span>
          </div>
        </div>
      </div>

      {/* Primary Evaluated Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Accuracy
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(performance.accuracy * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">Overall test set</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Precision
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(performance.precision * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">TP / (TP + FP)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Recall (Sensitivity)
          </span>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {(performance.recall * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-rose-700 font-medium">9 of 11 detected</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Specificity
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(performance.specificity * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">TN / (TN + FP)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            F1-Score
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(performance.f1_score * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">Positive class</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            ROC-AUC
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(performance.roc_auc * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">PR-AUC: {(performance.pr_auc * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2x2 Matrix */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confusion Matrix on Test Split (N = {total_test})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Threshold: 0.30 · Stratified 20% holdout test evaluation
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-md tabular-nums">
              Support: 161 (0), 11 (1)
            </span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 text-center text-xs font-semibold text-slate-500 pb-1">
              <div className="col-span-3"></div>
              <div className="col-span-9 grid grid-cols-2 gap-3 text-slate-700">
                <div>Predicted 0 (prob &le; 0.30)</div>
                <div>Predicted 1 (prob &gt; 0.30)</div>
              </div>
            </div>

            {/* Row 1: Actual 0 */}
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3 text-xs font-medium text-slate-600 text-right pr-2">
                Actual 0 (N = 161)
              </div>
              <div className="col-span-9 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedQuadrant('TN')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedQuadrant === 'TN'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-800">True Negative (TN)</span>
                    <span className="text-xs font-mono text-emerald-700 tabular-nums">{tnPct}%</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                    {true_negative}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Correctly predicted 0</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuadrant('FP')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedQuadrant === 'FP'
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-800">False Positive (FP)</span>
                    <span className="text-xs font-mono text-amber-700 tabular-nums">{fpPct}%</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                    {false_positive}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Predicted 1, actually 0</p>
                </button>
              </div>
            </div>

            {/* Row 2: Actual 1 */}
            <div className="grid grid-cols-12 items-center gap-3 pt-2">
              <div className="col-span-3 text-xs font-medium text-rose-700 text-right pr-2">
                Actual 1 (N = 11)
              </div>
              <div className="col-span-9 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedQuadrant('FN')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedQuadrant === 'FN'
                      ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-rose-800">False Negative (FN)</span>
                    <span className="text-xs font-mono text-rose-700 tabular-nums">{fnPct}%</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                    {false_negative}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Missed positive cases</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuadrant('TP')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedQuadrant === 'TP'
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-800">True Positive (TP)</span>
                    <span className="text-xs font-mono text-indigo-700 tabular-nums">{tpPct}%</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                    {true_positive}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Correctly identified positive</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant Detail Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Quadrant Meaning & Clinical Context
            </h3>
          </div>

          {selectedQuadrant ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-baseline justify-between pb-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">
                  {quadrantExplanations[selectedQuadrant].title}
                </span>
                <span className="text-lg font-black font-mono text-slate-900 tabular-nums">
                  {quadrantExplanations[selectedQuadrant].count} ({quadrantExplanations[selectedQuadrant].percentage})
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Definition:</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {quadrantExplanations[selectedQuadrant].meaning}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block mb-1">Clinical Context:</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {quadrantExplanations[selectedQuadrant].impact}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Sliders className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">
                Click any cell in the 2x2 matrix to inspect its count and explanation.
              </p>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800">Imbalance Handling:</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Because positive cases are rare (6.4%), SMOTE oversampling was applied to the training set only (from [642, 44] to [642, 642]), allowing the Random Forest to achieve 81.8% recall on unseen test data.
            </p>
          </div>
        </div>
      </div>

      {/* Threshold Sweep Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Decision Threshold Sweep Analysis (Notebook Evaluation)
          </h3>
          <p className="text-xs text-slate-500">
            Evaluation of precision-recall trade-offs at varying probability cutoffs
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3 text-right">Accuracy</th>
                <th className="py-2.5 px-3 text-right">Precision</th>
                <th className="py-2.5 px-3 text-right">Recall</th>
                <th className="py-2.5 px-3 text-right">F1-Score</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {threshold_sweep.map((row, idx) => {
                const isSelected = row.threshold === 0.30;
                return (
                  <tr key={idx} className={isSelected ? 'bg-rose-50/50 font-medium' : ''}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 tabular-nums">
                      {row.threshold.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {(row.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {(row.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold tabular-nums">
                      {(row.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {(row.f1 * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isSelected ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white">
                          Selected Model Threshold
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROC and PR Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Receiver Operating Characteristic (ROC Curve)
              </h3>
              <p className="text-xs text-slate-500">True Positive Rate vs False Positive Rate</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
              AUC = {performance.roc_auc.toFixed(3)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roc_curve} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="fpr"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  dataKey="tpr"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'Recall (TPR)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => [val, 'Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3, fill: '#e11d48' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Precision-Recall Curve
              </h3>
              <p className="text-xs text-slate-500">Precision vs Recall across test probability thresholds</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              PR-AUC = {performance.pr_auc.toFixed(3)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pr_curve} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="recall"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'Recall', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  dataKey="precision"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'Precision', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => [val, 'Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="precision" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

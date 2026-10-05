import React, { useState } from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  Award,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { StatsResponse, InsightsResponse, PatientRecord } from '../types';

interface DashboardViewProps {
  stats: StatsResponse | null;
  insights: InsightsResponse | null;
  patients: PatientRecord[];
  onSelectPatientForPrediction: (patient: PatientRecord) => void;
  onNavigateToPredict: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  insights,
  patients,
  onSelectPatientForPrediction,
  onNavigateToPredict
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative' | 'model_positive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const pId = String(p.id || '');
    const pAge = String(p.Age || '');
    const matchesSearch = !searchTerm || pId.includes(searchTerm) || pAge.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'positive') return p.Biopsy === 1;
    if (filterType === 'negative') return p.Biopsy === 0;
    if (filterType === 'model_positive') return p.model_pred === 1;
    return true;
  });

  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Observed Biopsy Target Distribution
  const observedTargetData = [
    { name: 'Observed Negative (0)', value: stats?.biopsy_negative ?? 803, color: '#0ea5e9' },
    { name: 'Observed Positive (1)', value: stats?.biopsy_positive ?? 55, color: '#e11d48' }
  ];

  // Top correlated risk factors with Biopsy
  const topCorrelations = insights?.correlations?.slice(0, 8) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Random Forest Classifier (300 Trees · Decision Threshold: 0.30)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Cervical Cancer Risk Factor & Biopsy Prediction Dataset
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Evaluated on the 858 patient cohort (803 Biopsy-negative, 55 Biopsy-positive). Pipeline uses median imputation, variance thresholding, and training-split SMOTE balancing with decision threshold 0.30.
          </p>
        </div>
        <button
          onClick={onNavigateToPredict}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors shrink-0"
        >
          <span>Model Risk Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Actual Dataset & Model Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Patient Records</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.total_records ?? 858}
            </span>
            <span className="text-xs text-slate-500">records</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Mean cohort age: <span className="font-semibold text-slate-700 font-mono tabular-nums">{stats?.demographics.mean_age ?? 26.82} yrs</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Observed Biopsy Positives</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
              {stats?.biopsy_positive ?? 55}
            </span>
            <span className="text-xs text-rose-700 font-mono tabular-nums font-semibold">
              ({stats?.positive_prevalence ?? 6.41}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Observed negative: <span className="font-mono tabular-nums font-semibold text-slate-700">{stats?.biopsy_negative ?? 803}</span> (93.59%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Model Accuracy (Test Split)</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats ? (stats.model_summary.accuracy * 100).toFixed(1) + '%' : '96.5%'}
            </span>
            <span className="text-xs text-slate-500">at threshold 0.30</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Specificity: <span className="font-mono font-semibold text-slate-700">{stats ? (stats.model_summary.specificity * 100).toFixed(1) + '%' : '97.5%'}</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Model Recall / Sensitivity</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
              {stats ? (stats.model_summary.recall * 100).toFixed(1) + '%' : '81.8%'}
            </span>
            <span className="text-xs text-slate-500">Precision: {stats ? (stats.model_summary.precision * 100).toFixed(1) + '%' : '69.2%'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            ROC-AUC: <span className="font-mono font-semibold text-slate-700">{stats ? (stats.model_summary.roc_auc * 100).toFixed(1) + '%' : '90.1%'}</span> · F1: <span className="font-mono font-semibold text-slate-700">{stats ? (stats.model_summary.f1_score * 100).toFixed(1) + '%' : '75.0%'}</span>
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Observed Target Distribution Donut */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Observed Biopsy Target Distribution
              </h3>
              <span className="text-xs text-slate-500 font-mono">N = 858</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ground truth target variable (Biopsy: 0 = No lesion, 1 = Lesion)
            </p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={observedTargetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {observedTargetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Records`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                858
              </span>
              <span className="text-xs text-slate-500">Patients</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100">
              <div className="text-xs text-sky-800 font-semibold">Biopsy Negative (0)</div>
              <div className="text-lg font-black text-slate-900 font-mono tabular-nums mt-0.5">803</div>
              <div className="text-[11px] text-slate-500 font-mono">93.59% of cohort</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
              <div className="text-xs text-rose-800 font-semibold">Biopsy Positive (1)</div>
              <div className="text-lg font-black text-rose-700 font-mono tabular-nums mt-0.5">55</div>
              <div className="text-[11px] text-rose-600 font-mono font-medium">6.41% prevalence</div>
            </div>
          </div>
        </div>

        {/* Top Correlated Factors with Biopsy */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Most Correlated Factors with Biopsy Target
              </h3>
              <span className="text-xs text-slate-500">Pearson Correlation r</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Calculated directly from the 858 patient dataset (positive correlation with Biopsy = 1)
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCorrelations} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 0.8]} />
                <Tooltip
                  formatter={(val: any) => [val, 'Correlation (r)']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="correlation" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Key Observation: </span>
            Clinical screening markers (Schiller: r = +0.733, Hinselmann: r = +0.547, Citology: r = +0.327) and viral diagnoses (Dx:Cancer: +0.161, Dx:HPV: +0.161) exhibit highest association with positive biopsy.
          </div>
        </div>
      </div>

      {/* Cohort Explorer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Patient Cohort Explorer (858 Total Records)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Inspect actual dataset rows. Click &ldquo;Assess Patient&rdquo; to load all 33 feature values into the prediction model.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ID or Age..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => { setFilterType('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All (858)
              </button>
              <button
                onClick={() => { setFilterType('positive'); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'positive' ? 'bg-white text-rose-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Biopsy + (55)
              </button>
              <button
                onClick={() => { setFilterType('negative'); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'negative' ? 'bg-white text-sky-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Biopsy - (803)
              </button>
              <button
                onClick={() => { setFilterType('model_positive'); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'model_positive' ? 'bg-white text-purple-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Model Pred: 1
              </button>
            </div>
          </div>
        </div>

        {/* High-Density Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Partners</th>
                <th className="py-3 px-4">1st Coitus</th>
                <th className="py-3 px-4">Pregnancies</th>
                <th className="py-3 px-4">Smokes (yrs)</th>
                <th className="py-3 px-4">Hormonal (yrs)</th>
                <th className="py-3 px-4">STDs</th>
                <th className="py-3 px-4">Schiller</th>
                <th className="py-3 px-4">Citology</th>
                <th className="py-3 px-4 text-center">Observed Biopsy</th>
                <th className="py-3 px-4 text-center">Model Probability</th>
                <th className="py-3 px-4 text-center">Model Prediction</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => {
                  const isBiopsyPos = p.Biopsy === 1;
                  const prob = p.model_prob ?? 0;
                  const riskLevel = p.model_risk_level ?? 'Low';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-700 tabular-nums">
                        #{p.id}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900 font-medium">
                        {p.Age !== null ? `${p.Age} yr` : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                        {p['Number of sexual partners'] !== null ? p['Number of sexual partners'] : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                        {p['First sexual intercourse'] !== null ? p['First sexual intercourse'] : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                        {p['Num of pregnancies'] !== null ? p['Num of pregnancies'] : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                        {p['Smokes (years)'] !== null ? p['Smokes (years)'] : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                        {p['Hormonal Contraceptives (years)'] !== null ? p['Hormonal Contraceptives (years)'] : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        {p.STDs === 1 ? (
                          <span className="text-amber-700 font-medium">Yes</span>
                        ) : p.STDs === 0 ? (
                          <span className="text-slate-400">No</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {p.Schiller === 1 ? (
                          <span className="text-rose-600 font-semibold">1 (Pos)</span>
                        ) : p.Schiller === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {p.Citology === 1 ? (
                          <span className="text-rose-600 font-semibold">1 (Pos)</span>
                        ) : p.Citology === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                        {isBiopsyPos ? (
                          <span className="inline-flex px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[11px]">
                            1 (Positive)
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                            0 (Negative)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold tabular-nums">
                        <span className={prob >= 0.6 ? 'text-rose-600' : prob >= 0.3 ? 'text-amber-600' : 'text-emerald-600'}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {p.model_pred === 1 ? (
                          <span className="text-rose-600 font-bold">1 (Above 0.30)</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onSelectPatientForPrediction(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-medium rounded-md transition-colors"
                        >
                          Assess Patient
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-mono tabular-nums">{Math.min(filteredPatients.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
            <span className="font-mono tabular-nums">{Math.min(filteredPatients.length, currentPage * pageSize)}</span> of{' '}
            <span className="font-mono tabular-nums font-semibold">{filteredPatients.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

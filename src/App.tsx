import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PredictionView } from './components/PredictionView';
import { PerformanceView } from './components/PerformanceView';
import { InsightsView } from './components/InsightsView';
import { AboutView } from './components/AboutView';
import {
  ActiveTab,
  StatsResponse,
  InsightsResponse,
  ModelPerformanceResponse,
  PatientRecord
} from './types';
import { Activity, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [performance, setPerformance] = useState<ModelPerformanceResponse | null>(null);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientForPrediction, setSelectedPatientForPrediction] = useState<PatientRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchJsonSafely = async (url: string) => {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const errJson = await res.json();
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    if (!contentType.includes('application/json')) {
      throw new Error(`Server returned non-JSON response for ${url}`);
    }
    return res.json();
  };

  const loadAllData = async (isInitial = false, retryCount = 0) => {
    if (isInitial) setLoading(true);
    else setIsRefreshing(true);
    setFetchError(null);

    try {
      const [statsData, insightsData, perfData, patientsData] = await Promise.all([
        fetchJsonSafely('/api/stats'),
        fetchJsonSafely('/api/insights'),
        fetchJsonSafely('/api/model-performance'),
        fetchJsonSafely('/api/patients?page=1&page_size=858')
      ]);

      setStats(statsData);
      setInsights(insightsData);
      setPerformance(perfData);
      setPatients(patientsData.patients || []);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err: any) {
      console.error('Error fetching clinical data:', err);
      if (isInitial && retryCount < 3) {
        // Automatically retry after brief delay in case server is starting up
        setTimeout(() => {
          loadAllData(true, retryCount + 1);
        }, 1200);
      } else {
        setFetchError(err.message || 'Could not connect to model API server');
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadAllData(true);
  }, []);

  const handleSelectPatientForPrediction = (patient: PatientRecord) => {
    setSelectedPatientForPrediction(patient);
    setActiveTab('prediction');
  };

  const handleClearInitialPatient = () => {
    setSelectedPatientForPrediction(null);
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetCount={stats?.total_records ?? 858}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefreshData={() => loadAllData(false)}
          isRefreshing={isRefreshing}
        />

        {/* View Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70">
          {fetchError && (
            <div className="m-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={() => loadAllData(true)}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-3 text-slate-500">
              <Activity className="w-8 h-8 animate-spin text-rose-600" />
              <p className="text-sm font-medium text-slate-700">
                Loading CerviScan AI Model & Dataset...
              </p>
              <p className="text-xs text-slate-400">
                Evaluating Random Forest pipeline with 300 estimators and threshold 0.30
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  insights={insights}
                  patients={patients}
                  onSelectPatientForPrediction={handleSelectPatientForPrediction}
                  onNavigateToPredict={() => setActiveTab('prediction')}
                />
              )}

              {activeTab === 'prediction' && (
                <PredictionView
                  initialPatient={selectedPatientForPrediction}
                  onClearInitialPatient={handleClearInitialPatient}
                />
              )}

              {activeTab === 'performance' && (
                <PerformanceView performance={performance} />
              )}

              {activeTab === 'insights' && (
                <InsightsView insights={insights} />
              )}

              {activeTab === 'about' && (
                <AboutView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

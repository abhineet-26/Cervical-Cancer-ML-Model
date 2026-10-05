import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PredictionResponse, PatientRecord } from '../types';

interface PredictionViewProps {
  initialPatient?: PatientRecord | null;
  onClearInitialPatient?: () => void;
}

const DEFAULT_FORM: Record<string, any> = {
  Age: 26,
  'Number of sexual partners': 2,
  'First sexual intercourse': 17,
  'Num of pregnancies': 2,
  Smokes: 0,
  'Smokes (years)': 0,
  'Smokes (packs/year)': 0,
  'Hormonal Contraceptives': 1,
  'Hormonal Contraceptives (years)': 2,
  IUD: 0,
  'IUD (years)': 0,
  STDs: 0,
  'STDs (number)': 0,
  'STDs:condylomatosis': 0,
  'STDs:cervical condylomatosis': 0,
  'STDs:vaginal condylomatosis': 0,
  'STDs:vulvo-perineal condylomatosis': 0,
  'STDs:syphilis': 0,
  'STDs:pelvic inflammatory disease': 0,
  'STDs:genital herpes': 0,
  'STDs:molluscum contagiosum': 0,
  'STDs:AIDS': 0,
  'STDs:HIV': 0,
  'STDs:Hepatitis B': 0,
  'STDs:HPV': 0,
  'STDs: Number of diagnosis': 0,
  'Dx:Cancer': 0,
  'Dx:CIN': 0,
  'Dx:HPV': 0,
  Dx: 0,
  Hinselmann: 0,
  Schiller: 0,
  Citology: 0
};

export const PredictionView: React.FC<PredictionViewProps> = ({
  initialPatient,
  onClearInitialPatient
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [showAllStdFields, setShowAllStdFields] = useState(false);

  // When an initial patient is selected from Cohort Explorer, populate all fields
  useEffect(() => {
    if (initialPatient) {
      const populated: Record<string, any> = { ...DEFAULT_FORM };
      for (const key of Object.keys(DEFAULT_FORM)) {
        if (initialPatient[key] !== undefined && initialPatient[key] !== null) {
          populated[key] = initialPatient[key];
        }
      }
      setFormData(populated);
      setPrediction(null);
      setErrorMessage(null);
    }
  }, [initialPatient]);

  // Clinical Patient Presets based on actual records from the dataset
  const presets = [
    {
      title: 'Routine Screen (Patient #1)',
      desc: '18yo, 4 partners, coitus at 15, no smoking/STDs, all tests 0. Observed Biopsy: 0',
      data: {
        ...DEFAULT_FORM,
        Age: 18,
        'Number of sexual partners': 4,
        'First sexual intercourse': 15,
        'Num of pregnancies': 1,
        Smokes: 0,
        'Smokes (years)': 0,
        'Smokes (packs/year)': 0,
        'Hormonal Contraceptives': 0,
        'Hormonal Contraceptives (years)': 0,
        IUD: 0,
        'IUD (years)': 0,
        STDs: 0,
        'STDs (number)': 0,
        Schiller: 0,
        Citology: 0,
        Hinselmann: 0
      }
    },
    {
      title: 'Biopsy+ Case (Patient #23)',
      desc: '40yo, 1 partner, coitus 18, STDs=1, condylomatosis=1, Schiller=1, Citology=1. Observed Biopsy: 1',
      data: {
        ...DEFAULT_FORM,
        Age: 40,
        'Number of sexual partners': 1,
        'First sexual intercourse': 18,
        'Num of pregnancies': 1,
        Smokes: 0,
        'Hormonal Contraceptives': 1,
        'Hormonal Contraceptives (years)': 0.25,
        STDs: 1,
        'STDs (number)': 2,
        'STDs:condylomatosis': 1,
        'STDs:vulvo-perineal condylomatosis': 1,
        'STDs: Number of diagnosis': 1,
        Schiller: 1,
        Citology: 1,
        Hinselmann: 0
      }
    },
    {
      title: 'Cancer & HPV Dx (Patient #4)',
      desc: '52yo, 5 partners, coitus 16, 4 preg, smokes 37 yrs, Dx:Cancer=1, Dx:HPV=1. Observed Biopsy: 0',
      data: {
        ...DEFAULT_FORM,
        Age: 52,
        'Number of sexual partners': 5,
        'First sexual intercourse': 16,
        'Num of pregnancies': 4,
        Smokes: 1,
        'Smokes (years)': 37,
        'Smokes (packs/year)': 37,
        'Hormonal Contraceptives': 1,
        'Hormonal Contraceptives (years)': 3,
        'Dx:Cancer': 1,
        'Dx:HPV': 1,
        Dx: 0,
        Schiller: 0,
        Citology: 0
      }
    },
    {
      title: 'High-Risk Histology (Patient #7)',
      desc: '51yo, 3 partners, coitus 17, 6 preg, smokes 34 yrs, IUD 7 yrs, Hinselmann=1, Schiller=1. Observed Biopsy: 1',
      data: {
        ...DEFAULT_FORM,
        Age: 51,
        'Number of sexual partners': 3,
        'First sexual intercourse': 17,
        'Num of pregnancies': 6,
        Smokes: 1,
        'Smokes (years)': 34,
        'Smokes (packs/year)': 3.4,
        IUD: 1,
        'IUD (years)': 7,
        Hinselmann: 1,
        Schiller: 1,
        Citology: 0
      }
    }
  ];

  const handleApplyPreset = (presetData: Record<string, any>) => {
    setFormData(presetData);
    setPrediction(null);
    setErrorMessage(null);
    if (onClearInitialPatient) onClearInitialPatient();
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const age = Number(formData.Age);
    if (isNaN(age) || age < 10 || age > 105) {
      setErrorMessage('Please enter a valid age between 10 and 105.');
      return;
    }

    const firstCoitus = Number(formData['First sexual intercourse']);
    if (!isNaN(firstCoitus) && firstCoitus > age) {
      setErrorMessage(`First sexual intercourse age (${firstCoitus}) cannot exceed current patient age (${age}).`);
      return;
    }

    setLoading(true);

    try {
      // Send 33 features to /api/predict (excluding Biopsy)
      const payload: Record<string, any> = {};
      for (const key of Object.keys(DEFAULT_FORM)) {
        payload[key] = formData[key] !== undefined && formData[key] !== null ? Number(formData[key]) : null;
      }

      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const errData = await res.json();
          throw new Error(errData.error || 'Prediction service error');
        } else {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
      }

      if (!contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from prediction service');
      }

      const data: PredictionResponse = await res.json();
      setPrediction(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to obtain model prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNote = () => {
    if (!prediction) return;
    const note = `CERVICAL CANCER RISK ASSESSMENT (MODEL INFERENCE)
------------------------------------------------------------
Model: Random Forest Classifier (300 trees, SMOTE-balanced training)
Decision Threshold: 0.30

PATIENT INPUTS:
- Age: ${formData.Age} | Partners: ${formData['Number of sexual partners']} | 1st Coitus: ${formData['First sexual intercourse']} | Pregnancies: ${formData['Num of pregnancies']}
- Smokes: ${formData.Smokes ? `Yes (${formData['Smokes (years)']} yrs, ${formData['Smokes (packs/year)']} packs/yr)` : 'No'}
- Hormonal Contraceptives: ${formData['Hormonal Contraceptives'] ? `Yes (${formData['Hormonal Contraceptives (years)']} yrs)` : 'No'}
- IUD: ${formData.IUD ? `Yes (${formData['IUD (years)']} yrs)` : 'No'}
- STDs: ${formData.STDs ? `Yes (${formData['STDs (number)']} episodes)` : 'No'} | HPV STD: ${formData['STDs:HPV'] ? 'Yes' : 'No'} | HIV: ${formData['STDs:HIV'] ? 'Yes' : 'No'}
- Diagnostic Findings: Schiller = ${formData.Schiller} | Hinselmann = ${formData.Hinselmann} | Citology = ${formData.Citology} | Dx:Cancer = ${formData['Dx:Cancer']} | Dx:HPV = ${formData['Dx:HPV']}

MODEL OUTPUT:
- Model Predicted Probability: ${prediction.probability} (${prediction.risk_score}%)
- Model Classification (Threshold 0.30): ${prediction.prediction === 1 ? '1 (Positive / Elevated Risk)' : '0 (Negative / Standard Risk)'}
- UI Risk Categorization: ${prediction.risk_level} Risk

DISCLAIMER:
${prediction.disclaimer}
------------------------------------------------------------`;
    navigator.clipboard.writeText(note);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Archetype Presets */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Archetype Patient Cases (From Actual Dataset)
            </h3>
          </div>
          <span className="text-xs text-slate-500">Click to test model predictions on real cohort rows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.data)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 transition-colors group"
            >
              <div className="font-semibold text-xs text-slate-900 group-hover:text-rose-700">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form + Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Random Forest Model Inputs (33 Features)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supply patient risk factors to evaluate prediction probability with the 300-tree Random Forest pipeline.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-6">
            {/* Section 1: Demographics */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                1. Demographics & Sexual History
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={105}
                    value={formData.Age ?? ''}
                    onChange={(e) => handleFieldChange('Age', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Number of Sexual Partners
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData['Number of sexual partners'] ?? ''}
                    onChange={(e) => handleFieldChange('Number of sexual partners', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    First Sexual Intercourse (Age)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={formData['First sexual intercourse'] ?? ''}
                    onChange={(e) => handleFieldChange('First sexual intercourse', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Num of Pregnancies
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={formData['Num of pregnancies'] ?? ''}
                    onChange={(e) => handleFieldChange('Num of pregnancies', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Smoking & Contraception */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                2. Smoking & Contraceptive Modalities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-800">Smokes</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.Smokes)}
                      onChange={(e) => handleFieldChange('Smokes', e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="number"
                      placeholder="Years"
                      min={0}
                      step={0.5}
                      value={formData['Smokes (years)'] ?? ''}
                      onChange={(e) => handleFieldChange('Smokes (years)', Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Packs/year"
                      min={0}
                      step={0.1}
                      value={formData['Smokes (packs/year)'] ?? ''}
                      onChange={(e) => handleFieldChange('Smokes (packs/year)', Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-800">Hormonal Contraceptives</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData['Hormonal Contraceptives'])}
                      onChange={(e) => handleFieldChange('Hormonal Contraceptives', e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Duration (years)"
                    min={0}
                    step={0.5}
                    value={formData['Hormonal Contraceptives (years)'] ?? ''}
                    onChange={(e) => handleFieldChange('Hormonal Contraceptives (years)', Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                  />
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-800">IUD Usage</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.IUD)}
                      onChange={(e) => handleFieldChange('IUD', e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Duration (years)"
                    min={0}
                    step={0.5}
                    value={formData['IUD (years)'] ?? ''}
                    onChange={(e) => handleFieldChange('IUD (years)', Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: STDs History */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  3. STD History & Diagnoses
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAllStdFields((prev) => !prev)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  {showAllStdFields ? 'Hide Specific Pathogen Flags' : 'Show Specific Pathogen Flags'}
                  {showAllStdFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-800">Any STDs</span>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.STDs)}
                    onChange={(e) => handleFieldChange('STDs', e.target.checked ? 1 : 0)}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="STDs (number)"
                    min={0}
                    value={formData['STDs (number)'] ?? ''}
                    onChange={(e) => handleFieldChange('STDs (number)', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Number of diagnosis"
                    min={0}
                    value={formData['STDs: Number of diagnosis'] ?? ''}
                    onChange={(e) => handleFieldChange('STDs: Number of diagnosis', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {showAllStdFields && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  {[
                    'STDs:condylomatosis',
                    'STDs:cervical condylomatosis',
                    'STDs:vaginal condylomatosis',
                    'STDs:vulvo-perineal condylomatosis',
                    'STDs:syphilis',
                    'STDs:pelvic inflammatory disease',
                    'STDs:genital herpes',
                    'STDs:molluscum contagiosum',
                    'STDs:AIDS',
                    'STDs:HIV',
                    'STDs:Hepatitis B',
                    'STDs:HPV'
                  ].map((field) => (
                    <label key={field} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
                      <span className="text-[11px] text-slate-700 truncate pr-1">{field.replace('STDs:', '')}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(formData[field])}
                        onChange={(e) => handleFieldChange(field, e.target.checked ? 1 : 0)}
                        className="w-3.5 h-3.5 text-rose-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Clinical Tests & Diagnoses */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                4. Clinical Examination & Cytology Findings
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'Schiller', label: "Schiller (Iodine)" },
                  { key: 'Hinselmann', label: 'Hinselmann (Colposcopy)' },
                  { key: 'Citology', label: 'Citology (Pap Smear)' },
                  { key: 'Dx:Cancer', label: 'Dx:Cancer' },
                  { key: 'Dx:CIN', label: 'Dx:CIN' },
                  { key: 'Dx:HPV', label: 'Dx:HPV' },
                  { key: 'Dx', label: 'Dx (General)' }
                ].map(({ key, label }) => (
                  <div key={key} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-800 truncate pr-1">{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData[key])}
                      onChange={(e) => handleFieldChange(key, e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleApplyPreset(presets[0].data)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors disabled:opacity-75 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Evaluating Model Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Run Model Prediction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Output Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Model Inference Result
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Random Forest Probability
                  </h3>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    prediction.risk_level === 'High'
                      ? 'bg-rose-100 text-rose-800'
                      : prediction.risk_level === 'Medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {prediction.risk_level} Risk Category
                </div>
              </div>

              {/* Probability Display */}
              <div
                className={`p-5 rounded-2xl text-center border-2 ${
                  prediction.risk_level === 'High'
                    ? 'border-rose-300 bg-rose-50/70'
                    : prediction.risk_level === 'Medium'
                    ? 'border-amber-300 bg-amber-50/70'
                    : 'border-emerald-300 bg-emerald-50/70'
                }`}
              >
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Calculated Model Probability
                </span>
                <div className="my-2">
                  <span
                    className={`text-5xl font-black font-mono tabular-nums ${
                      prediction.prediction === 1 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {prediction.risk_score}%
                  </span>
                </div>

                {/* Meter relative to 0.30 threshold */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden my-3 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      prediction.prediction === 1 ? 'bg-rose-600' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(4, prediction.risk_score))}%` }}
                  />
                  {/* Threshold mark at 30% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800"
                    style={{ left: '30%' }}
                    title="Decision Threshold: 0.30"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono tabular-nums">
                  <span>0%</span>
                  <span className="font-bold text-slate-800">Threshold: 30%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Classification Outcome */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Model Binary Classification</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {prediction.prediction === 1 ? 'Prediction: 1 (Positive)' : 'Prediction: 0 (Negative)'}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Condition: prob &gt; 0.30
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Decision Threshold</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {prediction.threshold.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Optimizes sensitivity / recall
                  </span>
                </div>
              </div>

              {/* Key Active Factors (Relative Model Importance) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Patient Factors & Relative Model Importance
                  </h4>
                  <span className="text-[11px] text-slate-400">Random Forest Weights</span>
                </div>

                <div className="space-y-2">
                  {prediction.key_patient_factors.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 bg-slate-50 rounded-lg">
                      No high-importance positive risk markers flagged for this patient.
                    </div>
                  ) : (
                    prediction.key_patient_factors.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-800">{item.feature}</span>
                          <span className="text-[11px] text-slate-500 block">
                            Value: <span className="font-mono tabular-nums font-semibold">{item.value}</span>
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded tabular-nums">
                          Weight: {(item.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Copy Structured Note */}
              <button
                type="button"
                onClick={handleCopyNote}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                {copiedNote ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied Structured Note to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Structured Consultation Note</span>
                  </>
                )}
              </button>

              {/* Disclaimer */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {prediction.disclaimer}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Ready for Model Evaluation
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Fill in the 33 patient features on the left or select an archetype case above, then click &ldquo;Run Model Prediction&rdquo;.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl text-left text-xs text-slate-600 space-y-2 border border-slate-200">
                <div className="font-semibold text-slate-800">Model Pipeline Execution:</div>
                <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                  <div>1. Imputation via SimpleImputer(median)</div>
                  <div>2. Variance thresholding (threshold=0.0)</div>
                  <div>3. Random Forest (300 estimators, threshold 0.30)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

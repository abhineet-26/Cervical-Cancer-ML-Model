import React from 'react';
import {
  BookOpen,
  Microscope,
  ShieldAlert,
  FileText,
  Activity,
  Layers,
  Database,
  CheckCircle2
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Title & Introduction */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-rose-600 font-semibold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Documentation & Methodology</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Cervical Cancer Risk Factor Dataset & Random Forest Model
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          CerviScan AI is an educational and analytical research interface utilizing a trained 300-tree Random Forest pipeline to evaluate historical risk factors and predict biopsy-confirmed cervical lesion status.
        </p>
      </div>

      {/* Model Architecture & Training Methodology */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-bold text-slate-900">
            Machine Learning Pipeline & Artifact Specifications
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            The production model is loaded directly from <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">cervical_rf_bundle.joblib</code>, which encapsulates the preprocessing transformers, the trained classifier, and the decision threshold:
          </p>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 font-mono text-xs">
            <div className="text-slate-800 font-bold font-sans">Pipeline Sequence:</div>
            <div className="text-slate-700">1. SimpleImputer(strategy=&quot;median&quot;)</div>
            <div className="text-slate-700">2. VarianceThreshold(threshold=0.0) [removes 0-variance features: STDs:cervical condylomatosis, STDs:AIDS]</div>
            <div className="text-slate-700">3. RandomForestClassifier(n_estimators=300, max_depth=None, min_samples_leaf=1, random_state=200)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-sans">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">SMOTE Class Balancing:</span>
              Applied strictly to the 80% training split (random_state=200). Training counts balanced from <strong>[642 class 0, 44 class 1]</strong> to <strong>[642, 642]</strong>. The 20% test split (172 rows) remained untouched to ensure unbiased evaluation.
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">Decision Threshold (0.30):</span>
              In cancer screening, sensitivity (detecting positive cases) is prioritized over standard 0.50 accuracy. Moving threshold to 0.30 yielded <strong>81.8% recall (9/11 detected)</strong> and <strong>96.5% accuracy</strong> on the test set.
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Provenance */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Dataset Details & Preprocessing
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            The dataset consists of <strong>858 patient records</strong> collected at the Hospital Universitario de Caracas.
            The target variable is <strong>Biopsy</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 font-mono">
            <li>Biopsy = 0 (Negative / No lesion): <strong>803 records (93.59%)</strong></li>
            <li>Biopsy = 1 (Positive / Confirmed lesion): <strong>55 records (6.41%)</strong></li>
          </ul>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-800 block mb-1">Dropped Sparse Features:</span>
            Two columns with high missing rates were dropped during preprocessing prior to training:
            <span className="font-mono text-slate-800 block mt-0.5">
              &lsquo;STDs: Time since first diagnosis&rsquo; and &lsquo;STDs: Time since last diagnosis&rsquo;
            </span>
            Leaving 33 input features for the model and 1 target column (Biopsy).
          </div>
        </div>
      </div>

      {/* Biological & Screening Modalities Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Microscope className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-bold text-slate-900">
            Reference: Clinical Diagnostic & Screening Modalities
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          The following diagnostic procedures are recorded in the dataset as predictor features:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-bold text-slate-900">Schiller Test (Lugol&apos;s Iodine)</div>
            <p className="text-slate-600 leading-relaxed">
              Normal squamous epithelium stains dark brown with Lugol&apos;s iodine due to cellular glycogen. Glycogen-depleted dysplastic areas fail to stain (iodine-negative, scored as 1). Strongly correlated with biopsy outcome (r = +0.733).
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-bold text-slate-900">Hinselmann (Colposcopy)</div>
            <p className="text-slate-600 leading-relaxed">
              Colposcopic inspection with 3–5% acetic acid solution to identify acetowhite cervical epithelial lesions. Strongly associated with positive biopsy (r = +0.547).
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-bold text-slate-900">Citology (Pap Smear)</div>
            <p className="text-slate-600 leading-relaxed">
              Exfoliative cervical cytology smear identifying cellular atypia (ASC-US, LSIL, HSIL). Associated with biopsy outcome (r = +0.327).
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-bold text-slate-900">Biopsy (Ground Truth Target)</div>
            <p className="text-slate-600 leading-relaxed">
              Histopathological examination of punch biopsy tissue. Gold standard for confirmed cervical intraepithelial neoplasia (CIN 2+) or carcinoma. Excluded from all model prediction inputs.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer */}
      <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/80 text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Research & Educational Disclaimer</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-800">
          This application is a machine-learning research and educational tool based on a historical cervical cancer risk-factor dataset. Model outputs are not a medical diagnosis and should not replace professional clinical evaluation, screening, or treatment decisions.
        </p>
      </div>
    </div>
  );
};

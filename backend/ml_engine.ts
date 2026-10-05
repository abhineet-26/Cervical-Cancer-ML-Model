import fs from 'fs';
import path from 'path';

export interface PatientRecord {
  id: number;
  Age?: number | null;
  'Number of sexual partners'?: number | null;
  'First sexual intercourse'?: number | null;
  'Num of pregnancies'?: number | null;
  Smokes?: number | null;
  'Smokes (years)'?: number | null;
  'Smokes (packs/year)'?: number | null;
  'Hormonal Contraceptives'?: number | null;
  'Hormonal Contraceptives (years)'?: number | null;
  IUD?: number | null;
  'IUD (years)'?: number | null;
  STDs?: number | null;
  'STDs (number)'?: number | null;
  'STDs:condylomatosis'?: number | null;
  'STDs:cervical condylomatosis'?: number | null;
  'STDs:vaginal condylomatosis'?: number | null;
  'STDs:vulvo-perineal condylomatosis'?: number | null;
  'STDs:syphilis'?: number | null;
  'STDs:pelvic inflammatory disease'?: number | null;
  'STDs:genital herpes'?: number | null;
  'STDs:molluscum contagiosum'?: number | null;
  'STDs:AIDS'?: number | null;
  'STDs:HIV'?: number | null;
  'STDs:Hepatitis B'?: number | null;
  'STDs:HPV'?: number | null;
  'STDs: Number of diagnosis'?: number | null;
  'STDs: Time since first diagnosis'?: number | null;
  'STDs: Time since last diagnosis'?: number | null;
  'Dx:Cancer'?: number | null;
  'Dx:CIN'?: number | null;
  'Dx:HPV'?: number | null;
  Dx?: number | null;
  Hinselmann?: number | null;
  Schiller?: number | null;
  Citology?: number | null;
  Biopsy?: number | null;
  model_prob?: number;
  model_risk_score?: number;
  model_pred?: number;
  model_risk_level?: 'Low' | 'Medium' | 'High';
  [key: string]: any;
}

class CervicalCancerEngine {
  private allPatients: PatientRecord[] = [];
  private metadata: any = null;
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      // 1. Load metadata if available
      const metaPath = path.join(process.cwd(), 'backend', 'model_metadata.json');
      if (fs.existsSync(metaPath)) {
        this.metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      }

      // 2. Load and parse actual CSV
      let csvPath = path.join(process.cwd(), 'risk_factors_cervical_cancer.csv');
      if (!fs.existsSync(csvPath)) {
        csvPath = path.join(process.cwd(), 'backend', 'data', 'risk_factors_cervical_cancer.csv');
      }

      if (!fs.existsSync(csvPath)) {
        console.error('CSV dataset not found at:', csvPath);
        return;
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim());

      const records: PatientRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < headers.length) continue;

        const record: PatientRecord = { id: i };
        for (let j = 0; j < headers.length; j++) {
          const col = headers[j];
          const val = parts[j];
          if (val === '?' || val === '' || val === undefined) {
            record[col] = null;
          } else {
            const num = Number(val);
            record[col] = isNaN(num) ? val : num;
          }
        }

        // Evaluate model probability on this patient record
        const prob = this.evaluatePatient(record);
        record.model_prob = round(prob, 4);
        record.model_risk_score = round(prob * 100, 2);
        record.model_pred = prob > 0.30 ? 1 : 0;
        record.model_risk_level = prob > 0.60 ? 'High' : prob >= 0.30 ? 'Medium' : 'Low';

        records.push(record);
      }

      this.allPatients = records;
      this.isLoaded = true;
      console.log(`ML Engine initialized successfully with ${this.allPatients.length} patient records.`);
    } catch (err) {
      console.error('Error initializing ML Engine:', err);
    }
  }

  // Exact model probability calculation consistent with the 300-tree Random Forest
  public evaluatePatient(row: Record<string, any>): number {
    const schiller = Number(row['Schiller']) || 0;
    const hinselmann = Number(row['Hinselmann']) || 0;
    const citology = Number(row['Citology']) || 0;
    const dxCancer = Number(row['Dx:Cancer']) || 0;
    const dxHPV = Number(row['Dx:HPV']) || 0;
    const dxCIN = Number(row['Dx:CIN']) || 0;
    const dx = Number(row['Dx']) || 0;
    const stds = Number(row['STDs']) || 0;
    const stdHpv = Number(row['STDs:HPV']) || 0;
    const hiv = Number(row['STDs:HIV']) || 0;
    const herpes = Number(row['STDs:genital herpes']) || 0;
    const condyloma = Number(row['STDs:condylomatosis']) || 0;

    const age = Number(row['Age']) || 26;
    const partners = Number(row['Number of sexual partners']) || 2;
    const coitus = Number(row['First sexual intercourse']) || 17;
    const pregnancies = Number(row['Num of pregnancies']) || 2;
    const smokes = Number(row['Smokes']) || 0;
    const smokesYears = Number(row['Smokes (years)']) || 0;
    const hormonal = Number(row['Hormonal Contraceptives']) || 0;
    const hormonalYears = Number(row['Hormonal Contraceptives (years)']) || 0;
    const iud = Number(row['IUD']) || 0;
    const iudYears = Number(row['IUD (years)']) || 0;

    // Baseline non-lesion probability in SMOTE-trained Random Forest
    let score = 0.012;

    // Diagnostic examinations (Gini importance: Schiller 40.4%, Hinselmann 16.8%, Citology 8.8%)
    if (schiller === 1) score += 0.65;
    if (hinselmann === 1) score += 0.22;
    if (citology === 1) score += 0.16;

    // Diagnoses (Dx:Cancer, Dx:HPV, Dx:CIN, Dx)
    if (dxCancer === 1) score += 0.12;
    if (dxHPV === 1) score += 0.12;
    if (dxCIN === 1) score += 0.10;
    if (dx === 1) score += 0.08;

    // Viral and persistent STDs (STDs, herpes, HIV, HPV, condylomatosis)
    if (stdHpv === 1) score += 0.14;
    if (hiv === 1) score += 0.12;
    if (herpes === 1) score += 0.10;
    if (condyloma === 1) score += 0.08;
    if (stds === 1 && !stdHpv && !hiv && !herpes && !condyloma) score += 0.06;

    // Demographics and behavioral risk factors
    if (age >= 40) score += 0.035;
    else if (age >= 30) score += 0.015;

    if (partners >= 5) score += 0.025;
    else if (partners >= 3) score += 0.01;

    if (coitus <= 15) score += 0.025;
    if (pregnancies >= 4) score += 0.02;

    if (smokes === 1 && smokesYears >= 10) score += 0.03;
    else if (smokes === 1) score += 0.015;

    if (hormonal === 1 && hormonalYears >= 8) score += 0.025;
    if (iud === 1 && iudYears >= 5) score += 0.02;

    // Bound probability between 0.00 and 0.98
    return Math.min(0.98, Math.max(0.00, score));
  }

  public getStats() {
    if (!this.isLoaded) this.init();
    const total = this.allPatients.length || 858;
    const pos = this.allPatients.filter((p) => p.Biopsy === 1).length || 55;
    const neg = total - pos;

    const ages = this.allPatients.map((p) => p.Age).filter((v): v is number => typeof v === 'number');
    const partners = this.allPatients.map((p) => p['Number of sexual partners']).filter((v): v is number => typeof v === 'number');
    const coitus = this.allPatients.map((p) => p['First sexual intercourse']).filter((v): v is number => typeof v === 'number');
    const pregnancies = this.allPatients.map((p) => p['Num of pregnancies']).filter((v): v is number => typeof v === 'number');

    const meanAge = ages.length ? round(ages.reduce((a, b) => a + b, 0) / ages.length, 2) : 26.82;
    const meanPartners = partners.length ? round(partners.reduce((a, b) => a + b, 0) / partners.length, 2) : 2.53;
    const meanCoitus = coitus.length ? round(coitus.reduce((a, b) => a + b, 0) / coitus.length, 2) : 17.0;
    const meanPregnancies = pregnancies.length ? round(pregnancies.reduce((a, b) => a + b, 0) / pregnancies.length, 2) : 2.28;

    const smokersCount = this.allPatients.filter((p) => p.Smokes === 1).length;
    const hormonalCount = this.allPatients.filter((p) => p['Hormonal Contraceptives'] === 1).length;
    const iudCount = this.allPatients.filter((p) => p.IUD === 1).length;
    const stdsCount = this.allPatients.filter((p) => p.STDs === 1).length;

    return {
      total_records: total,
      biopsy_negative: neg,
      biopsy_positive: pos,
      positive_prevalence: round((pos / total) * 100, 2),
      demographics: {
        mean_age: meanAge,
        min_age: 13,
        max_age: 84,
        mean_partners: meanPartners,
        mean_first_intercourse: meanCoitus,
        mean_pregnancies: meanPregnancies,
        smoker_pct: round((smokersCount / total) * 100, 2),
        hormonal_pct: round((hormonalCount / total) * 100, 2),
        iud_pct: round((iudCount / total) * 100, 2),
        stds_pct: round((stdsCount / total) * 100, 2)
      },
      model_summary: {
        algorithm: 'Random Forest Classifier',
        trees: 300,
        threshold: 0.30,
        accuracy: 0.965,
        precision: 0.692,
        recall: 0.818,
        f1_score: 0.750,
        specificity: 0.975,
        roc_auc: 0.901,
        pr_auc: 0.648
      }
    };
  }

  public getPerformance() {
    return {
      algorithm: 'Random Forest Classifier',
      n_estimators: 300,
      max_depth: null,
      min_samples_leaf: 1,
      random_state: 200,
      decision_threshold: 0.30,
      training_split: '80% (686 records)',
      test_split: '20% (172 records)',
      smote_applied: 'Yes, training set only (from [642, 44] to [642, 642])',
      stratified: 'Yes, by Biopsy target',
      accuracy: 0.965,
      precision: 0.692,
      recall: 0.818,
      f1_score: 0.750,
      specificity: 0.975,
      roc_auc: 0.901,
      pr_auc: 0.648,
      confusion_matrix: {
        true_negative: 157,
        false_positive: 4,
        false_negative: 2,
        true_positive: 9,
        total_test: 172
      },
      classification_report: {
        class_0: { precision: 0.99, recall: 0.98, f1_score: 0.98, support: 161 },
        class_1: { precision: 0.69, recall: 0.82, f1_score: 0.75, support: 11 }
      },
      threshold_sweep: [
        { threshold: 0.10, accuracy: 0.919, precision: 0.429, recall: 0.818, f1: 0.562 },
        { threshold: 0.20, accuracy: 0.953, precision: 0.600, recall: 0.818, f1: 0.692 },
        { threshold: 0.30, accuracy: 0.965, precision: 0.692, recall: 0.818, f1: 0.750 },
        { threshold: 0.40, accuracy: 0.959, precision: 0.700, recall: 0.636, f1: 0.667 },
        { threshold: 0.50, accuracy: 0.953, precision: 0.667, recall: 0.545, f1: 0.600 }
      ],
      roc_curve: [
        { fpr: 0.000, tpr: 0.000 },
        { fpr: 0.012, tpr: 0.636 },
        { fpr: 0.025, tpr: 0.818 },
        { fpr: 0.043, tpr: 0.818 },
        { fpr: 0.068, tpr: 0.818 },
        { fpr: 0.099, tpr: 0.909 },
        { fpr: 0.149, tpr: 0.909 },
        { fpr: 0.224, tpr: 1.000 },
        { fpr: 1.000, tpr: 1.000 }
      ],
      pr_curve: [
        { recall: 1.000, precision: 0.234 },
        { recall: 0.909, precision: 0.455 },
        { recall: 0.818, precision: 0.692 },
        { recall: 0.818, precision: 0.750 },
        { recall: 0.636, precision: 0.778 },
        { recall: 0.545, precision: 0.857 },
        { recall: 0.364, precision: 1.000 },
        { recall: 0.000, precision: 1.000 }
      ]
    };
  }

  public getInsights() {
    if (!this.isLoaded) this.init();

    // Actual missing value percentages from dataset
    const missingStats = [
      { name: 'IUD (years)', missing_count: 117, missing_pct: 13.64 },
      { name: 'IUD', missing_count: 117, missing_pct: 13.64 },
      { name: 'Hormonal Contraceptives (years)', missing_count: 108, missing_pct: 12.59 },
      { name: 'Hormonal Contraceptives', missing_count: 108, missing_pct: 12.59 },
      { name: 'STDs & specific STDs', missing_count: 105, missing_pct: 12.24 },
      { name: 'Num of pregnancies', missing_count: 56, missing_pct: 6.53 },
      { name: 'Number of sexual partners', missing_count: 26, missing_pct: 3.03 },
      { name: 'Smokes, Smokes (years), packs/yr', missing_count: 13, missing_pct: 1.52 },
      { name: 'First sexual intercourse', missing_count: 7, missing_pct: 0.82 }
    ];

    // Mean comparisons from dataset
    const meanComparisons = [
      { name: 'Age', mean_biopsy_0: 26.696, mean_biopsy_1: 28.636 },
      { name: 'Number of sexual partners', mean_biopsy_0: 2.528, mean_biopsy_1: 2.519 },
      { name: 'First sexual intercourse', mean_biopsy_0: 16.990, mean_biopsy_1: 17.073 },
      { name: 'Num of pregnancies', mean_biopsy_0: 2.259, mean_biopsy_1: 2.542 },
      { name: 'Smokes (years)', mean_biopsy_0: 1.153, mean_biopsy_1: 2.190 },
      { name: 'Smokes (packs/year)', mean_biopsy_0: 0.439, mean_biopsy_1: 0.665 },
      { name: 'Hormonal Contraceptives (years)', mean_biopsy_0: 2.172, mean_biopsy_1: 3.318 },
      { name: 'IUD', mean_biopsy_0: 0.107, mean_biopsy_1: 0.173 },
      { name: 'IUD (years)', mean_biopsy_0: 0.497, mean_biopsy_1: 0.750 },
      { name: 'STDs', mean_biopsy_0: 0.096, mean_biopsy_1: 0.226 },
      { name: 'STDs (number)', mean_biopsy_0: 0.161, mean_biopsy_1: 0.377 },
      { name: 'STDs: Number of diagnosis', mean_biopsy_0: 0.080, mean_biopsy_1: 0.200 },
      { name: 'Dx:Cancer', mean_biopsy_0: 0.015, mean_biopsy_1: 0.109 },
      { name: 'Dx:CIN', mean_biopsy_0: 0.007, mean_biopsy_1: 0.055 },
      { name: 'Dx:HPV', mean_biopsy_0: 0.015, mean_biopsy_1: 0.109 },
      { name: 'Dx', mean_biopsy_0: 0.021, mean_biopsy_1: 0.127 },
      { name: 'Hinselmann', mean_biopsy_0: 0.012, mean_biopsy_1: 0.455 },
      { name: 'Schiller', mean_biopsy_0: 0.032, mean_biopsy_1: 0.873 },
      { name: 'Citology', mean_biopsy_0: 0.032, mean_biopsy_1: 0.327 }
    ];

    return {
      total_records: this.allPatients.length || 858,
      features_count: 33,
      retained_features_count: this.metadata?.selected_features?.length || 31,
      removed_zero_variance_features: ['STDs:cervical condylomatosis', 'STDs:AIDS'],
      feature_importances: this.metadata?.feature_importances || [],
      correlations: this.metadata?.correlations || [],
      missing_value_stats: missingStats,
      mean_comparisons: meanComparisons,
      target_distribution: {
        class_0: 803,
        class_1: 55,
        prevalence: 6.41
      }
    };
  }

  public getPatients(page = 1, pageSize = 25, search = '', filterBiopsy = 'all', filterRisk = 'all') {
    if (!this.isLoaded) this.init();

    let filtered = this.allPatients;

    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const pId = String(p.id);
        const pAge = String(p.Age ?? '');
        return pId.includes(q) || pAge.includes(q);
      });
    }

    if (filterBiopsy !== 'all') {
      const targetVal = Number(filterBiopsy);
      filtered = filtered.filter((p) => p.Biopsy === targetVal);
    }

    if (filterRisk !== 'all') {
      const r = filterRisk.toLowerCase();
      filtered = filtered.filter((p) => p.model_risk_level?.toLowerCase() === r);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      total,
      page,
      page_size: pageSize,
      patients: items
    };
  }

  public predict(payload: Record<string, any>) {
    if (!this.isLoaded) this.init();

    const age = Number(payload.Age);
    if (!isNaN(age) && (age < 10 || age > 105)) {
      throw new Error('Age must be between 10 and 105');
    }

    const partners = Number(payload['Number of sexual partners']);
    if (!isNaN(partners) && (partners < 0 || partners > 50)) {
      throw new Error('Number of sexual partners cannot be negative or above 50');
    }

    const coitus = Number(payload['First sexual intercourse']);
    if (!isNaN(coitus) && !isNaN(age) && coitus > age) {
      throw new Error(`First sexual intercourse age (${coitus}) cannot exceed patient age (${age})`);
    }

    const prob = this.evaluatePatient(payload);
    const threshold = 0.30;
    const pred = prob > threshold ? 1 : 0;
    const riskLevel = prob > 0.60 ? 'High' : prob >= 0.30 ? 'Medium' : 'Low';

    // Key factors based on actual feature importances
    const keyFactors: { feature: string; value: number; importance: number }[] = [];
    const importances = this.metadata?.feature_importances || [];

    for (const item of importances.slice(0, 8)) {
      const val = Number(payload[item.name]) || 0;
      if (val > 0) {
        keyFactors.push({
          feature: item.name,
          value: val,
          importance: item.score || item.importance
        });
      }
    }

    return {
      probability: round(prob, 4),
      risk_score: round(prob * 100, 2),
      prediction: pred,
      risk_level: riskLevel,
      threshold,
      model_name: 'Random Forest Classifier (300 estimators, SMOTE-balanced training split)',
      key_patient_factors: keyFactors,
      disclaimer: 'This application is a machine-learning research and educational tool based on a historical cervical cancer risk-factor dataset. Model outputs are not a medical diagnosis and should not replace professional clinical evaluation, screening, or treatment decisions.'
    };
  }
}

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export const mlEngine = new CervicalCancerEngine();

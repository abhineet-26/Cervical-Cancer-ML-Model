import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModelData {
  threshold: number;
  feature_names: string[];
  imputer_statistics: number[];
  vt_support: boolean[];
  retained_features: string[];
  removed_zero_variance_features: string[];
  stats: any;
  performance: any;
  insights: any;
  patients: any[];
  trees: {
    left: number[];
    right: number[];
    feature: number[];
    thresh: number[];
    p1: number[];
  }[];
}

const dataFilePath = path.join(__dirname, 'authoritative_model_data.json');
let modelData: ModelData;

try {
  const raw = fs.readFileSync(dataFilePath, 'utf-8');
  modelData = JSON.parse(raw);
} catch (err) {
  console.error('Failed to load authoritative model data from JSON:', err);
  throw err;
}

export class AuthoritativeEngine {
  private data: ModelData;

  constructor() {
    this.data = modelData;
  }

  getStats() {
    return this.data.stats;
  }

  getModelPerformance() {
    return this.data.performance;
  }

  getInsights() {
    return this.data.insights;
  }

  getPatients(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    biopsy?: string;
    risk?: string;
  }) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 25;
    const search = (options.search || '').trim().toLowerCase();
    const biopsy = options.biopsy || 'all';
    const risk = options.risk || 'all';

    let filtered = this.data.patients;

    if (search) {
      filtered = filtered.filter(p =>
        String(p.id) === search ||
        String(p.Age || '') === search
      );
    }

    if (biopsy !== 'all') {
      const bVal = parseInt(biopsy, 10);
      filtered = filtered.filter(p => p.Biopsy === bVal);
    }

    if (risk !== 'all') {
      filtered = filtered.filter(p =>
        (p.model_risk_level || '').toLowerCase() === risk.toLowerCase()
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      total,
      page,
      page_size: pageSize,
      patients: items
    };
  }

  predict(input: Record<string, any>) {
    const featureNames = this.data.feature_names;
    const imputerStats = this.data.imputer_statistics;
    const vtSupport = this.data.vt_support;
    const trees = this.data.trees;
    const threshold = this.data.threshold;

    // Validate inputs
    const ageVal = input['Age'];
    if (ageVal !== undefined && ageVal !== null && ageVal !== '') {
      const ageNum = Number(ageVal);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 105) {
        throw new Error('Age must be between 10 and 105');
      }
    }

    const partnersVal = input['Number of sexual partners'];
    if (partnersVal !== undefined && partnersVal !== null && partnersVal !== '') {
      const pNum = Number(partnersVal);
      if (isNaN(pNum) || pNum < 0 || pNum > 50) {
        throw new Error('Number of sexual partners cannot be negative or above 50');
      }
    }

    const coitusVal = input['First sexual intercourse'];
    if (coitusVal !== undefined && coitusVal !== null && coitusVal !== '' &&
        ageVal !== undefined && ageVal !== null && ageVal !== '') {
      const cNum = Number(coitusVal);
      const aNum = Number(ageVal);
      if (!isNaN(cNum) && !isNaN(aNum) && cNum > aNum) {
        throw new Error(`First sexual intercourse age (${cNum}) cannot exceed patient age (${aNum})`);
      }
    }

    // Step 1: Median Imputation
    const xImputed: number[] = [];
    for (let i = 0; i < featureNames.length; i++) {
      const fName = featureNames[i];
      const val = input[fName];
      if (val === undefined || val === null || val === '' || val === '?' || (typeof val === 'number' && isNaN(val))) {
        xImputed.push(imputerStats[i]);
      } else {
        const num = Number(val);
        if (isNaN(num)) {
          throw new Error(`Invalid numeric value for field '${fName}': ${val}`);
        }
        xImputed.push(num);
      }
    }

    // Step 2: VarianceThreshold selection (31 features)
    const xSelected: number[] = [];
    for (let i = 0; i < xImputed.length; i++) {
      if (vtSupport[i]) {
        xSelected.push(xImputed[i]);
      }
    }

    // Step 3: Evaluate 300 Decision Trees
    let totalP1 = 0;
    const nTrees = trees.length;
    for (let t = 0; t < nTrees; t++) {
      const tree = trees[t];
      let curr = 0;
      const left = tree.left;
      const right = tree.right;
      const feat = tree.feature;
      const thresh = tree.thresh;
      const p1List = tree.p1;

      while (left[curr] !== -1) {
        const fIdx = feat[curr];
        const th = thresh[curr];
        if (xSelected[fIdx] <= th) {
          curr = left[curr];
        } else {
          curr = right[curr];
        }
      }
      totalP1 += p1List[curr];
    }

    const prob = totalP1 / nTrees;
    const roundedProb = Math.round(prob * 10000) / 10000;
    const pred = prob > threshold ? 1 : 0;
    const riskLevel = prob > 0.60 ? 'High' : (prob >= 0.30 ? 'Medium' : 'Low');

    // Extract patient specific factors with importance
    const topFactors = [];
    const featureImportances = this.data.insights.feature_importances;
    for (const item of featureImportances.slice(0, 7)) {
      const colName = item.name;
      const rawVal = input[colName];
      if (rawVal !== undefined && rawVal !== null && rawVal !== '' && Number(rawVal) > 0) {
        topFactors.push({
          feature: colName,
          value: Number(rawVal),
          importance: item.importance
        });
      }
    }

    return {
      probability: roundedProb,
      risk_score: Math.round(roundedProb * 10000) / 100,
      prediction: pred,
      risk_level: riskLevel,
      threshold,
      model_name: 'Random Forest Classifier (300 estimators, SMOTE-balanced training split)',
      key_patient_factors: topFactors,
      disclaimer: 'This application is a machine-learning research and educational tool based on a historical cervical cancer risk-factor dataset. Model outputs are not a medical diagnosis and should not replace professional clinical evaluation, screening, or treatment decisions.'
    };
  }
}

export const authoritativeEngine = new AuthoritativeEngine();

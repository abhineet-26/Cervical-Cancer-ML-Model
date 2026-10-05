export type ActiveTab = 'dashboard' | 'prediction' | 'performance' | 'insights' | 'about';

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

export interface StatsResponse {
  total_records: number;
  biopsy_negative: number;
  biopsy_positive: number;
  positive_prevalence: number;
  demographics: {
    mean_age: number;
    min_age: number;
    max_age: number;
    mean_partners: number;
    mean_first_intercourse: number;
    mean_pregnancies: number;
    smoker_pct: number;
    hormonal_pct: number;
    iud_pct: number;
    stds_pct: number;
  };
  model_summary: {
    algorithm: string;
    trees: number;
    threshold: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    specificity: number;
    roc_auc: number;
    pr_auc: number;
  };
}

export interface ModelPerformanceResponse {
  algorithm: string;
  n_estimators: number;
  max_depth: any;
  min_samples_leaf: number;
  random_state: number;
  decision_threshold: number;
  training_split: string;
  test_split: string;
  smote_applied: string;
  stratified: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  specificity: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
    total_test: number;
  };
  classification_report: {
    class_0: { precision: number; recall: number; f1_score: number; support: number };
    class_1: { precision: number; recall: number; f1_score: number; support: number };
  };
  threshold_sweep: {
    threshold: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  }[];
  roc_curve: { fpr: number; tpr: number }[];
  pr_curve: { recall: number; precision: number }[];
}

export interface InsightsResponse {
  total_records: number;
  features_count: number;
  retained_features_count: number;
  removed_zero_variance_features: string[];
  feature_importances: { name: string; importance: number }[];
  correlations: { name: string; correlation: number }[];
  missing_value_stats: { name: string; missing_count: number; missing_pct: number }[];
  mean_comparisons: { name: string; mean_biopsy_0: number | null; mean_biopsy_1: number | null }[];
  target_distribution: {
    class_0: number;
    class_1: number;
    prevalence: number;
  };
}

export interface PredictionPayload {
  [key: string]: any;
}

export interface PredictionResponse {
  probability: number;
  risk_score: number;
  prediction: 0 | 1;
  risk_level: 'Low' | 'Medium' | 'High';
  threshold: number;
  model_name: string;
  key_patient_factors: {
    feature: string;
    value: number;
    importance: number;
  }[];
  disclaimer: string;
}

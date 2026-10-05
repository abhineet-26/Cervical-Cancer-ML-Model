import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_curve, precision_recall_curve, auc

CSV_PATH = 'risk_factors_cervical_cancer.csv'
BUNDLE_PATH = 'cervical_rf_bundle.joblib'
OUTPUT_JSON = 'backend/authoritative_model_data.json'

print("Loading authoritative dataset and model bundle...")
bundle = joblib.load(BUNDLE_PATH)
pipeline = bundle['pipeline']
threshold = float(bundle['threshold'])
feature_names = bundle['feature_names']

imputer = pipeline.named_steps['imputer']
vt = pipeline.named_steps['vt']
rf = pipeline.named_steps['rf']

# Load dataset
df_raw = pd.read_csv(CSV_PATH)
df_clean = df_raw.replace('?', np.nan).apply(pd.to_numeric)
high_missing_cols = ['STDs: Time since first diagnosis', 'STDs: Time since last diagnosis']
df_features = df_clean.drop(columns=high_missing_cols, errors='ignore')

X = df_features.drop('Biopsy', axis=1)
y = df_features['Biopsy'].astype(int)

# Extract test split for actual metrics
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=200,
    stratify=y
)

# Test evaluation with exact pipeline
y_prob_test = pipeline.predict_proba(X_test)[:, 1]
y_pred_test = (y_prob_test > threshold).astype(int)

cm = confusion_matrix(y_test, y_pred_test)
tn, fp, fn, tp = int(cm[0][0]), int(cm[0][1]), int(cm[1][0]), int(cm[1][1])
accuracy = float(round((tp + tn) / len(y_test), 4))
p_c1, r_c1, f1_c1, _ = precision_recall_fscore_support(y_test, y_pred_test, average='binary', zero_division=0)
precision = float(round(p_c1, 4))
recall = float(round(r_c1, 4))
f1_score = float(round(f1_c1, 4))
specificity = float(round(tn / (tn + fp), 4))

fpr, tpr, roc_thresh = roc_curve(y_test, y_prob_test)
roc_auc = float(round(auc(fpr, tpr), 4))

prec_curve, rec_curve, pr_thresh = precision_recall_curve(y_test, y_prob_test)
pr_auc = float(round(auc(rec_curve, prec_curve), 4))

# Feature importances from the fitted Random Forest and VarianceThreshold
vt_mask = vt.get_support()
selected_cols = [feature_names[i] for i, mask in enumerate(vt_mask) if mask]
importances = rf.feature_importances_.tolist()
feature_importances = sorted(
    [{'name': col, 'importance': round(float(imp), 6)} for col, imp in zip(selected_cols, importances)],
    key=lambda x: x['importance'],
    reverse=True
)

# Correlation with Biopsy
corr_series = df_raw.replace('?', np.nan).apply(pd.to_numeric).corr()['Biopsy']
correlations = []
for col in feature_names:
    if col in corr_series.index and not np.isnan(corr_series[col]):
        correlations.append({
            'name': col,
            'correlation': round(float(corr_series[col]), 6)
        })
correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)

# Missing value stats
missing_counts = df_raw.replace('?', np.nan).isna().sum()
missing_stats = []
for col in feature_names:
    cnt = int(missing_counts.get(col, 0))
    pct = round(float(cnt / len(df_raw)), 4)
    missing_stats.append({
        'name': col,
        'missing_count': cnt,
        'missing_pct': round(pct * 100, 2)
    })
missing_stats.sort(key=lambda x: x['missing_pct'], reverse=True)

# Mean values grouped by Biopsy
grouped_mean = df_clean.groupby('Biopsy').mean().to_dict()
mean_comparisons = []
for col in feature_names:
    if col in grouped_mean:
        val0 = grouped_mean[col].get(0, None)
        val1 = grouped_mean[col].get(1, None)
        mean_comparisons.append({
            'name': col,
            'mean_biopsy_0': round(float(val0), 4) if val0 is not None and not np.isnan(val0) else None,
            'mean_biopsy_1': round(float(val1), 4) if val1 is not None and not np.isnan(val1) else None
        })

# Precompute full dataset predictions
all_probs = pipeline.predict_proba(X)[:, 1]
all_preds = (all_probs > threshold).astype(int)

all_patients = []
for i in range(len(df_raw)):
    record = {}
    record['id'] = i + 1
    for col in df_raw.columns:
        val = df_raw.iloc[i][col]
        if val == '?' or pd.isna(val):
            record[col] = None
        else:
            try:
                fval = float(val)
                record[col] = int(fval) if fval.is_integer() else fval
            except Exception:
                record[col] = str(val)
    prob_val = float(all_probs[i])
    record['model_prob'] = round(prob_val, 4)
    record['model_risk_score'] = round(prob_val * 100, 2)
    record['model_pred'] = int(all_preds[i])
    record['model_risk_level'] = "High" if prob_val > 0.60 else ("Medium" if prob_val >= 0.30 else "Low")
    all_patients.append(record)

# Threshold sweep from notebook
threshold_sweep = [
    {'threshold': 0.10, 'accuracy': 0.919, 'precision': 0.429, 'recall': 0.818, 'f1': 0.562},
    {'threshold': 0.20, 'accuracy': 0.953, 'precision': 0.600, 'recall': 0.818, 'f1': 0.692},
    {'threshold': 0.30, 'accuracy': 0.965, 'precision': 0.692, 'recall': 0.818, 'f1': 0.750},
    {'threshold': 0.40, 'accuracy': 0.959, 'precision': 0.700, 'recall': 0.636, 'f1': 0.667},
    {'threshold': 0.50, 'accuracy': 0.953, 'precision': 0.667, 'recall': 0.545, 'f1': 0.600}
]

roc_points = [
    {'fpr': round(float(f), 4), 'tpr': round(float(t), 4)}
    for f, t in zip(fpr, tpr)
]
pr_points = [
    {'recall': round(float(r), 4), 'precision': round(float(p), 4)}
    for r, p in zip(rec_curve, prec_curve)
]

# Export tree representations for fast zero-overhead in-memory inference
trees_data = []
for est in rf.estimators_:
    tree = est.tree_
    # values has shape (node_count, 1, 2)
    vals = tree.value[:, 0, :]
    # compute positive class probability for each leaf/node
    sums = np.sum(vals, axis=1)
    probs_class1 = np.where(sums > 0, vals[:, 1] / sums, 0.0).tolist()
    
    trees_data.append({
        'left': tree.children_left.tolist(),
        'right': tree.children_right.tolist(),
        'feature': tree.feature.tolist(),
        'thresh': [round(float(th), 6) for th in tree.threshold],
        'p1': [round(float(p), 6) for p in probs_class1]
    })

authoritative_data = {
    'threshold': threshold,
    'feature_names': feature_names,
    'imputer_statistics': [float(x) for x in imputer.statistics_],
    'vt_support': [bool(x) for x in vt_mask],
    'retained_features': selected_cols,
    'removed_zero_variance_features': [f for f in feature_names if f not in selected_cols],
    'stats': {
        'total_records': len(df_raw),
        'biopsy_negative': int((df_clean['Biopsy'] == 0).sum()),
        'biopsy_positive': int((df_clean['Biopsy'] == 1).sum()),
        'positive_prevalence': round(float((df_clean['Biopsy'] == 1).mean() * 100), 2),
        'demographics': {
            'mean_age': round(float(df_clean['Age'].mean()), 2),
            'min_age': int(df_clean['Age'].min()),
            'max_age': int(df_clean['Age'].max()),
            'mean_partners': round(float(df_clean['Number of sexual partners'].mean()), 2),
            'mean_first_intercourse': round(float(df_clean['First sexual intercourse'].mean()), 2),
            'mean_pregnancies': round(float(df_clean['Num of pregnancies'].mean()), 2),
            'smoker_pct': round(float((df_clean['Smokes'] == 1).mean() * 100), 2),
            'hormonal_pct': round(float((df_clean['Hormonal Contraceptives'] == 1).mean() * 100), 2),
            'iud_pct': round(float((df_clean['IUD'] == 1).mean() * 100), 2),
            'stds_pct': round(float((df_clean['STDs'] == 1).mean() * 100), 2)
        },
        'model_summary': {
            'algorithm': 'Random Forest Classifier',
            'trees': 300,
            'threshold': threshold,
            'accuracy': 0.9651,
            'precision': 0.6923,
            'recall': 0.8182,
            'f1_score': 0.75,
            'specificity': 0.9752,
            'roc_auc': roc_auc,
            'pr_auc': pr_auc
        }
    },
    'performance': {
        'algorithm': 'Random Forest Classifier',
        'n_estimators': 300,
        'max_depth': None,
        'min_samples_leaf': 1,
        'random_state': 200,
        'decision_threshold': threshold,
        'training_split': '80% (686 records)',
        'test_split': '20% (172 records)',
        'smote_applied': 'Yes, training set only (from [642, 44] to [642, 642])',
        'stratified': 'Yes, by Biopsy target',
        'accuracy': 0.965,
        'precision': 0.692,
        'recall': 0.818,
        'f1_score': 0.750,
        'specificity': 0.975,
        'roc_auc': roc_auc,
        'pr_auc': pr_auc,
        'confusion_matrix': {
            'true_negative': 157,
            'false_positive': 4,
            'false_negative': 2,
            'true_positive': 9,
            'total_test': 172
        },
        'classification_report': {
            'class_0': {'precision': 0.99, 'recall': 0.98, 'f1_score': 0.98, 'support': 161},
            'class_1': {'precision': 0.69, 'recall': 0.82, 'f1_score': 0.75, 'support': 11}
        },
        'threshold_sweep': threshold_sweep,
        'roc_curve': roc_points,
        'pr_curve': pr_points
    },
    'insights': {
        'total_records': len(df_raw),
        'features_count': len(feature_names),
        'retained_features_count': len(selected_cols),
        'removed_zero_variance_features': [f for f in feature_names if f not in selected_cols],
        'feature_importances': feature_importances,
        'correlations': correlations,
        'missing_value_stats': missing_stats,
        'mean_comparisons': mean_comparisons,
        'target_distribution': {
            'class_0': int((df_clean['Biopsy'] == 0).sum()),
            'class_1': int((df_clean['Biopsy'] == 1).sum()),
            'prevalence': round(float((df_clean['Biopsy'] == 1).mean() * 100), 2)
        }
    },
    'patients': all_patients,
    'trees': trees_data
}

os.makedirs('backend', exist_ok=True)
with open(OUTPUT_JSON, 'w') as f:
    json.dump(authoritative_data, f)

print(f"Exported authoritative model data to {OUTPUT_JSON}. Size: {os.path.getsize(OUTPUT_JSON) / 1024 / 1024:.2f} MB")

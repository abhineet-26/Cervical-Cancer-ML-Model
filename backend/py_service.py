import os
import json
import joblib
import pandas as pd
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_curve, precision_recall_curve, auc

CSV_PATH = 'risk_factors_cervical_cancer.csv'
BUNDLE_PATH = 'cervical_rf_bundle.joblib'

print("Loading dataset and model bundle...")
bundle = joblib.load(BUNDLE_PATH)
pipeline = bundle['pipeline']
threshold = float(bundle['threshold'])
feature_names = bundle['feature_names']

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
rf = pipeline.named_steps['rf']
vt = pipeline.named_steps['vt']
selected_cols = [feature_names[i] for i, mask in enumerate(vt.get_support()) if mask]
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
    # raw values for display
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
    record['model_prob'] = round(float(all_probs[i]), 4)
    record['model_risk_score'] = round(float(all_probs[i] * 100), 2)
    record['model_pred'] = int(all_preds[i])
    record['model_risk_level'] = "High" if all_probs[i] > 0.60 else ("Medium" if all_probs[i] >= 0.30 else "Low")
    all_patients.append(record)

print(f"Precomputed {len(all_patients)} patients. Ready on port 5001.")

class MLServerHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == '/api/stats':
            stats = {
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
                    'accuracy': accuracy,
                    'precision': precision,
                    'recall': recall,
                    'f1_score': f1_score,
                    'specificity': specificity,
                    'roc_auc': roc_auc,
                    'pr_auc': pr_auc
                }
            }
            self._send_json(stats)

        elif path == '/api/model-performance':
            # Threshold sweep as reported in notebook
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

            perf = {
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
            }
            self._send_json(perf)

        elif path == '/api/insights':
            insights = {
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
            }
            self._send_json(insights)

        elif path == '/api/patients':
            page = int(query.get('page', ['1'])[0])
            page_size = int(query.get('page_size', ['25'])[0])
            search = query.get('search', [''])[0].strip().lower()
            filter_biopsy = query.get('biopsy', ['all'])[0]
            filter_risk = query.get('risk', ['all'])[0]

            filtered = all_patients
            if search:
                filtered = [
                    p for p in filtered
                    if str(p['id']) == search or str(p.get('Age', '')) == search
                ]
            if filter_biopsy != 'all':
                b_val = int(filter_biopsy)
                filtered = [p for p in filtered if p.get('Biopsy') == b_val]
            if filter_risk != 'all':
                filtered = [p for p in filtered if p['model_risk_level'].lower() == filter_risk.lower()]

            total_filtered = len(filtered)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            items = filtered[start_idx:end_idx]

            self._send_json({
                'total': total_filtered,
                'page': page,
                'page_size': page_size,
                'patients': items
            })

        else:
            self._send_json({'error': 'Not found'}, 404)

    def do_POST(self):
        if self.path == '/api/predict':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
            except Exception:
                self._send_json({'error': 'Invalid JSON in request body'}, 400)
                return

            # Construct input row matching feature_names
            row = {}
            for col in feature_names:
                val = data.get(col, None)
                if val is None or val == '' or str(val).strip() == '?':
                    row[col] = np.nan
                else:
                    try:
                        row[col] = float(val)
                    except ValueError:
                        self._send_json({'error': f"Invalid numeric value for field '{col}': {val}"}, 400)
                        return

            # Validate reasonable limits if provided
            age_val = row.get('Age', np.nan)
            if not np.isnan(age_val) and (age_val < 10 or age_val > 105):
                self._send_json({'error': 'Age must be between 10 and 105'}, 400)
                return

            partners_val = row.get('Number of sexual partners', np.nan)
            if not np.isnan(partners_val) and (partners_val < 0 or partners_val > 50):
                self._send_json({'error': 'Number of sexual partners cannot be negative or above 50'}, 400)
                return

            coitus_val = row.get('First sexual intercourse', np.nan)
            if not np.isnan(coitus_val) and not np.isnan(age_val) and coitus_val > age_val:
                self._send_json({'error': f'First sexual intercourse age ({coitus_val}) cannot exceed patient age ({age_val})'}, 400)
                return

            df_input = pd.DataFrame([row])[feature_names]

            try:
                prob = float(pipeline.predict_proba(df_input)[0][1])
                pred = int(prob > threshold)
            except Exception as e:
                self._send_json({'error': f'Model inference error: {str(e)}'}, 500)
                return

            risk_level = "High" if prob > 0.60 else ("Medium" if prob >= 0.30 else "Low")

            # Determine key feature values present in this input for clinical context
            top_factors = []
            for item in feature_importances[:7]:
                col_name = item['name']
                raw_val = row.get(col_name, np.nan)
                if not np.isnan(raw_val) and raw_val > 0:
                    top_factors.append({
                        'feature': col_name,
                        'value': raw_val,
                        'importance': item['importance']
                    })

            response_data = {
                'probability': round(prob, 4),
                'risk_score': round(prob * 100, 2),
                'prediction': pred,
                'risk_level': risk_level,
                'threshold': threshold,
                'model_name': 'Random Forest Classifier (300 estimators, SMOTE-balanced training split)',
                'key_patient_factors': top_factors,
                'disclaimer': 'This application is a machine-learning research and educational tool based on a historical cervical cancer risk-factor dataset. Model outputs are not a medical diagnosis and should not replace professional clinical evaluation, screening, or treatment decisions.'
            }
            self._send_json(response_data)
        else:
            self._send_json({'error': 'Not found'}, 404)

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', 5001), MLServerHandler)
    server.serve_forever()

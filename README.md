# CerviScan AI 🩺

### Machine Learning–Powered Cervical Cancer Risk Analysis & Clinical Research Platform

<p align="center">
  <strong>An interactive research and educational platform for analyzing cervical cancer risk factors using a trained Random Forest model.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Random%20Forest-300%20Trees-2E8B57?style=for-the-badge" alt="Random Forest"/>
  <img src="https://img.shields.io/badge/License-Research%20%26%20Educational-lightgrey?style=for-the-badge" alt="Research"/>
</p>

---

## 📌 Overview

**CerviScan AI** is a machine-learning research and educational application designed to explore cervical cancer risk factors and biopsy outcomes through an interactive analytical interface.

The platform combines:

- 🧠 A **300-tree Random Forest classifier**
- 📊 Statistical and exploratory data analysis
- 🔬 Clinical screening and risk-factor analysis
- 🎯 Patient-level risk prediction
- 📈 Model performance evaluation
- 🔎 Feature-importance and correlation analysis
- 👩‍⚕️ Interactive patient cohort exploration
- ⚙️ REST API endpoints for model inference and analytics

The application is built around a historical dataset containing **858 patient records** and uses **Biopsy** as the target variable.

> **Important:** This project is intended for research and educational purposes. Model predictions are **not medical diagnoses** and must not be used as a substitute for professional medical evaluation, screening, or treatment decisions.

---

## ✨ Key Features

### 🧠 Machine Learning Prediction

The platform uses a trained **Random Forest Classifier with 300 estimators** to estimate the probability of a positive biopsy outcome.

The model uses a decision threshold of **0.30** rather than the conventional 0.50 threshold to prioritize sensitivity in the screening-oriented evaluation.

```text
Probability < 0.30     → Low Risk
0.30 ≤ Probability ≤ 0.60 → Medium Risk
Probability > 0.60     → High Risk
```

---

### 👩‍⚕️ Patient Risk Assessment

Users can enter patient risk-factor information and receive:

- Predicted probability
- Risk score
- Risk classification
- Model prediction
- Key contributing factors

The prediction pipeline also performs basic input validation before inference.

---

### 📊 Interactive Dashboard

The dashboard provides an overview of the underlying cohort, including:

- Total patient records
- Positive and negative biopsy counts
- Positive-biopsy prevalence
- Demographic statistics
- Model performance
- Risk-factor distributions
- Patient-level model predictions

---

### 🔎 Cohort Explorer

The application provides an interactive view of the **858-patient cohort**.

Users can:

- Search patient records
- Filter biopsy outcomes
- Inspect risk predictions
- Review model probabilities
- Load a patient's features into the prediction interface
- Navigate through paginated records

---

### 📈 Model Performance Analysis

The platform exposes detailed model evaluation metrics including:

- Accuracy
- Precision
- Recall / Sensitivity
- F1 Score
- Specificity
- ROC-AUC
- PR-AUC
- Confusion Matrix
- ROC Curve
- Precision-Recall Curve
- Decision-threshold analysis

---

### 🧬 Explainability & Dataset Insights

The Insights section provides analytical views of:

- Random Forest feature importance
- Pearson correlations with biopsy outcome
- Missing-value distribution
- Class-wise feature means
- Zero-variance feature removal
- Target-class distribution

The most influential model features include:

| Feature | Relative Importance |
|---|---:|
| Schiller | 40.36% |
| Hinselmann | 16.84% |
| Citology | 8.79% |
| STDs | 3.13% |
| Dx | 2.94% |

These values describe model-level feature importance and should **not** be interpreted as independent clinical causation.

---

# 🧪 Dataset

The project uses the **Cervical Cancer Risk Factors** dataset containing:

- **858 patient records**
- **33 model input features**
- **1 target variable — `Biopsy`**

### Target Distribution

| Biopsy | Meaning | Records | Percentage |
|---|---|---:|---:|
| `0` | Negative | 803 | 93.59% |
| `1` | Positive | 55 | 6.41% |

The dataset contains demographic, behavioral, reproductive, STD-related, diagnostic, and screening variables.

### Major Feature Categories

- Age
- Number of sexual partners
- Age at first sexual intercourse
- Number of pregnancies
- Smoking history
- Hormonal contraceptive usage
- IUD usage
- STD history
- HPV-related variables
- Previous diagnoses
- Hinselmann examination
- Schiller test
- Cytology

---

# 🧠 Machine Learning Pipeline

The implemented model follows this general pipeline:

```text
Raw Clinical Dataset
        │
        ▼
Missing-Value Handling
        │
        ▼
Remove High-Missing Features
        │
        ▼
Train / Test Split
        │
        ├───────────────┐
        ▼               ▼
Training Set        Test Set
        │               │
        ▼               │
Median Imputation      │
        │               │
        ▼               │
Variance Filtering     │
        │               │
        ▼               │
SMOTE Balancing        │
        │               │
        ▼               │
Random Forest          │
300 Estimators         │
        │               │
        └───────┬───────┘
                ▼
        Probability Output
                │
                ▼
        Threshold = 0.30
                │
                ▼
        Risk Classification
```

### Preprocessing

The training pipeline includes:

1. Replacement of missing values
2. Removal of highly sparse features
3. Median imputation
4. Zero-variance feature filtering
5. Stratified train/test splitting
6. SMOTE-based class balancing on the training set
7. Random Forest classification

Two highly sparse variables are removed during preprocessing:

```text
STDs: Time since first diagnosis
STDs: Time since last diagnosis
```

---

# 📊 Model Configuration

| Parameter | Value |
|---|---|
| Algorithm | Random Forest Classifier |
| Number of Trees | 300 |
| Max Depth | None |
| Min Samples Leaf | 1 |
| Random State | 200 |
| Training Split | 80% |
| Test Split | 20% |
| Test Samples | 172 |
| Class Balancing | SMOTE |
| Decision Threshold | 0.30 |

### Training Class Balance

Before SMOTE:

```text
Class 0 → 642
Class 1 → 44
```

After SMOTE:

```text
Class 0 → 642
Class 1 → 642
```

SMOTE is applied **only to the training set**. The test set remains untouched for evaluation.

---

# 📈 Model Performance

The current evaluation reports:

| Metric | Score |
|---|---:|
| Accuracy | **96.5%** |
| Precision | **69.2%** |
| Recall / Sensitivity | **81.8%** |
| F1 Score | **75.0%** |
| Specificity | **97.5%** |
| ROC-AUC | **90.1%** |
| PR-AUC | **64.8%** |

### Confusion Matrix

On the 172-record test set:

| | Predicted Negative | Predicted Positive |
|---|---:|---:|
| **Actual Negative** | 157 | 4 |
| **Actual Positive** | 2 | 9 |

The threshold of **0.30** was selected to improve sensitivity compared with a conventional 0.50 classification threshold.

> These metrics are specific to the dataset and experimental setup used in this project. They should not be interpreted as evidence of clinical effectiveness or real-world diagnostic accuracy.

---

# 🏗️ Architecture

CerviScan AI uses a full-stack TypeScript architecture with a React frontend and Express-based backend.

```text
┌──────────────────────────────────────────┐
│              React Frontend              │
│                                          │
│  Dashboard                               │
│  Prediction                              │
│  Performance                             │
│  Insights                                │
│  About / Methodology                     │
└───────────────────┬──────────────────────┘
                    │
                    │ REST API
                    ▼
┌──────────────────────────────────────────┐
│             Express Server               │
│                                          │
│  /api/health                             │
│  /api/stats                              │
│  /api/model-performance                  │
│  /api/insights                           │
│  /api/patients                           │
│  /api/predict                            │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│       Authoritative ML Engine             │
│                                          │
│  Model Metadata                           │
│  Patient Dataset                          │
│  Model Inference                          │
│  Statistical Analysis                     │
│  Risk Classification                      │
└──────────────────────────────────────────┘
```

The repository also contains a Python model service for loading and evaluating the serialized model bundle using `joblib` and `scikit-learn`.

---

# 🗂️ Project Structure

```text
Cervical-Cancer-ML-Model/
│
├── backend/
│   ├── data/
│   │   ├── cervical_cancer_data.csv
│   │   └── risk_factors_cervical_cancer.csv
│   │
│   ├── authoritative_engine.ts
│   ├── authoritative_model_data.json
│   ├── cervical_rf_bundle.joblib
│   ├── export_exact_model.py
│   ├── generate_data.ts
│   ├── ml_engine.ts
│   ├── model_metadata.json
│   └── py_service.py
│
├── src/
│   ├── components/
│   │   ├── AboutView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── Header.tsx
│   │   ├── InsightsView.tsx
│

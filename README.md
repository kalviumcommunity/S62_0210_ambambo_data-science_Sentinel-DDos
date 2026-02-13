# SentinelDDoS

Hybrid Machine Learning–based DDoS detection system combining supervised classification, anomaly detection, and a decision fusion engine with an interactive dashboard.

---

## Overview

SentinelDDoS detects both known and unknown DDoS attacks by combining:

- Supervised model (RandomForest / XGBoost)
- Unsupervised anomaly detection (Isolation Forest)
- Decision fusion engine for final classification
- Streamlit dashboard for visualization

Primary dataset: **CICDDoS2019**  
Optional: Custom attack traffic (SYN, UDP, HTTP floods)

---

## Tech Stack

- Python 3.10+
- pandas, numpy
- scikit-learn, xgboost
- scipy, matplotlib, seaborn
- streamlit
- joblib
- pyshark (optional)

## Phase 1 — Dataset & Log Collection

**Primary Dataset**

- CICDDoS2019
- 80+ DDoS attack types
- TCP, UDP, HTTP floods
- Application-layer attacks
- Labeled normal traffic
- Use 10–20% sample for local training

**Optional: Custom Log Generation**

- SYN flood (hping3)
- UDP flood
- HTTP flood (Slowloris / GoldenEye)
- Capture via Wireshark / tcpdump / server logs

## Phase 2 — Data Cleaning & Preprocessing

Notebook: `notebooks/01_data_preprocessing.ipynb`

Tasks:

- Load and merge CSVs
- Handle missing values
- Convert timestamps
- Drop irrelevant columns
- Rename features
- Filter selected attack types (optional)

## Phase 3 — Feature Engineering

Core feature logic implemented in:

- `src/feature_extraction.py`
- `notebooks/02_feature_engineering.ipynb`

Engineered Features:

- Packets per second (PPS)
- Bytes per second (BPS)
- SYN/ACK ratio
- Flow duration
- IP/Port entropy
- Inter-arrival times
- Packet size variance
- Burstiness
- Unique IP count
- Time-window aggregated statistics

## Phase 4 — Machine Learning Models

### 4A — Supervised Model (Known Attacks)

File: `src/train_supervised.py`

- RandomForest or XGBoost
- Metrics: Accuracy, Precision, Recall, F1, Confusion Matrix

### 4B — Unsupervised Model (Anomaly Detection)

File: `src/train_unsupervised.py`

- Isolation Forest (primary)
- LOF (optional)
- Autoencoder (advanced)

Evaluation:

- Anomaly scores
- ROC curves
- Threshold tuning

## Phase 5 — Decision Fusion Engine

File: `src/fusion_engine.py`

Combines:

- Supervised prediction
- Confidence score
- Anomaly score
- Traffic intensity metrics

Final outputs:

- UDP Flood
- Slowloris
- Unknown Suspicious Traffic
- Low Confidence Attack
- Normal

Hybrid ML improves robustness against unseen attacks.

## Phase 6 — Dashboard & Final Deployment

File: `dashboard/app.py`  
Built using Streamlit.

Features:

- Live predictions
- Entropy, PPS, burstiness metrics
- Packet rate graphs
- Anomaly score timeline
- Traffic heatmaps
- Attack classification
- PCAP/log upload support

Run:
streamlit run dashboard/app.py

## Final Outcome

SentinelDDoS provides:

- Real-time DDoS detection
- Hybrid ML-based classification
- Unknown attack identification
- Interactive security analytics dashboard

---

# Understanding the Data Science Lifecycle: Question → Data → Insight

## 1️⃣ The Lifecycle Explained

In data science, work does not begin with models or algorithms. It begins with a clear question. The lifecycle follows:

### Question → Data → Insight

Each stage builds on the previous one. If the question is unclear, the data collected will be misaligned. If the data is misunderstood, the insights will be misleading. The strength of a data science project depends on how well these three steps connect.

### 🟢 Step 1: Starting with a Clear Question

A data science project must begin with a precise and meaningful question.

In the context of DDoS prevention, the question is not simply:

“Can we build a model?”

Instead, it is:

“How can we detect malicious traffic early enough to prevent a Distributed Denial-of-Service (DDoS) attack from overwhelming the system?”

This step is critical because:

It defines what success looks like.

It determines what type of data is relevant.

It prevents building models that solve the wrong problem.

It ensures we focus on real-world impact (e.g., reducing downtime, minimizing false positives).

Without a clear question, we might end up predicting traffic volume instead of identifying attack behavior. That would produce numbers, but not meaningful protection.

### 🟢 Step 2: Data as Evidence

Once the question is defined, we identify the data that represents the problem.

For DDoS detection, relevant data may include:

IP addresses

Packet rate (requests per second)

Connection duration

Protocol type (TCP/UDP/ICMP)

Flag indicators (e.g., SYN flags)

Time between requests

Traffic volume per time window

Labels indicating attack vs normal traffic

Data acts as evidence. It represents real behavior of users and attackers.

Understanding the data means:

Knowing what each column represents.

Identifying whether the data is labeled or unlabeled.

Checking for class imbalance (attacks are rare compared to normal traffic).

Understanding time-based patterns in traffic.

Identifying noise or anomalies unrelated to attacks.

If we do not understand the data, we risk misclassifying high legitimate traffic (e.g., during sales or peak hours) as an attack.

### 🟢 Step 3: Insight Through Exploration

Insight does not come from accuracy scores alone. It emerges from exploration and interpretation.

In this project, meaningful insights could include:

Which traffic features are strongest indicators of DDoS behavior.

How early attack patterns can be detected.

What thresholds reduce false positives.

Whether attack traffic shows sudden bursts in packet rate.

How detection time impacts server stability.

For example, an insight might be:

“A sudden spike in SYN requests within a 5-second window strongly correlates with DDoS attempts.”

That insight can guide real decisions, such as rate-limiting strategies or automated blocking rules.

Insight connects directly back to the original question. It enables action.

## 2️⃣ Applying the Lifecycle to the DDoS Prevention Project

### 📌 Project Context: Machine Learning-Based DDoS Detection System

### 🎯 The Question

How can we detect abnormal network traffic patterns in real time to prevent Distributed Denial-of-Service attacks before they overload the system?

This question focuses on early detection and practical prevention rather than just classification.

### 📊 The Data Needed

To answer this question, we would require:

Network traffic logs from servers or firewalls

Packet-level metadata

Time-based traffic statistics

Labeled datasets containing both normal and attack traffic

Public cybersecurity datasets (e.g., benchmark DDoS datasets)

This data represents real network behavior and helps distinguish normal user activity from malicious traffic bursts.

## 💡 The Insight for Decision-Making

The goal is not just to build a model, but to generate insights that support security decisions, such as:

Identifying key features that signal attack patterns

Determining detection thresholds for rate limiting

Measuring how quickly attacks can be detected

Reducing false positives to avoid blocking legitimate users

Understanding which attack types are most frequent

For example:

If traffic from a single IP exceeds a defined request threshold within a short time window, it may indicate a DDoS attempt and trigger automated mitigation.

This insight supports proactive defense strategies and improves system reliability.

## 3️⃣ Scenario-Based Reasoning: When There Is No Clear Problem Statement

If we are given a dataset with dozens of columns but no defined problem statement, immediately building visualizations or models is risky.

Without a guiding question:

We may find patterns that are statistically interesting but practically meaningless.

We risk optimizing for the wrong metric.

We may misinterpret correlations as causation.

We could waste time building models that do not solve a real problem.

Using the Question → Data → Insight framework, I would first:

Clarify the objective — What are we trying to predict or detect?

Define success — What metric matters (accuracy, recall, false positive rate)?

Understand domain context — What does each column represent?

Identify constraints — What is the cost of false predictions?

Only after defining the question would I explore and model the data.

Data science is not about “seeing what comes out.”
It is about asking the right question and using data to produce actionable insights.

# 🖥 Environment Setup
## 1️⃣ Operating System
### Input: 
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

### Output: 
OS Name: Microsoft Windows 11 Home

OS Version: 10.0.26200 N/A Build 26200

## 2️⃣ Python Version
python --version => Python 3.13.9

## 3️⃣ Anaconda Version
conda --version => conda 25.11.0

## 4️⃣ Conda Environment Details

conda info

### Key Information:

1. Active Environment: base
2. Environment Location: C:\Users\isaac\anaconda3
3. Python Version: 3.13.9
4. Conda Version: 25.11.0
5. Platform: win-64
6. Solver: libmamba (default)

## 5️⃣ Setup Steps Followed

1. Installed Anaconda Distribution for Windows.
2. Opened Anaconda Prompt as Administrator.
3. Verified Python installation using:
python --version
4. Verified Conda installation using:
conda --version
5. Checked environment configuration using:
conda info
6. Verified operating system details using:
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

## Jupyter Setup
### 3️⃣ Conda Environment Activation

Command:

conda activate ds_env
conda info --envs

Output:

ds_env    *    C:\Users\isaac\miniconda3\envs\ds_env

### 4️⃣ Jupyter Launch Verification

Command:

jupyter notebook

Result:

Jupyter successfully launched at:

http://localhost:8888/tree

### 5️⃣ Python Execution Inside Jupyter

Notebook Cell:

import sys
print(sys.version)

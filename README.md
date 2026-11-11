# Data Analytics Internship Projects – Cognetix Technology

## Overview

This repository contains projects completed as part of a Data Analytics Internship at Cognetix Technology. The projects are divided into Foundational, Intermediate, and Advanced stages.

## Tools & Technologies

- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn
- Plotly
- Jupyter Notebook

## Project Stages

### Foundational

- Sales Data Analysis
- Student Performance Analysis
- COVID-19 Data Analysis

### Intermediate

- E-Commerce Dataset Analysis
- Bank Customer Churn Analysis
- Interactive Sales Dashboard

### Advanced

- Retail Sales Forecasting Using Time Series Analysis
- Customer Segmentation Using K-Means Clustering
- Sentiment Analysis of Customer Reviews Using Natural Language Processing

## Outcome

These projects demonstrate practical data handling, exploratory data analysis, data visualization, and business insight generation skills.

## Data Fieldnotes casebook

The `site/` folder contains a static, recruiter-facing index of the nine notebooks. It shows each notebook's question, declared tools, and bundled input size, with links to the original notebook.

The casebook does not execute notebook code or repeat notebook conclusions. Small datasets are flagged for exploration only. The sentiment CSV was normalized to its one-column `Review` schema without changing review text or row count; saved notebook outputs have not been rerun. Raw CSVs and notebooks stay outside the public `site/` output; only casebook metadata is generated there.

Regenerate the catalogue and serve it locally:

```powershell
python scripts/build_casebook.py
python -m http.server 8000 --directory site
```

Open `http://localhost:8000`. A static host should use `site/` as its document root.

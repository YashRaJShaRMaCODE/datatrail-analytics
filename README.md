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

**Live casebook:** https://data-fieldnotes.vercel.app/

The `site/` folder contains a static, recruiter-facing index of the nine notebooks. It shows each notebook's question, declared tools, and bundled input size, with links to the original notebook. Search and filter by track, tool, or data note; sort by title or input size. Save a local reading list, then download or restore its JSON backup on another browser.

The casebook does not execute notebook code or repeat notebook conclusions. Small datasets are flagged for exploration only. The sentiment CSV was normalized to its one-column `Review` schema without changing review text or row count; saved notebook outputs have not been rerun. Raw CSVs and notebooks stay outside the public `site/` output; only casebook metadata is generated there.

Reading-list backups contain only case slugs. Restoring merges recognized slugs into the browser's current list; unknown entries are ignored. Nothing is uploaded.

Regenerate the catalogue and serve it locally:

```powershell
python scripts/build_casebook.py
python -m http.server 8000 --directory site
```

Open `http://localhost:8000`. A static host should use `site/` as its document root.

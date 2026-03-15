# REint-Ai

## Overview

This repository contains a **Wind Power Forecast Monitoring application** and an accompanying **Jupyter notebook** for analyzing forecast accuracy.

### What is included

- `forecast-monitoring/` – A Next.js based web application that displays actual vs forecasted UK wind generation (Jan 2024 range) and lets you adjust the forecast horizon.
- `analysis/` – A Jupyter notebook that loads the same data and performs statistical analysis on forecast errors.

## Getting started

### 1) Clone the repository

```bash
git clone <repo-url>
cd REint
```

### 2) Obtain a BMRS API key

The application relies on the BMRS (Elexon) API. Create an account and obtain an API key:
https://bmrs.elexon.co.uk/

### 3) Run the web app

```bash
cd forecast-monitoring
npm install
npm run dev
```

The application will work out of the box with a small sample dataset. To fetch real BMRS data, create `.env.local` from `.env.example` and set your `BMRS_API_KEY`.

Open http://localhost:3000

### 4) Run the analysis notebook

```bash
cd analysis
pip install -r requirements.txt
jupyter lab
```

## Notes

- The app uses the latest forecast available at least *horizon* hours before each target time.
- The notebook includes analysis of forecast error distribution and a high-level recommendation for reliable wind capacity.

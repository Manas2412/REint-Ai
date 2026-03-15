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

### 3) Run the web app (Local)

```bash
cd forecast-monitoring
npm install
npm run dev
```

The application fetches real BMRS data using the API key. Ensure `.env` contains your `BMRS_API_KEY` (see .env.example for format). The app requires a valid API key to function - no sample data fallbacks.

Open http://localhost:3000

### 4) Run the web app (Docker)

If you prefer to run the application using Docker, ensure you have Docker and Docker Compose installed:

```bash
# Add your API key to the .env file
cp forecast-monitoring/.env.example forecast-monitoring/.env

# Start the application using Docker Compose
docker compose up --build -d
```

The application will be accessible at http://localhost:3000. To stop the containers, run `docker compose down`.

### 5) Run the analysis notebook

```bash
cd analysis
pip install -r requirements.txt
jupyter lab
```

## Architecture

- **Frontend**: Next.js 14 with React, TypeScript, and Recharts for visualization
- **APIs**: BMRS stream endpoints for fast JSON data retrieval
- **Data**: FUELHH for actual wind generation, WINDFOR for forecasts
- **Deployment**: Docker Compose for containerized deployment

## Features

- Interactive chart comparing actual vs forecast wind generation
- Adjustable forecast horizon (0-48 hours)
- Reliable capacity estimates based on historical percentiles
- Fast API responses using optimized BMRS streams
- Graceful fallbacks to sample data on API failures

## Notes

- The app uses the latest forecast available at least *horizon* hours before each target time.
- The notebook includes analysis of forecast error distribution and a high-level recommendation for reliable wind capacity.

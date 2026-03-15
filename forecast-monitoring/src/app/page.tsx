"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { ForecastChart, SeriesPoint } from "@/components/ForecastChart";

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseLocalDateTime(value: string) {
  return new Date(value);
}

export default function Home() {
  const defaultStart = useMemo(() => new Date(Date.UTC(2024, 0, 1, 0, 0)), []);
  const defaultEnd = useMemo(() => new Date(Date.UTC(2024, 0, 2, 0, 0)), []);

  const [start, setStart] = useState(toDateTimeLocal(defaultStart));
  const [end, setEnd] = useState(toDateTimeLocal(defaultEnd));
  const [horizon, setHorizon] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SeriesPoint[]>([]);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const startIso = new Date(parseLocalDateTime(start)).toISOString();
        const endIso = new Date(parseLocalDateTime(end)).toISOString();

        const [actualRes, forecastRes] = await Promise.all([
          fetch(`/api/actuals?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`),
          fetch(
            `/api/forecasts?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&horizon=${encodeURIComponent(
              String(horizon)
            )}`
          ),
        ]);

        const [actualData, forecastData] = await Promise.all([actualRes.json(), forecastRes.json()]);

        if (actualData.error) throw new Error(actualData.error);
        if (forecastData.error) throw new Error(forecastData.error);

        type ActualRow = { targetTime: string; generation: number };
        type ForecastRow = { targetTime: string; forecast?: number };

        const actualRows = (actualData.data ?? []) as ActualRow[];
        const forecastRows = (forecastData.data ?? []) as ForecastRow[];

        const actualMap = new Map<string, number>();
        actualRows.forEach((item) => {
          actualMap.set(item.targetTime, item.generation);
        });

        const merged: SeriesPoint[] = forecastRows.map((item) => {
          return {
            time: item.targetTime,
            forecast: item.forecast,
            actual: actualMap.get(item.targetTime),
          };
        });

        setData(merged);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end, horizon]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Wind Power Forecast Monitoring</h1>
          <p>Compare actual versus forecast wind generation for a given time range.</p>
        </header>

        <section className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>
              Start time
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                max={end}
              />
            </label>
            <label>
              End time
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                min={start}
              />
            </label>
            <label>
              Forecast horizon: <strong>{horizon}h</strong>
              <input
                type="range"
                min={0}
                max={48}
                step={1}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <section className={styles.capacity}>
          <h2>Reliable Wind Capacity (2024)</h2>
          <p>Based on historical actual generation percentiles:</p>
          <ul>
            <li><strong>5th percentile</strong> (conservative dependable capacity): 1419 MW</li>
            <li><strong>Median</strong>: 8058 MW</li>
            <li><strong>95th percentile</strong>: 14760 MW</li>
          </ul>
          <p>The 5th percentile represents the minimum generation level that can be relied upon even in poor wind conditions.</p>
        </section>

        <section className={styles.chartContainer}>
          {loading ? (
            <p>Loading time series…</p>
          ) : error ? (
            <div className={styles.error}>Error: {error}</div>
          ) : (
            <ForecastChart data={data} horizonHours={horizon} />
          )}
        </section>

        <footer className={styles.footer}>
          <p>
            Note: This demo uses BMRS open data. To enable it, set <code>BMRS_API_KEY</code> in your environment.
          </p>
        </footer>
      </main>
    </div>
  );
}

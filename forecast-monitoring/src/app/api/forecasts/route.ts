import { NextResponse } from "next/server";
import { fetchWindFor } from "@/lib/bmrs";
import { sampleForecasts } from "@/data/sample";

function parseISOParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startRaw = searchParams.get("start");
  const endRaw = searchParams.get("end");
  const horizonRaw = searchParams.get("horizon") ?? "4";

  const start = parseISOParam(startRaw);
  const end = parseISOParam(endRaw);
  const horizonHrs = Number(horizonRaw);
  const apiKey = process.env.BMRS_API_KEY;

  if (!start || !end || Number.isNaN(horizonHrs)) {
    return NextResponse.json({ error: "Missing or invalid query params" }, { status: 400 });
  }

  // If no API key is configured, return sample forecasts limited to the requested range.
  if (!apiKey) {
    const filtered = sampleForecasts.filter((row) => {
      const ts = new Date(row.targetTime);
      return ts >= start && ts <= end;
    });

    const cutoffMs = horizonHrs * 60 * 60 * 1000;
    const targetPoints: Array<{ targetTime: string; forecast?: number }> = [];

    for (let t = start.getTime(); t <= end.getTime(); t += 30 * 60 * 1000) {
      const targetTime = new Date(t);
      const cutoff = new Date(t - cutoffMs);
      const candidates = filtered.filter((row) => {
        return new Date(row.targetTime).getTime() === t && new Date(row.publishTime) <= cutoff;
      });
      if (!candidates.length) {
        targetPoints.push({ targetTime: targetTime.toISOString() });
        continue;
      }
      const latest = candidates.reduce((prev, cur) => {
        return new Date(cur.publishTime) > new Date(prev.publishTime) ? cur : prev;
      });
      targetPoints.push({ targetTime: targetTime.toISOString(), forecast: latest.generation });
    }

    return NextResponse.json({ data: targetPoints });
  }

  try {
    // Fetch a slightly larger range to ensure forecasts are available for the final target times.
    const bufferMs = 48 * 60 * 60 * 1000; // 48 hours
    const fetchStart = new Date(start.getTime() - bufferMs);
    const fetchEnd = new Date(end.getTime() + bufferMs);

    const rows = await fetchWindFor({ apiKey, startDate: fetchStart, endDate: fetchEnd });

    const parsed = rows
      .map((row) => {
        return {
          targetTime: new Date(row.StartTime).toISOString(),
          publishTime: new Date(row.PublishTime).toISOString(),
          generation: Number(row.Generation),
        };
      })
      .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime());

    const targetPoints: Array<{ targetTime: string; forecast?: number }> = [];
    const horizonMs = horizonHrs * 60 * 60 * 1000;

    for (let t = start.getTime(); t <= end.getTime(); t += 30 * 60 * 1000) {
      const targetTime = new Date(t);
      const cutoff = new Date(t - horizonMs);

      // Find latest forecast whose publishTime <= cutoff, for this targetTime.
      const candidates = parsed.filter((row) => {
        return new Date(row.targetTime).getTime() === t && new Date(row.publishTime) <= cutoff;
      });

      if (!candidates.length) {
        targetPoints.push({ targetTime: targetTime.toISOString() });
        continue;
      }

      const latest = candidates.reduce((prev, cur) => {
        return new Date(cur.publishTime) > new Date(prev.publishTime) ? cur : prev;
      });

      targetPoints.push({ targetTime: targetTime.toISOString(), forecast: latest.generation });
    }

    return NextResponse.json({ data: targetPoints });
  } catch (error) {
    // Fallback to sample data on API failure
    const filtered = sampleForecasts.filter((row) => {
      const ts = new Date(row.targetTime);
      return ts >= start && ts <= end;
    });

    const cutoffMs = horizonHrs * 60 * 60 * 1000;
    const targetPoints: Array<{ targetTime: string; forecast?: number }> = [];

    for (let t = start.getTime(); t <= end.getTime(); t += 30 * 60 * 1000) {
      const targetTime = new Date(t);
      const cutoff = new Date(t - cutoffMs);
      const candidates = filtered.filter((row) => {
        return new Date(row.targetTime).getTime() === t && new Date(row.publishTime) <= cutoff;
      });
      if (!candidates.length) {
        targetPoints.push({ targetTime: targetTime.toISOString() });
        continue;
      }
      const latest = candidates.reduce((prev, cur) => {
        return new Date(cur.publishTime) > new Date(prev.publishTime) ? cur : prev;
      });
      targetPoints.push({ targetTime: targetTime.toISOString(), forecast: latest.generation });
    }

    return NextResponse.json({ data: targetPoints });
  }
}

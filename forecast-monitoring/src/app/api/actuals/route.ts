import { NextResponse } from "next/server";
import { fetchFuelHH } from "@/lib/bmrs";
import { sampleActuals } from "@/data/sample";

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

  const start = parseISOParam(startRaw);
  const end = parseISOParam(endRaw);
  const apiKey = process.env.BMRS_API_KEY;

  if (!start || !end) {
    return NextResponse.json({ error: "Missing or invalid start/end query params" }, { status: 400 });
  }

  // If no BMRS API key is configured, return a small sample dataset for demo.
  if (!apiKey) {
    const filtered = sampleActuals.filter((row) => {
      const ts = new Date(row.targetTime);
      return ts >= start && ts <= end;
    });
    return NextResponse.json({ data: filtered });
  }

  try {
    const rows = await fetchFuelHH({ apiKey, startDate: start, endDate: end });

    // Filter for wind fuel types (case-insensitive)
    const wind = rows
      .filter((row) => row.FuelType?.toLowerCase() === "wind")
      .map((row) => {
        const [day, month, year] = row.SettlementDate.split("/");
        const settlementDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
        const period = Number(row.SettlementPeriod);

        // Settlement periods are 30 min, period 1 = 00:00-00:30
        const targetTime = new Date(settlementDate.getTime() + (period - 1) * 30 * 60 * 1000);

        return {
          targetTime: targetTime.toISOString(),
          generation: Number(row.Generation),
        };
      })
      .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime());

    return NextResponse.json({ data: wind });
  } catch (error) {
    // Fallback to sample data on API failure
    const filtered = sampleActuals.filter((row) => {
      const ts = new Date(row.targetTime);
      return ts >= start && ts <= end;
    });
    return NextResponse.json({ data: filtered });
  }
}

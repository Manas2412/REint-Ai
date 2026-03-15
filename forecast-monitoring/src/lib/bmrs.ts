import Papa from "papaparse";

const BMRS_BASE = "https://api.bmreports.com/BMRS";

export type FuelHHRow = {
  SettlementDate: string; // DD/MM/YYYY
  SettlementPeriod: string;
  FuelType: string;
  FuelTypeDescription: string;
  Generation: string;
  TransmissionLossFactor: string;
  FuelInput: string;
  FuelInputFromFuelSupply: string;
  FuelInputFromReserve: string;
  FuelInputFromInterconnector: string;
};

export type WindForRow = {
  StartTime: string;
  PublishTime: string;
  Generation: string;
  ForecastType: string;
  ForecastOrigin: string;
};

function parseCsv<T>(csvText: string): T[] {
  const { data, errors } = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length) {
    // ignore missing fields errors
    const critical = errors.filter((e: Papa.ParseError) => e.code !== "TooFewFields");
    if (critical.length) {
      throw new Error(`CSV parse error: ${critical.map((e: Papa.ParseError) => e.message).join(", ")}`);
    }
  }

  return data as T[];
}

function formatDateForBmrs(date: Date): string {
  // BMRS API expects dd-MMM-yy or dd-MMM-yyyy; use dd-MMM-yyyy
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export async function fetchFuelHH({
  apiKey,
  startDate,
  endDate,
}: {
  apiKey: string;
  startDate: Date;
  endDate: Date;
}) {
  const url = new URL(`${BMRS_BASE}/FUELHH/Data`);
  url.searchParams.set("APIKey", apiKey);
  url.searchParams.set("ServiceType", "csv");
  url.searchParams.set("StartDate", formatDateForBmrs(startDate));
  url.searchParams.set("EndDate", formatDateForBmrs(endDate));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`BMRS FUELHH request failed (${res.status}): ${await res.text()}`);
  }
  const text = await res.text();
  const rows = parseCsv<FuelHHRow>(text);
  return rows;
}

export async function fetchWindFor({
  apiKey,
  startDate,
  endDate,
}: {
  apiKey: string;
  startDate: Date;
  endDate: Date;
}) {
  const url = new URL(`${BMRS_BASE}/WINDFOR/Data`);
  url.searchParams.set("APIKey", apiKey);
  url.searchParams.set("ServiceType", "csv");
  url.searchParams.set("StartDate", formatDateForBmrs(startDate));
  url.searchParams.set("EndDate", formatDateForBmrs(endDate));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`BMRS WINDFOR request failed (${res.status}): ${await res.text()}`);
  }
  const text = await res.text();
  const rows = parseCsv<WindForRow>(text);
  return rows;
}

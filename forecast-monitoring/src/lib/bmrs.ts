
import Papa from "papaparse";

const BMRS_BASE = "https://api.bmreports.com/BMRS";

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

export type FuelHHRow = {
  SettlementDate: string; // YYYY-MM-DD
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



/**
 * Fetches FUELHH (fuel type generation) data from BMRS using the optimized stream API.
 * Filters for WIND fuel type and date range.
 * @param apiKey - BMRS API key
 * @param startDate - Start date for data
 * @param endDate - End date for data
 * @returns Array of FuelHHRow objects
 */
export async function fetchFuelHH({
  apiKey,
  startDate,
  endDate,
}: {
  apiKey: string;
  startDate: Date;
  endDate: Date;
}) {
  // Use download URL for faster access
  const url = `https://downloads.elexonportal.co.uk/file/download/LATESTFUELHHFILE?key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`BMRS FUELHH download failed (${res.status}): ${await res.text()}`);
  }
  const text = await res.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    const critical = parsed.errors.filter((e: Papa.ParseError) => e.code !== "TooFewFields");
    if (critical.length) {
      throw new Error(`CSV parse error: ${critical.map((e: Papa.ParseError) => e.message).join(", ")}`);
    }
  }

  // Melt the data: original has Settlement Date, Settlement Period, and fuel columns
  const rows: FuelHHRow[] = [];
  const firstRow = parsed.data[0] as Record<string, unknown>;
  const fuelColumns = Object.keys(firstRow).filter(key => key !== '#Settlement Date' && key !== 'Settlement Period');

  for (const row of parsed.data as Record<string, unknown>[]) {
    const settlementDate = row['#Settlement Date'] as string;
    const settlementPeriod = row['Settlement Period'] as string;
    for (const fuelType of fuelColumns) {
      const generation = row[fuelType];
      if (generation !== undefined && generation !== '') {
        rows.push({
          SettlementDate: settlementDate,
          SettlementPeriod: settlementPeriod,
          FuelType: fuelType,
          FuelTypeDescription: fuelType,
          Generation: String(generation),
          TransmissionLossFactor: '0',
          FuelInput: '0',
          FuelInputFromFuelSupply: '0',
          FuelInputFromReserve: '0',
          FuelInputFromInterconnector: '0',
        });
      }
    }
  }

  console.log("FUELHH melted rows length:", rows.length);
  if (rows.length > 0) {
    console.log("First melted row:", rows[0]);
  }

  // Filter by date range (SettlementDate is YYYY-MM-DD)
  const filtered = rows.filter((row) => {
    if (!row.SettlementDate) return false;
    const rowDate = new Date(row.SettlementDate + 'T00:00:00Z');
    return rowDate >= startDate && rowDate <= endDate;
  });

  console.log("Filtered FUELHH rows:", filtered.length);

  console.log("Filtered rows:", filtered.length);

  return filtered;
}

/**
 * Fetches WINDFOR (wind generation forecast) data from BMRS using the API.
 * @param apiKey - BMRS API key
 * @param startDate - Start date for publish times
 * @param endDate - End date for publish times
 * @returns Array of WindForRow objects
 */
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

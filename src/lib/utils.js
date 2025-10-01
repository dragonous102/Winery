import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Papa from "papaparse";

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 

// Simple, robust CSV parser returning array of objects.
// Handles quoted fields, commas inside quotes, and trims headers.
export function parseCSV(text, { delimiter = ',', skipEmptyLines = true } = {}) {
  if (!text) return [];

  // Normalize newlines
  const rows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Find header row (first non-empty)
  let headerRowIndex = rows.findIndex(r => r.trim() !== '');
  if (headerRowIndex === -1) return [];

  const headerLine = rows[headerRowIndex];

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result.map(s => s.trim());
  };

  const headers = parseLine(headerLine).map(h => h.replace(/^\uFEFF/, '').trim());

  const records = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const line = rows[i];
    if (skipEmptyLines && (!line || line.trim() === '')) continue;
    const values = parseLine(line);
    // If row has fewer values, fill with empty strings
    while (values.length < headers.length) values.push('');
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    records.push(obj);
  }

  return records;
}


export function parseCSVWithPapa(text) {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const YM_REGEX = /^(?:\d{2,4}-[A-Za-z]{3}|[A-Za-z]{3}-\d{2,4})$/i;

  const clean = (v) => String(v ?? '').replace(/^\uFEFF/, '').trim();
  const parseNumber = (v) => {
    if (v === undefined || v === null || v === '') return 0;
    const s = String(v).replace(/,/g, '').replace(/\(/g, '-').replace(/\)/g, '');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };

  // Parse raw rows so we can find multiple header blocks
  const { data: rawRows } = Papa.parse(text, { header: false, skipEmptyLines: false });
  const totals = {};
  const IGNORE_ROW_NAMES = new Set(["Totals", "Total", "Grand Total", "Compared to Month PY"]);

  for (let i = 0; i < rawRows.length; i++) {
    const row = (rawRows[i] || []).map(clean);
    // find any YM headers in this row
    const headerCols = row.map((c, idx) => ({ c, idx })).filter(x => YM_REGEX.test(x.c));
    if (headerCols.length === 0) continue;

    // build column -> { year, month }
    const colMap = [];
    for (const h of headerCols) {
      const parts = h.c.split('-');
      let yy = parts[0], mm = parts[1];
      if (/^\d/.test(parts[0])) { // 22-Jan or 2022-Jan
        yy = parts[0]; mm = parts[1];
      } else { // Jan-22 or Jan-2022
        mm = parts[0]; yy = parts[1];
      }
      if (!yy || !mm) continue;
      let year = yy;
      if (year.length === 2) year = Number(year) >= 50 ? `19${year}` : `20${year}`;
      const m3 = (mm || '').slice(0,3).toLowerCase();
      const month = MONTHS.find(M => M.toLowerCase() === m3);
      if (!month) continue;
      colMap.push({ idx: h.idx, year, month });
    }
    if (colMap.length === 0) continue;

    // read following rows until blank row or next header
    for (let r = i + 1; r < rawRows.length; r++) {
      const prow = (rawRows[r] || []).map(clean);
      const allEmpty = prow.every(c => c === '');
      if (allEmpty) break;
      // stop if this row looks like another header row
      if (prow.some(c => YM_REGEX.test(c))) break;

      // skip summary rows
      const firstCell = String(prow[0] ?? '').trim();
      if (IGNORE_ROW_NAMES.has(firstCell) || /^\s*Compared to/i.test(firstCell)) continue;

      for (const col of colMap) {
        const rawVal = prow[col.idx];
        const v = parseNumber(rawVal);
        if (!totals[col.year]) totals[col.year] = {};
        totals[col.year][col.month] = (totals[col.year][col.month] || 0) + v;
      }
    }
  }

  const sortedTotals = Object.fromEntries(
    Object.entries(totals).map(([year, monthsObj]) => {
      const sorted = Object.fromEntries(
        MONTHS.filter(m => monthsObj[m] !== undefined).map(m => [m, Number(monthsObj[m].toFixed(2))])
      );
      return [year, sorted];
    })
  );

  const totalsYYYYMM = {};
  for (const [year, monthsObj] of Object.entries(sortedTotals)) {
    for (const [mon, val] of Object.entries(monthsObj)) {
      const idx = MONTHS.indexOf(mon) + 1;
      const ym = `${year}-${String(idx).padStart(2, '0')}`;
      totalsYYYYMM[ym] = val;
    }
  }

  return { totalsByYear: sortedTotals, totalsYYYYMM };
}
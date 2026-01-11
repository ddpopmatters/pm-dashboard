/**
 * CSV parsing utilities for the PM Dashboard
 */

export interface CSVRecord {
  rowNumber: number;
  record: Record<string, string>;
}

export interface ParsedCSV {
  headers: string[];
  records: CSVRecord[];
}

/**
 * Split a CSV line respecting quoted fields
 */
export const splitCSVLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

/**
 * Parse CSV text into headers and records
 */
export const parseCSV = (text: string): ParsedCSV => {
  if (!text || typeof text !== 'string') {
    return { headers: [], records: [] };
  }

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return { headers: [], records: [] };
  }

  const headers = splitCSVLine(lines[0]).map((header) => header.trim());
  const records = lines.slice(1).map((line, index) => {
    const values = splitCSVLine(line);
    while (values.length < headers.length) values.push('');
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? '').trim();
    });
    return { rowNumber: index + 2, record };
  });

  return { headers, records };
};

/**
 * Normalize a header key for comparison (lowercase, underscores)
 */
export const normalizeHeaderKey = (key: string): string =>
  key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

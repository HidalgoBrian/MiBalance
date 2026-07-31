import ExcelJS from 'exceljs';
import type { FinanceRecord, Category } from './types.js';

const SHEET_NAME = 'Finanzas';
const COLUMNS = ['Fecha', 'Descripción', 'Categoría', 'Subcategoría', 'Monto', 'Notas'] as const;

const CATEGORY_MAP: Record<string, Category> = {
  'Ingreso': 'income',
  'Gasto Personal': 'personal_expense',
  'Gasto General': 'general_expense',
  'Inversión': 'investment',
};

const CATEGORY_REVERSE: Record<Category, string> = {
  'income': 'Ingreso',
  'personal_expense': 'Gasto Personal',
  'general_expense': 'Gasto General',
  'investment': 'Inversión',
};

function parseExcelDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const utcDays = Math.floor(value - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function parseExcelCategory(value: unknown): Category {
  const str = String(value ?? '').trim();
  return CATEGORY_MAP[str] ?? 'personal_expense';
}

function parseExcelAmount(value: unknown): number {
  if (typeof value === 'number') return Math.abs(value);
  const str = String(value ?? '0').replace(/[^0-9.,\-]/g, '').replace(',', '.');
  return Math.abs(parseFloat(str) || 0);
}

export async function loadRecords(filePath: string): Promise<FinanceRecord[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    throw new Error(`No se encontró la hoja "${SHEET_NAME}" en el archivo.`);
  }

  const records: FinanceRecord[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const date = parseExcelDate(row.getCell(1).value);
    const description = String(row.getCell(2).value ?? '').trim();
    const category = parseExcelCategory(row.getCell(3).value);
    const subcategory = String(row.getCell(4).value ?? '').trim();
    const amount = parseExcelAmount(row.getCell(5).value);
    const notes = String(row.getCell(6).value ?? '').trim();

    if (!description || amount === 0) return;

    records.push({
      id: `row-${rowNumber}`,
      date,
      description,
      category,
      subcategory,
      amount,
      notes,
    });
  });

  return records;
}

export async function saveRecords(filePath: string, records: FinanceRecord[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  let worksheet = workbook.getWorksheet(SHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(SHEET_NAME);
  }

  const headerRow = worksheet.getRow(1);
  COLUMNS.forEach((col, i) => {
    headerRow.getCell(i + 1).value = col;
  });
  headerRow.font = { bold: true };

  const sorted = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());

  sorted.forEach((record, i) => {
    const row = worksheet.getRow(i + 2);
    row.getCell(1).value = record.date;
    row.getCell(2).value = record.description;
    row.getCell(3).value = CATEGORY_REVERSE[record.category];
    row.getCell(4).value = record.subcategory;
    row.getCell(5).value = record.amount;
    row.getCell(6).value = record.notes;
  });

  worksheet.columns = worksheet.columns.map(col => {
    if (col) col.width = 20;
    return col;
  });

  await workbook.xlsx.writeFile(filePath);
}

export async function createTemplate(filePath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(SHEET_NAME);

  const headerRow = worksheet.getRow(1);
  COLUMNS.forEach((col, i) => {
    headerRow.getCell(i + 1).value = col;
  });
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  worksheet.columns = worksheet.columns.map(col => {
    if (col) col.width = 22;
    return col;
  });

  await workbook.xlsx.writeFile(filePath);
}

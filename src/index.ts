import { createTemplate, loadRecords, saveRecords } from './excel.js';
import { calculateSummary, getCategoryBreakdown } from './finance.js';
import { buildTimeline } from './timeline.js';
import { getMonthlyComparisons, getComparisonChartData } from './reports.js';
import type { FinanceRecord, Category } from './types.js';

const SAMPLE_FILE = 'MiBalance.xlsx';

function generateSampleRecords(): FinanceRecord[] {
  const records: FinanceRecord[] = [];
  const now = new Date();
  let id = 1;

  const addRecord = (year: number, month: number, day: number, desc: string, cat: Category, sub: string, amount: number, notes = '') => {
    records.push({
      id: `sample-${id++}`,
      date: new Date(year, month - 1, day),
      description: desc,
      category: cat,
      subcategory: sub,
      amount,
      notes,
    });
  };

  for (let y = now.getFullYear() - 1; y <= now.getFullYear(); y++) {
    const months = y === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let m = 1; m <= months; m++) {
      const income = 1500 + Math.floor(Math.random() * 500);

      addRecord(y, m, Math.min(1, 28), 'Sueldo mensual', 'income', 'Salario', income);

      if (Math.random() > 0.5) {
        addRecord(y, m, Math.min(15, 28), 'Freelance diseño web', 'income', 'Freelance', 200 + Math.floor(Math.random() * 300));
      }

      addRecord(y, m, Math.min(5, 28), 'Alquiler', 'general_expense', 'Vivienda', 400);
      addRecord(y, m, Math.min(10, 28), 'Servicios (luz, agua, internet)', 'general_expense', 'Servicios', 80 + Math.floor(Math.random() * 40));
      addRecord(y, m, Math.min(3, 28), 'Supermercado', 'personal_expense', 'Alimentación', 150 + Math.floor(Math.random() * 100));
      addRecord(y, m, Math.min(8, 28), 'Salida a cenar', 'personal_expense', 'Ocio', 20 + Math.floor(Math.random() * 40));
      addRecord(y, m, Math.min(12, 28), 'Transporte', 'personal_expense', 'Transporte', 30 + Math.floor(Math.random() * 20));

      if (Math.random() > 0.4) {
        addRecord(y, m, Math.min(20, 28), 'Compra de acciones', 'investment', 'Acciones', 100 + Math.floor(Math.random() * 200));
      }

      if (Math.random() > 0.6) {
        addRecord(y, m, Math.min(25, 28), 'Ropa', 'personal_expense', 'Indumentaria', 30 + Math.floor(Math.random() * 70));
      }
    }
  }

  return records;
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function printSeparator(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}`);
}

function printSummary(records: FinanceRecord[]) {
  const s = calculateSummary(records);
  console.log(`  Resumen General:`);
  console.log(`  ${'Ingresos totales:'.padEnd(25)} ${formatCurrency(s.totalIncome)}`);
  console.log(`  ${'Gastos personales:'.padEnd(25)} ${formatCurrency(s.totalPersonalExpenses)}`);
  console.log(`  ${'Gastos generales:'.padEnd(25)} ${formatCurrency(s.totalGeneralExpenses)}`);
  console.log(`  ${'Total gastos:'.padEnd(25)} ${formatCurrency(s.totalExpenses)}`);
  console.log(`  ${'Inversiones:'.padEnd(25)} ${formatCurrency(s.totalInvestments)}`);
  console.log(`  ${'Balance neto:'.padEnd(25)} ${formatCurrency(s.netBalance)}`);
  console.log(`  ${'Registros:'.padEnd(25)} ${s.recordCount}`);
}

function printCategoryBreakdown(records: FinanceRecord[]) {
  const breakdown = getCategoryBreakdown(records);
  const catNames: Record<string, string> = {
    income: 'Ingresos',
    personal_expense: 'Gastos Personales',
    general_expense: 'Gastos Generales',
    investment: 'Inversiones',
  };

  for (const b of breakdown) {
    console.log(`\n  ${catNames[b.category] ?? b.category}: ${formatCurrency(b.total)} (${b.count} registros)`);
    if (b.subcategories.size > 0) {
      for (const [sub, data] of b.subcategories) {
        console.log(`    ├─ ${sub}: ${formatCurrency(data.total)} (${data.count} registros)`);
      }
    }
  }
}

function printTimeline(records: FinanceRecord[]) {
  for (const granularity of ['daily', 'weekly', 'monthly', 'yearly'] as const) {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const entries = buildTimeline(records, granularity, year, granularity === 'yearly' ? undefined : month);

    if (entries.length === 0) continue;

    console.log(`\n  Vista ${granularity}:`);
    console.log(`  ${'Período'.padEnd(18)} ${'Ingresos'.padEnd(14)} ${'Gastos'.padEnd(14)} ${'Inversión'.padEnd(14)} ${'Balance'.padEnd(14)}`);
    console.log(`  ${'-'.repeat(70)}`);

    for (const e of entries) {
      console.log(
        `  ${e.label.padEnd(18)} ${formatCurrency(e.income).padEnd(14)} ${formatCurrency(e.totalExpenses).padEnd(14)} ${formatCurrency(e.investments).padEnd(14)} ${formatCurrency(e.netBalance).padEnd(14)}`
      );
    }
  }
}

function printMonthlyComparison(records: FinanceRecord[]) {
  const comparisons = getMonthlyComparisons(records);

  console.log(`\n  Comparación Mensual:`);
  console.log(`  ${'Mes'.padEnd(18)} ${'Ingresos'.padEnd(14)} ${'Gastos'.padEnd(14)} ${'Inversión'.padEnd(14)} ${'Neto'.padEnd(14)}`);
  console.log(`  ${'-'.repeat(70)}`);

  for (const c of comparisons) {
    const marker = c.net >= 0 ? '✅' : '⚠️';
    console.log(
      `  ${c.label.padEnd(18)} ${formatCurrency(c.income).padEnd(14)} ${formatCurrency(c.expenses).padEnd(14)} ${formatCurrency(c.investments).padEnd(14)} ${formatCurrency(c.net).padEnd(12)} ${marker}`
    );
  }
}

function printChartData(records: FinanceRecord[]) {
  const data = getComparisonChartData(records);

  console.log(`\n  Datos para gráfico (JSON):`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'demo';

  switch (command) {
    case 'template': {
      await createTemplate(args[1] ?? 'plantilla.xlsx');
      console.log(`Plantilla creada: ${args[1] ?? 'plantilla.xlsx'}`);
      break;
    }

    case 'load': {
      const filePath = args[1] ?? SAMPLE_FILE;
      const records = await loadRecords(filePath);
      console.log(`Cargados ${records.length} registros desde ${filePath}`);
      printSummary(records);
      printCategoryBreakdown(records);
      printTimeline(records);
      printMonthlyComparison(records);
      break;
    }

    case 'demo':
    default: {
      const filePath = args[1] ?? SAMPLE_FILE;
      const records = generateSampleRecords();

      await saveRecords(filePath, records);
      console.log(`\n✅ Archivo de ejemplo generado: ${filePath} (${records.length} registros)`);

      printSeparator('RESUMEN GENERAL');
      printSummary(records);

      printSeparator('DESGLOSE POR CATEGORÍA');
      printCategoryBreakdown(records);

      printSeparator('LÍNEA DE TIEMPO');
      printTimeline(records);

      printSeparator('COMPARACIÓN MENSUAL');
      printMonthlyComparison(records);

      printSeparator('DATOS PARA GRÁFICO');
      printChartData(records);

      console.log(`\n📊 Para cargar un archivo existente: npm run load -- <archivo.xlsx>`);
      console.log(`📋 Para crear una plantilla: npm run template -- <archivo.xlsx>\n`);
      break;
    }
  }
}

main().catch(console.error);

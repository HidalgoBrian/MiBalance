import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { addRecord, loadRecords } from './excel.js';
import { calculateSummary, getCategoryBreakdown } from './finance.js';
import { getMonthlyComparisons } from './reports.js';
import type { Category } from './types.js';

const PORT = Number(process.env.PORT ?? 3000);
const DATA_FILE = process.env.MIBALANCE_FILE ?? 'MiBalance.xlsx';
const PUBLIC_DIR = join(process.cwd(), 'public');

const validCategories = new Set<Category>([
  'income',
  'personal_expense',
  'general_expense',
  'investment',
]);

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy(new Error('El cuerpo de la solicitud es demasiado grande.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function toApiResponse(records: Awaited<ReturnType<typeof loadRecords>>) {
  return {
    records: records.map(record => ({
      ...record,
      date: record.date.toISOString().slice(0, 10),
    })),
    summary: calculateSummary(records),
    breakdown: getCategoryBreakdown(records).map(item => ({
      category: item.category,
      total: item.total,
      count: item.count,
      subcategories: Array.from(item.subcategories.entries()).map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
      })),
    })),
    monthlyComparisons: getMonthlyComparisons(records),
  };
}

async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'GET' && req.url === '/api/records') {
    const records = await loadRecords(DATA_FILE);
    sendJson(res, 200, toApiResponse(records));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/records') {
    const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
    const category = String(body.category ?? '') as Category;
    const amount = Number(body.amount);
    const date = new Date(String(body.date ?? ''));

    if (Number.isNaN(date.getTime())) {
      sendJson(res, 400, { error: 'La fecha no es valida.' });
      return;
    }

    if (!validCategories.has(category)) {
      sendJson(res, 400, { error: 'La categoria no es valida.' });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      sendJson(res, 400, { error: 'El monto debe ser mayor a cero.' });
      return;
    }

    const description = String(body.description ?? '').trim();
    if (!description) {
      sendJson(res, 400, { error: 'La descripcion es obligatoria.' });
      return;
    }

    const records = await addRecord(DATA_FILE, {
      date,
      description,
      category,
      subcategory: String(body.subcategory ?? '').trim(),
      amount,
      notes: String(body.notes ?? '').trim(),
    });

    sendJson(res, 201, toApiResponse(records));
    return;
  }

  sendJson(res, 404, { error: 'Endpoint no encontrado.' });
}

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url === '/' ? '/index.html' : req.url ?? '/index.html';
  const cleanPath = url.split('?')[0]!.replace(/^\/+/, '');
  const filePath = join(PUBLIC_DIR, cleanPath);
  const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
  };

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Archivo no encontrado');
  }
}

const server = createServer((req, res) => {
  void (async () => {
    try {
      if (req.url?.startsWith('/api/')) {
        await handleApi(req, res);
        return;
      }

      await serveStatic(req, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      sendJson(res, 500, { error: message });
    }
  })();
});

server.listen(PORT, () => {
  console.log(`MiBalance listo en http://localhost:${PORT}`);
  console.log(`Guardando datos en ${DATA_FILE}`);
});

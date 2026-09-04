/**
 * convert_sheet.js
 * Reads "NEW 1.xlsx", maps every product row to the InventoryProduct schema
 * (drops legacy unitQty / oneUnitPrice columns entirely), and rewrites
 * src/data/inventoryData.ts with the fresh dataset.
 *
 * Run:  node convert_sheet.js
 *
 * Dependencies: npm install xlsx
 */

import XLSX from 'xlsx';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const EXCEL_FILE   = path.join(__dirname, 'NEW 1.xlsx');
const TARGET_FILE  = path.join(__dirname, 'src', 'data', 'inventoryData.ts');
const SHEETS_TO_PARSE = ['Sheet1', 'Sheet4'];   // adjust if sheet names differ

// ── Helpers ───────────────────────────────────────────────────────────────────
function toNum(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (s === '' || s === '-' || s === '--') return 0;
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function toStr(v) {
  return (v === null || v === undefined) ? '' : String(v).trim();
}

function slugify(v) {
  return toStr(v)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .substring(0, 30) || 'ITEM';
}

// Safe single-quoted string — escapes backslash, all quote variants, template literals
function esc(v) {
  return toStr(v)
    .replace(/\\/g, '\\\\')
    .replace(/'/g,    "\\'")
    .replace(/\u2018/g, "\\'")   // left single quotation mark
    .replace(/\u2019/g, "\\'")   // right single quotation mark
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

// ── Parse workbook ─────────────────────────────────────────────────────────────
if (!fs.existsSync(EXCEL_FILE)) {
  console.error(`ERROR: File not found → ${EXCEL_FILE}`);
  console.error('Place "NEW 1.xlsx" in the workspace root, then re-run.');
  process.exit(1);
}

console.log('Reading:', EXCEL_FILE);
const wb = XLSX.readFile(EXCEL_FILE);

const allRows   = [];
const seenIds   = new Set();
const catSet    = new Set();   // for dynamic category generation

for (const sheetName of SHEETS_TO_PARSE) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    // Sheet may not exist in every workbook version — skip gracefully
    console.warn(`Sheet "${sheetName}" not found — skipping`);
    continue;
  }

  const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`Sheet "${sheetName}": ${json.length} raw rows`);

  let accepted = 0;
  for (const row of json) {
    const rawId   = toStr(row['auto-key']);
    const rawSKey = toStr(row['search word']);
    const rawName = toStr(row['name']);
    const rawCat  = toStr(row['product catagories']);   // note: intentional typo in sheet header

    // ── Dropped columns: 'unit qty', '1 unit price' ── (not read at all)
    const cost    = toNum(row['cost']);
    const lastP   = toNum(row['last price']);
    const salesP  = toNum(row['Sales price']);
    const dispP   = toNum(row['display price']);

    // Skip blank / header mirror rows
    if (!rawName && !rawId) continue;
    if (rawId === 'auto-key' || rawName === 'name') continue;
    if (!rawName.trim() && !rawSKey.trim()) continue;

    // Unique id generation
    const baseId = rawId ? `p-${rawId}` : `p-${slugify(rawSKey)}-${allRows.length}`;
    let uid = baseId;
    let sfx = 2;
    while (seenIds.has(uid)) { uid = `${baseId}-${sfx++}`; }
    seenIds.add(uid);

    const cat   = rawCat || 'General';
    const catId = `cat-${slugify(cat).toLowerCase()}`;
    catSet.add(cat);

    const status = (salesP === 0 && cost === 0) ? 'Out of Stock' : 'Available';

    allRows.push({
      id:              uid,
      searchKey:       rawSKey || slugify(rawName),
      name:            rawName,
      productCategory: cat,
      categoryId:      catId,
      cost,
      lastPrice:       lastP,
      salesPrice:      salesP,
      displayPrice:    dispP,
      storeQty:        50,
      salesType:       'Piece',
      status,
    });
    accepted++;
  }
  console.log(`  → ${accepted} products accepted`);
}

console.log(`Total: ${allRows.length} products across ${catSet.size} categories`);

if (allRows.length === 0) {
  console.error('No products parsed — check column header names in the workbook.');
  process.exit(1);
}

// ── Serialize inventory rows ───────────────────────────────────────────────────
const itemLines = allRows.map((p, i) => {
  const trail = i < allRows.length - 1 ? ',' : '';
  return (
    `  { id: '${esc(p.id)}', searchKey: '${esc(p.searchKey)}', name: '${esc(p.name)}', ` +
    `productCategory: '${esc(p.productCategory)}', categoryId: '${esc(p.categoryId)}', ` +
    `cost: ${p.cost}, lastPrice: ${p.lastPrice}, salesPrice: ${p.salesPrice}, ` +
    `displayPrice: ${p.displayPrice}, storeQty: ${p.storeQty}, ` +
    `salesType: 'Piece', status: '${p.status}' as const }${trail}`
  );
});

// ── Serialize dynamic categories (for mockData.ts reference — printed as comment) ──
const uniqueCats = Array.from(catSet).sort();
const catComment = uniqueCats.map(c => `//   • ${c}`).join('\n');

// ── Build full inventoryData.ts output ────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);

const output =
`import { InventoryProduct } from '../types/index';

// ──────────────────────────────────────────────
// SINGLE MASTER ARRAY: inventoryItems
// Auto-generated from "NEW 1.xlsx" on ${today}
// ${allRows.length} products | ${uniqueCats.length} categories
//
// Dynamic category list:
${catComment}
// ──────────────────────────────────────────────

const rawInventoryItems: InventoryProduct[] = [
${itemLines.join('\n')}
];

// Filter out rows with no name (safety net)
export const inventoryItems: InventoryProduct[] = rawInventoryItems.filter(
  item => item.name.trim().length > 0
);
`;

// ── Write file ────────────────────────────────────────────────────────────────
fs.writeFileSync(TARGET_FILE, output, 'utf8');
console.log(`\nDone! Wrote ${allRows.length} products → ${TARGET_FILE}`);
console.log('Categories detected:');
uniqueCats.forEach(c => console.log(`  • ${c}`));

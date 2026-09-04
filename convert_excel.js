/**
 * convert_excel.js  — v2
 * Reads liyanage2.xlsx, replaces the inventoryItems block in mockData.ts
 * with real product data, then removes the auto-generated trailing block.
 *
 * Run: node convert_excel.js
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCEL_FILE  = path.join(__dirname, 'liyanage2.xlsx');
const TARGET_FILE = path.join(__dirname, 'src', 'data', 'mockData.ts');
const SHEETS_TO_PARSE = ['Sheet1', 'Sheet4'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function toNum(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (s === '' || s === '-' || s === '--') return 0;
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}
function toStr(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}
function slugify(v) {
  return toStr(v).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 30) || 'ITEM';
}
function esc(v) {
  // Produce a safe single-quoted string value.
  // Escape backslashes, then escape all single-quote variants.
  return toStr(v)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")    // ASCII apostrophe
    .replace(/\u2019/g, "\\'")  // right single quotation mark '
    .replace(/\u2018/g, "\\'")  // left single quotation mark '
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

// ── Parse workbook ───────────────────────────────────────────────────────────
console.log('Reading:', EXCEL_FILE);
const wb = XLSX.readFile(EXCEL_FILE);

const allRows = [];
const seenIds = new Set();

for (const sheetName of SHEETS_TO_PARSE) {
  const ws = wb.Sheets[sheetName];
  if (!ws) { console.warn(`Sheet "${sheetName}" not found`); continue; }

  const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`Sheet "${sheetName}": ${json.length} rows`);

  let accepted = 0;
  for (const row of json) {
    const rawId   = toStr(row['auto-key']);
    const rawSKey = toStr(row['search word']);
    const rawName = toStr(row['name']);
    const rawCat  = toStr(row['product catagories']);
    const cost    = toNum(row['cost']);
    const lastP   = toNum(row['last price']);
    const salesP  = toNum(row['Sales price']);
    const dispP   = toNum(row['display price']);

    if (!rawName && !rawId) continue;
    if (rawId === 'auto-key' || rawName === 'name') continue;
    if (!rawName.trim() && !rawSKey.trim()) continue;

    const baseId = rawId ? `p-${rawId}` : `p-${slugify(rawSKey)}-${allRows.length}`;
    let uid = baseId;
    let sfx = 2;
    while (seenIds.has(uid)) { uid = `${baseId}-${sfx++}`; }
    seenIds.add(uid);

    const status = (salesP === 0 && cost === 0) ? 'Out of Stock' : 'Available';
    const cat    = rawCat || 'General';
    const catId  = `cat-${slugify(cat).toLowerCase()}`;

    allRows.push({ id: uid, searchKey: rawSKey || slugify(rawName), name: rawName, productCategory: cat, categoryId: catId, cost, lastPrice: lastP, salesPrice: salesP, displayPrice: dispP, storeQty: 50, salesType: 'Piece', unitQty: 1, oneUnitPrice: salesP, status });
    accepted++;
  }
  console.log(`  -> ${accepted} products accepted`);
}

console.log(`Total: ${allRows.length} products`);

// ── Serialize ────────────────────────────────────────────────────────────────
const lines = allRows.map((p, i) => {
  const trail = i < allRows.length - 1 ? ',' : '';
  return `  { id: '${esc(p.id)}', searchKey: '${esc(p.searchKey)}', name: '${esc(p.name)}', productCategory: '${esc(p.productCategory)}', categoryId: '${esc(p.categoryId)}', cost: ${p.cost}, lastPrice: ${p.lastPrice}, salesPrice: ${p.salesPrice}, displayPrice: ${p.displayPrice}, storeQty: 50, salesType: 'Piece', unitQty: 1, oneUnitPrice: ${p.oneUnitPrice}, status: '${p.status}' as const }${trail}`;
});

const newInventoryBlock =
`// ──────────────────────────────────────────────
// SINGLE MASTER ARRAY: inventoryItems
// Auto-generated from liyanage2.xlsx on ${new Date().toISOString().slice(0,10)}
// ${allRows.length} real products
// ──────────────────────────────────────────────

export const inventoryItems: InventoryProduct[] = [
${lines.join('\n')}
];`;

// ── Patch mockData.ts ────────────────────────────────────────────────────────
let src = fs.readFileSync(TARGET_FILE, 'utf8');

// 1. Remove the old appended trailing block (from previous failed run)
const TRAILING_MARKER = '\n\n// ── AUTO-GENERATED PRODUCTS (import failed to locate block) ──\n';
const trailIdx = src.indexOf(TRAILING_MARKER);
if (trailIdx !== -1) {
  src = src.slice(0, trailIdx);
  console.log('Removed stale trailing block');
}

// 2. Replace the old inventoryItems section.
//    Anchor: starts at the line "// ──..." just before "// SINGLE MASTER ARRAY"
//    Ends at the closing "})();" line.
//    We'll use a line-range approach for reliability.
const srcLines = src.split('\n');

// Find start line: the separator comment just before the block
const startPattern = '// SINGLE MASTER ARRAY: inventoryItems';
let startLine = -1;
for (let i = 0; i < srcLines.length; i++) {
  if (srcLines[i].includes(startPattern)) { startLine = i; break; }
}

// Walk back to find the preceding separator dashes (// ────...)
if (startLine > 0 && srcLines[startLine - 1].startsWith('// ──')) {
  startLine = startLine - 1;
}

// Find end line: the closing "];" of the inventoryItems declaration
// Could be from the old IIFE "})();" or a flat array "];"
let endLine = -1;
for (let i = startLine; i < srcLines.length; i++) {
  const t = srcLines[i].trim();
  if (t === '})();' || t === '];') {
    // Make sure this ]; belongs to inventoryItems, not some other array.
    // Check that between startLine and here there's "export const inventoryItems"
    const segment = srcLines.slice(startLine, i + 1).join('\n');
    if (segment.includes('inventoryItems')) { endLine = i; break; }
  }
}

if (startLine === -1 || endLine === -1) {
  console.error('Could not locate inventoryItems block boundaries!');
  console.error('startLine:', startLine, 'endLine:', endLine);
  process.exit(1);
}

console.log(`Replacing lines ${startLine}–${endLine} with new block`);

const before = srcLines.slice(0, startLine).join('\n');
const after  = srcLines.slice(endLine + 1).join('\n');
const patched = before + '\n' + newInventoryBlock + '\n' + after;

fs.writeFileSync(TARGET_FILE, patched, 'utf8');
console.log(`Done! Wrote ${allRows.length} products -> ${TARGET_FILE}`);

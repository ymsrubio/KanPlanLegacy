// Artboard number (title prefix in canvas.json, e.g. 6) or file name -> "<File>.dc.html". Usage: node board-file.mjs <dir> <n|file>
import fs from 'node:fs';
import path from 'node:path';
const [dir, q] = process.argv.slice(2);
const { boards } = JSON.parse(fs.readFileSync(path.join(dir, 'canvas.json'), 'utf8'));
const hit = Object.entries(boards).find(([f, b]) => f === q || f === `${q}.dc.html` || b.title.split(' ')[0] === q);
if (!hit) { console.error(`no artboard "${q}" in canvas.json`); process.exit(1); }
console.log(hit[0]);

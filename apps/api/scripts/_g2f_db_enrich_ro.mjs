/**
 * GLOBAL-2F：只读核对 specialty/category/KP/method 与 code 撞库（无写入）。
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();
const items = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../../../docs/high_school_math/question_bank/_g2f_adapted_items.json',
    ),
    'utf8',
  ),
);

const c = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'study_system',
});

const codes = items.map((i) => i.code);
const specs = [...new Set(items.map((i) => i.specialtyCode))];
const cats = [...new Set(items.map((i) => i.categoryCode))];
const kps = [...new Set(items.flatMap((i) => i.knowledgePointCodes))];
const methods = [...new Set(items.flatMap((i) => i.methodCodes || []))];

const [exist] = await c.query(
  'SELECT code, status, pool FROM hs_math_train_items WHERE code IN (?)',
  [codes],
);
const [sp] = await c.query(
  'SELECT id, code, is_active FROM hs_math_specialties WHERE code IN (?)',
  [specs],
);
const [cat] = await c.query(
  'SELECT id, code, specialty_id, is_active FROM hs_math_categories WHERE code IN (?)',
  [cats],
);
const [kp] = await c.query(
  'SELECT code, specialty_id, is_active FROM hs_math_knowledge_points WHERE code IN (?)',
  [kps],
);
const [meth] = await c.query(
  'SELECT code, is_active FROM hs_math_methods WHERE code IN (?)',
  [methods],
);
const [drawable] = await c.query(
  "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
);
const [g2a] = await c.query(
  "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%'",
);

const spByCode = Object.fromEntries(sp.map((r) => [r.code, r]));
const pairMiss = [];
for (const it of items) {
  const s = spByCode[it.specialtyCode];
  if (!s) {
    pairMiss.push({ code: it.code, err: 'SPECIALTY_MISS' });
    continue;
  }
  const hit = cat.find(
    (x) => x.code === it.categoryCode && String(x.specialty_id) === String(s.id),
  );
  if (!hit) pairMiss.push({ code: it.code, err: 'CAT_PAIR_MISS', categoryCode: it.categoryCode });
}

const out = {
  collide: exist.map((r) => ({ code: r.code, status: r.status, pool: r.pool })),
  g2aExisting: Number(g2a[0].n),
  drawable: Number(drawable[0].n),
  specs: {
    need: specs.length,
    found: sp.length,
    inactive: sp.filter((x) => !x.is_active).map((x) => x.code),
  },
  cats: {
    need: cats.length,
    found: cat.length,
    inactive: cat.filter((x) => !x.is_active).map((x) => x.code),
  },
  kps: {
    need: kps.length,
    found: kp.length,
    inactive: kp.filter((x) => !x.is_active).map((x) => x.code),
    miss: kps.filter((k) => !kp.find((r) => r.code === k)),
  },
  methods: {
    need: methods.length,
    found: meth.length,
    inactive: meth.filter((x) => !x.is_active).map((x) => x.code),
    miss: methods.filter((m) => !meth.find((r) => r.code === m)),
  },
  pairMiss,
  ok:
    exist.length === 0 &&
    pairMiss.length === 0 &&
    kp.length === kps.length &&
    meth.length === methods.length &&
    sp.filter((x) => !x.is_active).length === 0 &&
    Number(drawable[0].n) === 113,
};

fs.writeFileSync(
  path.join(
    __dirname,
    '../../../docs/high_school_math/question_bank/_g2f_db_enrich_ro.json',
  ),
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
await c.end();

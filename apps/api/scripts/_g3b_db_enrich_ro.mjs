/**
 * GLOBAL-3B：只读核对 specialty/category/KP/method 与 code 撞库（无写入）。
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
      '../../../docs/high_school_math/question_bank/_g3b_adapted_items.json',
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
const [g3a] = await c.query(
  "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G3A-%'",
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
  if (!hit)
    pairMiss.push({
      code: it.code,
      err: 'CAT_PAIR_MISS',
      categoryCode: it.categoryCode,
    });
}

const kpInactive = kp.filter((r) => !r.is_active).map((r) => r.code);
const methInactive = meth.filter((r) => !r.is_active).map((r) => r.code);
const kpMiss = kps.filter((code) => !kp.some((r) => r.code === code));
const methMiss = methods.filter((code) => !meth.some((r) => r.code === code));

const out = {
  phase: 'GLOBAL-3B',
  collide: exist.map((r) => ({ code: r.code, status: r.status, pool: r.pool })),
  g3aExisting: Number(g3a[0].n),
  g2aExisting: Number(g2a[0].n),
  drawable: Number(drawable[0].n),
  specs: { need: specs.length, found: sp.length },
  cats: { need: cats.length, found: cat.length },
  pairMiss,
  kp: { need: kps.length, found: kp.length, miss: kpMiss, inactive: kpInactive },
  methods: {
    need: methods.length,
    found: meth.length,
    miss: methMiss,
    inactive: methInactive,
  },
  verifiedAt: new Date().toISOString(),
};
await c.end();

const outPath = path.join(
  __dirname,
  '../../../docs/high_school_math/question_bank/_g3b_db_enrich_ro.json',
);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(
  JSON.stringify(
    {
      drawable: out.drawable,
      g3aExisting: out.g3aExisting,
      collide: out.collide.length,
      pairMiss: out.pairMiss.length,
      kpMiss: out.kp.miss.length,
      methMiss: out.methods.miss.length,
      kpInactive: out.kp.inactive.length,
      methInactive: out.methods.inactive.length,
    },
    null,
    2,
  ),
);

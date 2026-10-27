import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const outDir = path.join(root, 'docs/high_school_math/question_bank');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  loadEnv();
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'study_system',
  });

  const [kps] = await c.query(
    `SELECT kp.code, kp.name, s.code AS specialtyCode
     FROM hs_math_knowledge_points kp
     JOIN hs_math_specialties s ON s.id = kp.specialty_id
     WHERE kp.is_active = 1
     ORDER BY kp.code`,
  );
  const [methods] = await c.query(
    `SELECT code, name FROM hs_math_methods WHERE is_active = 1 ORDER BY code`,
  );
  const [drawableRows] = await c.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE pool = 'formal' AND status = 'approved' AND is_active = 1`,
  );
  const [stems] = await c.query(
    `SELECT code, qtype, difficulty, LEFT(stem, 120) AS stemHead
     FROM hs_math_train_items
     WHERE code LIKE 'CAND-G1B-%'
     ORDER BY code`,
  );
  const [allFormal] = await c.query(
    `SELECT code, qtype, difficulty, LEFT(stem, 160) AS stemHead
     FROM hs_math_train_items
     WHERE pool = 'formal' AND is_active = 1
     ORDER BY code`,
  );

  const out = {
    exportedAt: new Date().toISOString(),
    drawable: Number(drawableRows[0].n),
    kpCount: kps.length,
    methods,
    kps,
    g1bCount: stems.length,
    g1bStems: stems,
    formalCount: allFormal.length,
    formalStems: allFormal,
  };

  fs.writeFileSync(
    path.join(outDir, '_g2a_readonly_baseline.json'),
    JSON.stringify(out, null, 2),
    'utf8',
  );
  console.log(
    JSON.stringify(
      {
        drawable: out.drawable,
        kpCount: out.kpCount,
        methods: methods.map((m) => m.code),
        g1bCount: out.g1bCount,
        formalCount: out.formalCount,
      },
      null,
      2,
    ),
  );
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

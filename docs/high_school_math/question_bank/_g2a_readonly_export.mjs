import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const password = process.env.MYSQL_PWD || process.env.DB_PASSWORD || 'root';
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password,
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
  const [specs] = await c.query(
    `SELECT id, code, name FROM hs_math_specialties ORDER BY id`,
  );
  const [drawableRows] = await c.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_items
     WHERE pool = 'formal' AND status = 'approved' AND is_active = 1`,
  );
  const [stems] = await c.query(
    `SELECT code, qtype, difficulty, LEFT(stem, 120) AS stemHead, answer
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
    specs,
    kps,
    g1bCount: stems.length,
    g1bStems: stems,
    formalCount: allFormal.length,
    formalStems: allFormal,
  };

  fs.writeFileSync(
    path.join(__dirname, '_g2a_readonly_baseline.json'),
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

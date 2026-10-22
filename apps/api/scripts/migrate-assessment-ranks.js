const mysql = require('mysql2/promise')

async function main() {
  const c = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'study_user',
    password: 'Hw@2026',
    database: 'study_system',
  })

  const show = async () => {
    const [rows] = await c.query('SHOW COLUMNS FROM assessments')
    console.log(
      'columns:',
      rows.map((x) => x.Field).join(', '),
    )
  }

  await show()

  const statements = [
    'ALTER TABLE assessments ADD COLUMN total_score DECIMAL(8,2) NULL AFTER note',
    'ALTER TABLE assessments ADD COLUMN class_rank INT UNSIGNED NULL AFTER total_score',
    'ALTER TABLE assessments ADD COLUMN school_rank INT UNSIGNED NULL AFTER class_rank',
  ]

  for (const sql of statements) {
    try {
      await c.query(sql)
      console.log('OK:', sql)
    } catch (e) {
      console.log('SKIP:', e.code, e.message)
    }
  }

  await show()
  await c.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

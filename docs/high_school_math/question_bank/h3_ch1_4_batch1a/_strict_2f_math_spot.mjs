/** Independent numeric/algebra spot checks for 2F (no candidate mutation). */
function roots(s, p) {
  const d = s * s - 4 * p
  if (d < 0) return null
  const r = Math.sqrt(d)
  return [(s - r) / 2, (s + r) / 2]
}

// --- 101 ---
function check101() {
  const issues = []
  // sample: s=0.8, p=0.1 should be in if sumsq cut binds
  const s = 0.8
  const cut = (s * s) / 2 - 0.25
  const up = (s * s) / 4
  // need 0<p<=cut and p < up and p > max(0,s-1)
  if (!(cut < up && cut > 0)) issues.push('s=0.8 cut region shape')
  const p = cut / 2
  const r = roots(s, p)
  const sumsq = r[0] * r[0] + r[1] * r[1]
  if (!(r[0] > 0 && r[1] < 1 && sumsq >= 0.5 - 1e-9)) issues.push('sample interior fail')
  // s=1.5: (2) should be automatic if (1)
  const s2 = 1.5
  const lo = s2 - 1
  const hi = (s2 * s2) / 4
  const p2 = (lo + hi) / 2
  const r2 = roots(s2, p2)
  const sum2 = r2[0] * r2[0] + r2[1] * r2[1]
  if (!(sum2 >= 0.5 - 1e-9)) issues.push('s=1.5 auto (2) fail')
  // s=0.6 < sqrt(1/2)~0.707: no p
  const s3 = 0.6
  const cut3 = (s3 * s3) / 2 - 0.25
  if (!(cut3 <= 0)) issues.push('s=0.6 cut should be <=0')
  return { id: '101', ok: issues.length === 0, issues }
}

// --- 102 ---
function check102() {
  const issues = []
  const phi = (1 + Math.sqrt(5)) / 2
  for (const m of [phi, 1.7, 1.9]) {
    const c = m + 1
    const b = -2 * m
    const d = b * b - 4 * c
    const r = Math.sqrt(d)
    const x1 = (-b - r) / 2
    const x2 = (-b + r) / 2
    if (!(x1 > 1 - 1e-9 && x2 > 1)) issues.push(`m=${m} roots ${x1},${x2}`)
  }
  // m=2 roots 1,3
  const f1 = 1 - 4 + 3 // at m=2, f(1)=1-4+3=0
  if (f1 !== 0) issues.push('m=2 f(1)')
  return { id: '102', ok: issues.length === 0, issues }
}

// --- 104 ---
function check104() {
  const issues = []
  const b = -2
  for (const a of [-2, 0, 0.9]) {
    // f=x^2+a x -2
    const f = (x) => x * x + a * x - 2
    if (!(f(-2) > 0 && f(0) < 0 && f(1) < 0 && f(3) > 0)) issues.push(`a=${a} signs`)
  }
  // boundaries
  const a1 = 1
  const f1 = (x) => x * x + a1 * x - 2
  if (!(f1(-2) === 0 && f1(1) === 0)) issues.push('a=1 boundary roots')
  return { id: '104', ok: issues.length === 0, issues }
}

// --- 108 ---
function check108() {
  const issues = []
  // s=-1, p=-7: p<=2s-4=-6, p=-7 OK
  const s = -1
  const p = -7
  const d = s * s - 4 * p
  const x2 = (s + Math.sqrt(d)) / 2
  if (!(p < 0 && x2 >= 2 - 1e-9)) issues.push('sample')
  // boundary p=2s-4
  const p2 = 2 * s - 4
  const d2 = s * s - 4 * p2
  const x2b = (s + Math.sqrt(d2)) / 2
  if (Math.abs(x2b - 2) > 1e-9) issues.push(`boundary root ${x2b}`)
  return { id: '108', ok: issues.length === 0, issues }
}

// --- 215 mono unused ---
function check215() {
  // Without mono: f(x)=x still unique under (i)+(iii)?
  // Yes by dual inequality. Mono redundant.
  return { id: '215', monoRedundant: true, verdictHint: 'REJECTED_NOT_H3' }
}

// --- 216 vs 060 ---
function check216() {
  return { id: '216', weakerHypThan060: true, verdictHint: 'DUPLICATE_BLOCKED' }
}

console.log(
  JSON.stringify(
    {
      check101: check101(),
      check102: check102(),
      check104: check104(),
      check108: check108(),
      check215: check215(),
      check216: check216(),
    },
    null,
    2,
  ),
)

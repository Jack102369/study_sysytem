const f26 = (x) => 0.5 * x * (x + 1)
console.log('n26 min', f26(-0.5))

function f28(x, a) {
  const c = 4 + 2 * a
  if (x <= 0) return x + 2
  if (x < 2) return x * x + a * x + 2
  return x + c
}
let ok = true
for (const a of [0, 1, 2]) {
  for (let i = 0; i < 800; i++) {
    const x1 = -3 + i * 0.02
    const x2 = x1 + 0.03
    if (!(f28(x1, a) < f28(x2, a) - 1e-12)) {
      ok = false
      console.log('n28 fail', a, x1, x2, f28(x1, a), f28(x2, a))
      break
    }
  }
}
console.log('n28 ok', ok)

// |x-a|+|x|+|x+1| = 2 : geometric length
// distance sum to -1,0,a equals 2
function minSum(a) {
  // minimum of |x+1|+|x|+|x-a| is distance covering [-1,0,a]
  const pts = [-1, 0, a].sort((x, y) => x - y)
  return pts[2] - pts[0] // median minimizes, min value = max-min of the three
}
for (const a of [-3, -1.5, -0.5, 0, 0.5, 1, 2, 4]) {
  console.log('a', a, 'min', minSum(a), 'eq2 feasible', minSum(a) <= 2)
}

// power: for alpha>beta>0, x^alpha < x^beta on (0,1)
console.log('0.25^(2) vs 0.25^(1/2)', 0.25 ** 2, 0.25 ** 0.5)

// piecewise global max for application
function cost(x) {
  // x in [0,10]
  if (x <= 4) return 2 * x + 3
  return x * x - 6 * x + 19
}
let best = Infinity
let bx = null
for (let x = 0; x <= 10; x += 0.01) {
  const v = cost(x)
  if (v < best) {
    best = v
    bx = x
  }
}
console.log('cost min approx', bx, best)

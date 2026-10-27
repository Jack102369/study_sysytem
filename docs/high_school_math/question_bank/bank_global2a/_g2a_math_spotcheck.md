# G2A math spot-check (`_partial_ch01_05` + `_partial_ch06_10`)

Scope: all `qtype=application` and `diagramRequirement=REQUIRED`, plus known rewrite targets. Answers re-derived independently. No merge script; no commit.

## `_partial_ch01_05.json`

| id | result | reason |
|---|---|---|
| CAND-G2A-006 | PASS | 容斥 \|A∪B\|=35；只会一项 23；都不会 5 |
| CAND-G2A-012 | PASS | Δ=0⇒m=25/4；重根 x=5/2 |
| CAND-G2A-013 | PASS | P=20x−200≥300⇒x≥25 |
| CAND-G2A-015 | PASS | S=24x−2x²；顶点 x=6∈(0,12)，S_max=72 |
| CAND-G2A-023 | PASS | f(0)+f(3)=8；分段解 f(t)=7 仅 t=3 |
| CAND-G2A-027 | FIXED | 原周长矩形最大面积与 G1B 低价值重复；改为分段单价预算最多件数（T(8)=400,T(12)=540，最多 11） |
| CAND-G2A-034 | FIXED | 原 stem 与 G1B-036 同为 log₂32；改为 log₃81=4，并更新 analysis/dedup/authorMathNote |
| CAND-G2A-039 | PASS | N=100·1.5^t；与 100·1.5⁴ 相等 ⇒ t=4 |
| CAND-G2A-040 | PASS | L=10 lg(10⁵)=50 |
| CAND-G2A-045 | PASS | REQUIRED；l=rθ=4π；S=½r²θ=12π |
| CAND-G2A-051 | PASS | sinα=4/5；cos2α=2(9/25)−1=−7/25 |
| CAND-G2A-053 | PASS | A=3，T=π；y(0)=−3√3/2 |
| CAND-G2A-055 | PASS | REQUIRED；h−h/√3=20 ⇒ h=10(3+√3) |
| CAND-G2A-058 | PASS | ω=π/2；s(1)=5 |

## `_partial_ch06_10.json`

| id | result | reason |
|---|---|---|
| CAND-G2A-066 | PASS | 数量投影 3；投影向量 (3,0) |
| CAND-G2A-070 | PASS | \|s\|=10；东偏北 arctan(4/3)（或北偏东 arctan(3/4)） |
| CAND-G2A-071 | PASS | 中位线：DE⃗=½BC⃗ |
| CAND-G2A-074 | PASS | (2−i)/(1+i)=1/2−(3/2)i |
| CAND-G2A-081 | PASS | REQUIRED；底 9√3，V=12√3 |
| CAND-G2A-082 | PASS | 72π−36π=36π（球直径 6<柱高 8） |
| CAND-G2A-084 | PASS | REQUIRED；A/B/C 对，D 为异面非相交 |
| CAND-G2A-086 | PASS | REQUIRED；EF⃗=AC⃗ 且线在面外 ⇒ EF∥底面 |
| CAND-G2A-088 | PASS | REQUIRED；点积证 AB₁⊥A₁B、AB₁⊥BC ⇒ 线面垂直 |
| CAND-G2A-089 | PASS | REQUIRED；A/B/D 对面面垂直成立；C 法向量点积≠0 |
| CAND-G2A-093 | PASS | x̄=86；偏差平方和 120，s²=24 |
| CAND-G2A-096 | PASS | C(7,2)=21，异色 12，P=4/7 |
| CAND-G2A-098 | PASS | C(2,1)·0.8·0.2=0.32 |
| CAND-G2A-100 | PASS | 大数思想：频率稳定于概率 0.5 |

## Scan notes (non-target types)

While scanning surrounding single/multi/judge/numeric in both files, no clearly wrong keys found beyond the planned rewrites above. Examples re-checked OK: G2A-016（两正根 k≥2）、G2A-035（log₃18−log₃2=2）、G2A-047（第三象限 tan=3/4）、G2A-075（\|z z̄\|=169）、G2A-097（P(A∪B)=0.72）。

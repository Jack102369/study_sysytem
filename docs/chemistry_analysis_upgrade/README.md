# 旧题解析质量升级（只读）

本目录脚本与产物**默认禁止写库**。

## 脚本

```bash
node docs/chemistry_analysis_upgrade/scan_analysis_574.js
node docs/chemistry_analysis_upgrade/build_and_verify_sample50.js
```

## 产物

- `analysis_audit_574.json` — 574 题扫描
- `sample50_candidates.json` — 50 道候选解析（含原题快照）
- `sample50_quality_results.json` — 逐题评级 + DeepSeek
- `question_risk_list.json` — 风险
- `analysis_upgrade_summary.json` — 汇总

报告：`docs/CHEMISTRY_ANALYSIS_UPGRADE_SAMPLE50_REPORT.md`

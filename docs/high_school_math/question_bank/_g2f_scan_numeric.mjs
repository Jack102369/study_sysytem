import { candidates } from './candidates-g2a-100.mjs';

const RE = /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/;
const bad = candidates.filter(
  (c) => c.qtype === 'numeric' && !RE.test(String(c.answer).trim()),
);
console.log(
  JSON.stringify(
    bad.map((c) => ({ id: c.id, answer: c.answer, stem: c.stem.slice(0, 80) })),
    null,
    2,
  ),
);
console.log('badCount', bad.length);

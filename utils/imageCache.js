
const fsp = require('fs').promises;
const nodePath = require('path');

const cache = new Map();

async function getImageBuffer(src) {
  const key = String(src);
  if (cache.has(key)) return cache.get(key);

  let buf;
  if (key.startsWith('http')) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(key, { signal: ctrl.signal }); // Node 18+
      if (!res.ok) throw new Error('HTTP ' + res.status);
      buf = Buffer.from(await res.arrayBuffer());
    } finally {
      clearTimeout(t);
    }
  } else {
    const abs = nodePath.isAbsolute(key) ? key : nodePath.resolve(process.cwd(), key);
    buf = await fsp.readFile(abs);
  }

  cache.set(key, buf);
  return buf;
}

module.exports = { getImageBuffer };

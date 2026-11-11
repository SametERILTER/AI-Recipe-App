/**
 * Node.js v20.11.x uyumluluk yaması:
 * Node v20.12+ / v22+ ile gelen util.parseEnv, util.styleText, URL.parse,
 * Promise.withResolvers ve Object.groupBy fonksiyonlarını polyfill eder.
 */
const fs = require('fs');
const path = require('path');

const START_MARKER = '/* __NODE20_POLYFILL_START__ */';
const END_MARKER = '/* __NODE20_POLYFILL_END__ */';

const POLYFILL_SNIPPET = `${START_MARKER}
;(function() {
  try {
    if (typeof URL !== 'undefined' && !URL.parse) {
      URL.parse = function parse(url, base) {
        try {
          return base !== undefined ? new URL(url, base) : new URL(url);
        } catch (_) {
          return null;
        }
      };
    }
    if (typeof Promise !== 'undefined' && !Promise.withResolvers) {
      Promise.withResolvers = function withResolvers() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }
    if (!Object.groupBy) {
      Object.groupBy = function groupBy(items, cb) {
        const obj = Object.create(null);
        let i = 0;
        for (const item of items) {
          const key = cb(item, i++);
          if (obj[key] === undefined) obj[key] = [item];
          else obj[key].push(item);
        }
        return obj;
      };
    }
    const util = require('node:util');
    if (!util.parseEnv) {
      util.parseEnv = function parseEnv(contents) {
        const result = {};
        const lines = String(contents || '').replace(/\\r\\n?/g, '\\n').split('\\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^(?:export\\s+)?([\\w.-]+)\\s*=\\s*(.*)?$/);
          if (!match) continue;
          const key = match[1];
          let val = (match[2] || '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          } else {
            const hashIdx = val.indexOf(' #');
            if (hashIdx !== -1) val = val.slice(0, hashIdx).trim();
          }
          result[key] = val;
        }
        return result;
      };
    }
    if (!util.styleText) {
      util.styleText = function styleText(_format, text) {
        return String(text ?? '');
      };
    }
  } catch (_) {}
})();
${END_MARKER}
`;

const targets = [
  'node_modules/expo/bin/cli',
  'node_modules/@expo/cli/build/bin/cli',
  'node_modules/@expo/cli/build/src/start/server/middleware/ExpoMiddleware.js',
  'node_modules/@expo/env/build/parse.js',
  'node_modules/@expo/metro-config/build/transform-worker/transform-worker.js',
  'node_modules/@expo/metro/node_modules/metro/src/lib/TerminalReporter.js',
  'node_modules/@expo/metro/node_modules/metro/src/lib/logToConsole.js',
  'node_modules/@expo/metro/node_modules/metro/src/lib/reporting.js',
  'node_modules/metro/src/lib/TerminalReporter.js',
  'node_modules/metro/src/lib/logToConsole.js',
  'node_modules/metro/src/lib/reporting.js',
];

for (const relPath of targets) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Eski yama varsa temizle
  if (content.includes(START_MARKER) && content.includes(END_MARKER)) {
    const s = content.indexOf(START_MARKER);
    const e = content.indexOf(END_MARKER) + END_MARKER.length;
    content = content.slice(0, s) + content.slice(e).replace(/^\r?\n/, '');
  } else if (content.includes('util.parseEnv = function parseEnv')) {
    content = content.replace(/;\(function\(\) \{\s*try \{\s*const util = require\('node:util'\);[\s\S]*?\}\)\(\);\r?\n?/, '');
  }

  if (content.startsWith('#!')) {
    const firstNewline = content.indexOf('\n');
    content = content.slice(0, firstNewline + 1) + POLYFILL_SNIPPET + content.slice(firstNewline + 1);
  } else {
    content = POLYFILL_SNIPPET + content;
  }
  fs.writeFileSync(fullPath, content, 'utf8');
}

// Reanimated / Worklets eklendikten sonra eski Metro önbelleğinin kullanılmasını engelle
const workerPath = path.join(
  __dirname,
  '..',
  'node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js'
);
if (fs.existsSync(workerPath)) {
  let workerContent = fs.readFileSync(workerPath, 'utf8');
  workerContent = workerContent.replace(
    /const CACHE_VERSION = ['"][^'"]+['"];/,
    "const CACHE_VERSION = '5-worklets';"
  );
  fs.writeFileSync(workerPath, workerContent, 'utf8');
}

const resolveModulePath = path.join(
  __dirname,
  '..',
  'node_modules/babel-preset-expo/build/utils/resolveModule.js'
);
if (fs.existsSync(resolveModulePath)) {
  let rmContent = fs.readFileSync(resolveModulePath, 'utf8');
  rmContent = rmContent.replace(
    '_cache[id] = resolved;',
    'if (resolved != null) _cache[id] = resolved;'
  );
  fs.writeFileSync(resolveModulePath, rmContent, 'utf8');
}


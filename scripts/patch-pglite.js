const fs = require('fs');
const path = require('path');

const pgliteDist = path.join(__dirname, '..', 'node_modules', '@electric-sql', 'pglite', 'dist');

if (!fs.existsSync(pgliteDist)) {
  console.log('PGlite dist directory not found, skipping patch.');
  process.exit(0);
}

function patchFile(relPath, transforms) {
  const filePath = path.join(pgliteDist, relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [from, to] of transforms) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched: ${relPath}`);
  } else {
    console.log(`Already patched or pattern not found: ${relPath}`);
  }
}

function ensureTopImport(relPath, importStatement) {
  const filePath = path.join(pgliteDist, relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(importStatement)) {
    content = importStatement + '\n' + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added top import to: ${relPath}`);
  }
}

// Ensure ESM imports for fileURLToPath
ensureTopImport('chunk-NNS5RQRF.js', 'import { fileURLToPath as __esmToPath } from "node:url";');
ensureTopImport('chunk-DDJLRBDX.js', 'import { fileURLToPath as __esmToPath } from "node:url";');
ensureTopImport('index.js', 'import { fileURLToPath as __esmToPath } from "node:url";');

// 1. Patch chunk-NNS5RQRF.js
patchFile('chunk-NNS5RQRF.js', [
  [
    'require("url").fileURLToPath',
    '__esmToPath'
  ],
  [
    'readFile(e),{module:n,instance:l}=await WebAssembly.instantiate(i,t)',
    'readFile(typeof e==="object"&&e?.href?__esmToPath(e.href):typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e),{module:n,instance:l}=await WebAssembly.instantiate(i,t)'
  ],
  [
    'readFile(t)).buffer',
    'readFile(typeof t==="object"&&t?.href?__esmToPath(t.href):typeof t==="string"&&t.startsWith("file://")?__esmToPath(t):t)).buffer'
  ]
]);

// 2. Patch chunk-DDJLRBDX.js
patchFile('chunk-DDJLRBDX.js', [
  [
    'require("url").fileURLToPath',
    '__esmToPath'
  ],
  [
    'readBinary=e=>{e=isFileURI(e)?new URL(e):e;var r=fs.readFileSync(e);return r}',
    'readBinary=e=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e;var r=fs.readFileSync(e);return r}'
  ],
  [
    'readAsync=async(e,r=!0)=>{e=isFileURI(e)?new URL(e):e;var t=fs.readFileSync(e,r?void 0:"utf8");return t}',
    'readAsync=async(e,r=!0)=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e;var t=fs.readFileSync(e,r?void 0:"utf8");return t}'
  ]
]);

// 3. Patch index.js
patchFile('index.js', [
  [
    'readBinary=e=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?require("url").fileURLToPath(e):e;var t=fs.readFileSync(e);return t}',
    'readBinary=e=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e;var t=fs.readFileSync(e);return t}'
  ],
  [
    'readAsync=async(e,t=!0)=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?require("url").fileURLToPath(e):e;var r=fs.readFileSync(e,t?void 0:"utf8");return r}',
    'readAsync=async(e,t=!0)=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e;var r=fs.readFileSync(e,t?void 0:"utf8");return r}'
  ],
  [
    'readBinary=e=>{e=isFileURI(e)?new URL(e):e;var t=fs.readFileSync(e);return t}',
    'readBinary=e=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e;var t=fs.readFileSync(e);return t}'
  ],
  [
    'readAsync=async(e,t=!0)=>{e=isFileURI(e)?new URL(e):e;var r=fs.readFileSync(e,t?void 0:"utf8");return r}',
    'readAsync=async(e,t=!0)=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?__esmToPath(e):e;var r=fs.readFileSync(e,t?void 0:"utf8");return r}'
  ]
]);

// 4. Patch initdb.js
patchFile('initdb.js', [
  [
    'filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename)',
    'filename=typeof filename==="object"&&filename?.href?filename.href:filename;filename=typeof filename==="string"&&filename.startsWith("file://")?require("url").fileURLToPath(filename):filename;var ret=fs.readFileSync(filename)'
  ],
  [
    'filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8")',
    'filename=typeof filename==="object"&&filename?.href?filename.href:filename;filename=typeof filename==="string"&&filename.startsWith("file://")?require("url").fileURLToPath(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8")'
  ]
]);

// 5. Patch pglite.js
patchFile('pglite.js', [
  [
    'filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename)',
    'filename=typeof filename==="object"&&filename?.href?filename.href:filename;filename=typeof filename==="string"&&filename.startsWith("file://")?require("url").fileURLToPath(filename):filename;var ret=fs.readFileSync(filename)'
  ],
  [
    'filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8")',
    'filename=typeof filename==="object"&&filename?.href?filename.href:filename;filename=typeof filename==="string"&&filename.startsWith("file://")?require("url").fileURLToPath(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8")'
  ]
]);

// 6. Patch index.cjs (CommonJS)
patchFile('index.cjs', [
  [
    'readFile(t),{module:o,instance:s}=await WebAssembly.instantiate(a,e)',
    'readFile(typeof t==="object"&&t?.href?require("url").fileURLToPath(t.href):t.startsWith?.("file://")?require("url").fileURLToPath(t):t),{module:o,instance:s}=await WebAssembly.instantiate(a,e)'
  ],
  [
    'readFile(e)).buffer',
    'readFile(typeof e==="object"&&e?.href?require("url").fileURLToPath(e.href):e.startsWith?.("file://")?require("url").fileURLToPath(e):e)).buffer'
  ],
  [
    'readBinary=e=>{e=isFileURI(e)?new URL(e):e;var t=fs.readFileSync(e);return t}',
    'readBinary=e=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?require("url").fileURLToPath(e):e;var t=fs.readFileSync(e);return t}'
  ],
  [
    'readAsync=async(e,t=!0)=>{e=isFileURI(e)?new URL(e):e;var r=fs.readFileSync(e,t?void 0:"utf8");return r}',
    'readAsync=async(e,t=!0)=>{e=typeof e==="object"&&e?.href?e.href:e;e=typeof e==="string"&&e.startsWith("file://")?require("url").fileURLToPath(e):e;var r=fs.readFileSync(e,t?void 0:"utf8");return r}'
  ]
]);

console.log('PGlite patching complete.');

import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function loadFolderMappingFromJson() {
  const jsonPath = path.resolve(__dirname, 'folder-mapping.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const nameToId = JSON.parse(raw);
  const idToName = Object.fromEntries(Object.entries(nameToId).map(([name, id]) => [Number(id), name]));
  return idToName;
}

function buildPreloadTags(folders, idToName) {
  const unique = Array.from(new Set(folders)).sort((a, b) => a - b);
  return unique.map(f => `    <link rel="preload" as="image" href="/img/${idToName[f] || String(f)}.webp" />`).join('\n');
}

export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
  plugins: [
    {
      name: 'inject-initial-image-preloads',
      transformIndexHtml(html) {
        try {
          const initialDataPath = path.resolve(__dirname, 'public', 'initial-data.json');
          if (!fs.existsSync(initialDataPath)) return html;
          const data = JSON.parse(fs.readFileSync(initialDataPath, 'utf-8'));
          const folders = Object.values(data.songs || {}).map(s => s.folder);
          const idToName = loadFolderMappingFromJson();
          const tags = buildPreloadTags(folders, idToName);
          const insertPos = html.toLowerCase().indexOf('</head>');
          if (insertPos === -1 || !tags) return html;
          return html.slice(0, insertPos) + '\n' + tags + '\n' + html.slice(insertPos);
        } catch (e) {
          return html;
        }
      }
    }
  ]
});
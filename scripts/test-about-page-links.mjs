import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  ['about.html', 'https://xiaoyuanvc.com/about'],
  ['about/index.html', 'https://www.xiaoyuanvc.com/about/'],
];

for (const [file, pageUrl] of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const baseHref = html.match(/<base\b[^>]+href="([^"]+)"/)?.[1];
  const baseUrl = baseHref ? new URL(baseHref, pageUrl) : pageUrl;
  const references = [
    ...html.matchAll(/<(?:link|script|img)\b[^>]+(?:href|src)="([^"]+)"/g),
  ].map((match) => match[1]);

  for (const reference of references) {
    if (/^(?:https?:|data:)/.test(reference)) continue;

    const assetUrl = new URL(reference, baseUrl);
    const assetPath = path.join(root, decodeURIComponent(assetUrl.pathname));
    if (!fs.existsSync(assetPath)) {
      throw new Error(`${file}: ${reference} resolves to missing ${assetUrl.pathname}`);
    }
  }
}

console.log('About page asset links resolve to existing files.');

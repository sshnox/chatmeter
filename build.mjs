import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'manifest.json', 'background.js', 'content.js']) {
  await cp(file, `dist/${file}`);
}
console.log('Built dist/ — load this folder as an unpacked MV3 extension.');

import { mkdir, readdir, copyFile, cp } from 'node:fs/promises';
// Explicit public allowlist: secrets, tests, source, and checkpoints never ship.
await mkdir('dist', { recursive: true });
for (const file of await readdir('.')) {
  if (/\.(html|css|js|png|ico)$/.test(file)) await copyFile(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true });

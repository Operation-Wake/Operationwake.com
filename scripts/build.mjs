import { mkdir, readdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
// Explicit public allowlist: secrets, tests, source, and checkpoints never ship.
await mkdir('dist', { recursive: true });
for (const file of await readdir('.')) {
  if (/\.(html|css|js|png|ico)$/.test(file)) await copyFile(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true });

// Netlify CONTEXT is available at build time; previews never enable live checkout.
if (process.env.CONTEXT === 'production') {
  const config = await readFile('dist/site-config.js', 'utf8');
  await writeFile('dist/site-config.js', config.replace('paymentsLive: false,', 'paymentsLive: true,'));
}

import { fileURLToPath } from 'node:url';
import config from '../astro.config.mjs';
import { startArtifactServer } from './helpers/artifact-server.mjs';

const server = await startArtifactServer(fileURLToPath(new URL('../dist/', import.meta.url)), config.base.replace(/\/$/, '') + '/', Number(process.argv[2] ?? 4327));
console.log('Static GitHub Pages artifact: ' + server.url);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.close(); process.exit(0); });

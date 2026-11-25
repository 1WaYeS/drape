import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createDecartClient } from '@decartai/sdk';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const origin = `http://${host}:${port}`;
const root = resolve('dist');
const model = 'lucy-vton-3.6';
const client = process.env.DECART_API_KEY
  ? createDecartClient({ apiKey: process.env.DECART_API_KEY }) : null;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, origin).pathname);
    if (path === '/api/realtime-token') {
      if (request.method !== 'POST' || request.headers.origin !== origin) {
        return json(response, 403, { error: 'Open the fitting room from its local URL.' });
      }
      if (!client) return json(response, 503, { error: 'Lucy is unconfigured. Your camera is in preview mode.' });
      try {
        const token = await client.tokens.create({
          expiresIn: 60,
          allowedModels: [model],
          allowedOrigins: [origin],
          constraints: { realtime: { maxSessionDuration: 180 } }
        });
        return json(response, 200, { apiKey: token.apiKey });
      } catch {
        return json(response, 502, { error: 'Lucy could not start. Check the Decart credentials and try again.' });
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: 'Method unavailable.' });
    const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(root + sep)) return json(response, 404, { error: 'File unavailable.' });
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) return json(response, 404, { error: 'File unavailable.' });
    const type = mime[extname(file)] || 'application/octet-stream';
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end) {
      response.writeHead(416, { 'Content-Range': `bytes */${info.size}` });
      return response.end();
    }
    const headers = { 'Content-Type': type, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' };
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD') return response.end();
    createReadStream(file, { start, end }).on('error', () => response.destroy()).pipe(response);
  } catch {
    if (response.headersSent) response.destroy();
    else json(response, 400, { error: 'Request unavailable.' });
  }
}).listen(port, host, () => console.log(`Drape preview: ${origin}`));

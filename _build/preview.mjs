// Local preview of published pages and assets. No source or dependency files.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.env.HELP_PREVIEW_PORT || 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('HELP_PREVIEW_PORT must be an integer between 1024 and 65535.');
}
const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const routes = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname));
const rootFiles = new Set(['/sitemap.xml','/robots.txt','/404.html','/favicon.ico','/favicon.svg','/apple-touch-icon.png','/icon-192.png','/icon-512.png','/icon-maskable-512.png','/og-image.png','/og-model.png','/og-partner.png','/site.webmanifest']);
const locales = ['en','es','pt','de','zh','hi','ar'];
for (const locale of locales) for (const file of ['404.html','site.webmanifest']) rootFiles.add(`/${locale}/${file}`);
const mime = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.avif':'image/avif', '.gif':'image/gif',
  '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2',
  '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8',
  '.webmanifest':'application/manifest+json',
};
const assetExtensions = new Set(['.css','.js','.svg','.png','.jpg','.jpeg','.webp','.avif','.gif','.ico','.woff','.woff2']);
const privateSegment = segment => segment.startsWith('.') || segment.startsWith('_') || segment === 'node_modules';

function send(res, status, message, method = 'GET') {
  res.writeHead(status, {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(method === 'HEAD' ? undefined : message);
}

function notFound(res,route,method) {
  const locale = route.split('/')[1];
  const file = path.join(root,locales.includes(locale)?locale:'','404.html');
  if (!fs.existsSync(file)) return send(res,404,'Not found.',method);
  const body = fs.readFileSync(file);
  res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(method==='HEAD'?undefined:body);
}

const server = http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {
    res.setHeader('Allow','GET, HEAD');
    send(res,405,'Method not allowed.',req.method);
    return;
  }
  let route;
  try {
    route = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  } catch {
    send(res,400,'Invalid request path.',req.method);
    return;
  }
  if (route.includes('\\') || route.includes('\0') || route.split('/').some(privateSegment)) {
    send(res,404,'Not found.',req.method);
    return;
  }
  if (!route.endsWith('/') && routes.has(route + '/')) {
    res.writeHead(308,{'Location':route + '/','Cache-Control':'no-store'});
    res.end();
    return;
  }
  const isPage = routes.has(route);
  const isAsset = /^\/(?:assets|img)\//.test(route) && assetExtensions.has(path.extname(route).toLowerCase());
  if (!isPage && !isAsset && !rootFiles.has(route)) {
    notFound(res,route,req.method);
    return;
  }
  try {
    const relative = route.replace(/^\/+/, '') + (isPage ? 'index.html' : '');
    const file = fs.realpathSync(path.resolve(root,relative));
    if (!file.startsWith(root + path.sep) || path.relative(root,file).split(path.sep).some(privateSegment) || !fs.statSync(file).isFile()) {
      send(res,404,'Not found.',req.method);
      return;
    }
    const body = fs.readFileSync(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()] || 'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    send(res,['ENOENT','ENOTDIR'].includes(error.code) ? 404 : 500,'Not found.',req.method);
  }
});

server.on('error', error => {
  console.error(`Preview could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port,'127.0.0.1',() => {
  console.log(`Preview ready: http://127.0.0.1:${port}/help/ (${routes.size} published pages)`);
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,() => server.close(() => process.exit(0)));

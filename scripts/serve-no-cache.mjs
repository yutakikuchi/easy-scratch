import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDirectory = resolve(root, "public");
const requestedPort = Number.parseInt(process.argv[2] ?? "43127", 10);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 43127;
const requestedHost = process.argv[3] ?? "127.0.0.1";
const host = requestedHost === "0.0.0.0" ? "0.0.0.0" : "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function noCacheHeaders(filePath) {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Content-Type": contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    Expires: "0",
    Pragma: "no-cache",
    "Surrogate-Control": "no-store"
  };
}

async function findFile(urlPath) {
  const decodedPath = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const requestedFile = resolve(publicDirectory, decodedPath || "index.html");
  if (requestedFile !== publicDirectory && !requestedFile.startsWith(`${publicDirectory}${sep}`)) return null;

  try {
    const fileStat = await stat(requestedFile);
    if (fileStat.isDirectory()) return resolve(requestedFile, "index.html");
    if (fileStat.isFile()) return requestedFile;
  } catch {
    return resolve(publicDirectory, "index.html");
  }
  return null;
}

const server = createServer(async (request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(405, noCacheHeaders("message.txt"));
    response.end("Method Not Allowed");
    return;
  }

  try {
    const filePath = await findFile(new URL(request.url, "http://127.0.0.1").pathname);
    if (!filePath) {
      response.writeHead(404, noCacheHeaders("message.txt"));
      response.end("Not Found");
      return;
    }
    response.writeHead(200, noCacheHeaders(filePath));
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, noCacheHeaders("message.txt"));
    response.end("Internal Server Error");
    console.error(error);
  }
});

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "<このPCのIPアドレス>" : host;
  console.log(`No-cache server: http://${displayHost}:${port}/`);
});

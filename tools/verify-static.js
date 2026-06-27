const fs = require("fs");
const http = require("http");
const path = require("path");

const root = process.cwd();
const pages = [
  "index.html",
  "notice.html",
  "updates.html",
  "events.html",
  "about.html",
  "shop.html",
  "admin.html",
];

function assertFileExists(file, owner, missing) {
  if (!file) return;
  const target = path.join(root, file);
  if (!fs.existsSync(target)) missing.push(`${owner} -> ${file}`);
}

function verifyReferences() {
  const missing = [];
  for (const page of pages) {
    const text = fs.readFileSync(path.join(root, page), "utf8");
    for (const match of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const ref = match[1];
      if (ref.startsWith("http") || ref.startsWith("#") || ref.startsWith("mailto:")) continue;
      assertFileExists(ref.split(/[?#]/)[0], page, missing);
    }
  }

  for (const file of ["assets/js/data.js", "assets/js/site.js"]) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const match of text.matchAll(/assets\/img\/[^'",)]+/g)) {
      assertFileExists(match[0], file, missing);
    }
  }

  if (missing.length) {
    throw new Error(`Missing references:\n${missing.join("\n")}`);
  }
  console.log("REFERENCES_OK");
}

function contentType(file) {
  const ext = path.extname(file);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const target = path.join(root, url.pathname === "/" ? "index.html" : url.pathname);
    if (!target.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(target, (error, data) => {
      if (error) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(target) });
      res.end(data);
    });
  });
}

async function verifyServer() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  let failed = false;

  try {
    for (const page of pages) {
      const res = await fetch(`http://127.0.0.1:${port}/${page}`);
      console.log(`/${page} ${res.status}`);
      if (res.status !== 200) failed = true;
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  if (failed) throw new Error("One or more pages did not return HTTP 200.");
}

async function main() {
  verifyReferences();
  await verifyServer();
  console.log("STATIC_VERIFY_OK");
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});

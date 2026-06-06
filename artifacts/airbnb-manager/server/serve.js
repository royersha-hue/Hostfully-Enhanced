/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const ASSETS_ROOT = path.resolve(__dirname, "assets");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

/**
 * Returns true only if `host` is a safe hostname[:port] string that can be
 * embedded into HTML attributes and JS string literals without escaping.
 * Rejects anything containing characters that could break out of those
 * contexts (quotes, angle brackets, semicolons, spaces, etc.).
 */
function isValidHost(host) {
  if (!host || typeof host !== "string") return false;
  // Allow: letters, digits, hyphens, dots, and an optional :port suffix.
  // Explicitly rejects brackets, quotes, semicolons, slashes, and whitespace.
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]*(:\d{1,5})?$/.test(host);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  // Never trust X-Forwarded-Host — it is fully attacker-controlled and was
  // previously reflected verbatim into HTML/JS (XSS / deep-link poisoning).
  // Use only the Host header, validated against a strict allow-list pattern.
  const rawHost = req.headers["host"];
  const host = isValidHost(rawHost) ? rawHost : "localhost";

  const baseUrl = `https://${host}`;
  const expsUrl = host;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function getCanonicalBase(req) {
  const rawHost = req.headers["host"];
  const host = isValidHost(rawHost) ? rawHost : "localhost";
  return `https://${host}`;
}

function serveRobotsTxt(req, res) {
  const base = getCanonicalBase(req);
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

function serveSitemapXml(req, res) {
  const base = getCanonicalBase(req);
  const today = new Date().toISOString().slice(0, 10);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${base}/</loc>`,
    `    <lastmod>${today}</lastmod>`,
    "    <changefreq>monthly</changefreq>",
    "    <priority>1.0</priority>",
    "  </url>",
    "</urlset>",
    "",
  ].join("\n");
  res.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
  res.end(body);
}

function serveLlmsTxt(req, res) {
  const base = getCanonicalBase(req);
  const body = [
    "# StayFlow",
    "",
    "> StayFlow is a mobile app for Airbnb and short-term rental hosts.",
    "",
    "StayFlow helps property managers track bookings, communicate with guests,",
    "view analytics, and manage their rental portfolio from a single dashboard.",
    "",
    "## Key capabilities",
    "",
    "- Dashboard with revenue overview and upcoming stays",
    "- Guest messaging with quick-reply templates",
    "- Monthly booking calendar",
    "- Guest CRM with stay history",
    "- Revenue and platform analytics",
    "",
    "## Links",
    "",
    `- Home: ${base}/`,
    "",
  ].join("\n");
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

function serveServerAsset(assetName, res) {
  const safeName = path.basename(assetName);
  const filePath = path.join(ASSETS_ROOT, safeName);

  if (!filePath.startsWith(ASSETS_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const appName = getAppName();

const server = http.createServer((req, res) => {
  // Guard against malformed Host headers: new URL() throws TypeError for
  // invalid bases (e.g. Host: "["), which previously crashed the process.
  let url;
  try {
    url = new URL(req.url || "/", `http://${req.headers.host}`);
  } catch {
    res.writeHead(400, { "content-type": "text/plain" });
    res.end("Bad Request");
    return;
  }
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (pathname === "/robots.txt") {
    return serveRobotsTxt(req, res);
  }

  if (pathname === "/sitemap.xml") {
    return serveSitemapXml(req, res);
  }

  if (pathname === "/llms.txt") {
    return serveLlmsTxt(req, res);
  }

  if (pathname === "/og-image.svg") {
    return serveServerAsset("og-image.svg", res);
  }

  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }

    if (pathname === "/") {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving static Expo build on port ${port}`);
});

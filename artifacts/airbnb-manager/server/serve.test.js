/**
 * Regression tests for the two header-validation vulnerabilities fixed in serve.js:
 *
 *  1. Malformed Host header must return 400 and leave the server running.
 *  2. X-Forwarded-Host (and hostile Host values) must not appear in landing-page HTML.
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");

const SERVE_JS = path.resolve(__dirname, "serve.js");
const TEST_PORT = 19876;

let serverProcess;

/**
 * Sends a raw HTTP/1.1 request to the test server and resolves with
 * `{ statusCode, headers, body }`.
 */
function request({ method = "GET", path: urlPath = "/", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: TEST_PORT, path: urlPath, method },
      (res) => {
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({ statusCode: res.statusCode, headers: res.headers, body }),
        );
      },
    );
    for (const [k, v] of Object.entries(headers)) req.setHeader(k, v);
    req.on("error", reject);
    req.end();
  });
}

/** Wait until the server is accepting connections (or throw after timeout). */
function waitForServer(port, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt() {
      const probe = http.request({ hostname: "127.0.0.1", port, path: "/" });
      probe.on("response", () => {
        probe.destroy();
        resolve();
      });
      probe.on("error", () => {
        if (Date.now() >= deadline) return reject(new Error("Server did not start in time"));
        setTimeout(attempt, 80);
      });
      probe.end();
    }
    attempt();
  });
}

before(async () => {
  serverProcess = spawn(process.execPath, [SERVE_JS], {
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: "pipe",
  });

  serverProcess.on("error", (err) => {
    throw new Error(`Failed to spawn server: ${err.message}`);
  });

  await waitForServer(TEST_PORT);
});

after(() => {
  if (serverProcess) serverProcess.kill("SIGTERM");
});

describe("Malformed Host header (DoS fix)", () => {
  test("returns 400 for Host: [ (bracket — invalid URL base)", async () => {
    const { statusCode } = await request({ headers: { host: "[" } });
    assert.equal(statusCode, 400, "Expected 400 Bad Request for invalid Host");
  });

  test("returns 400 for Host with embedded spaces", async () => {
    const { statusCode } = await request({ headers: { host: "evil host" } });
    assert.equal(statusCode, 400);
  });

  test("server stays alive and serves normal requests after malformed Host", async () => {
    await request({ headers: { host: "[" } });
    const { statusCode } = await request({ headers: { host: `127.0.0.1:${TEST_PORT}` } });
    assert.equal(statusCode, 200, "Server should still be alive after malformed request");
  });
});

describe("X-Forwarded-Host / host injection (XSS fix)", () => {
  const XSS_HOST = 'evil.com";alert(1);//';
  const REDIRECT_HOST = "attacker.example";

  test("X-Forwarded-Host XSS payload is not reflected in landing-page HTML", async () => {
    const { body } = await request({
      headers: {
        host: `127.0.0.1:${TEST_PORT}`,
        "x-forwarded-host": XSS_HOST,
      },
    });
    assert.ok(
      !body.includes(XSS_HOST),
      `XSS payload "${XSS_HOST}" must not appear in HTML response`,
    );
    assert.ok(!body.includes("alert(1)"), "alert(1) payload must not appear in HTML");
  });

  test("X-Forwarded-Host redirect host is not reflected in landing-page HTML", async () => {
    const { body } = await request({
      headers: {
        host: `127.0.0.1:${TEST_PORT}`,
        "x-forwarded-host": REDIRECT_HOST,
      },
    });
    assert.ok(
      !body.includes(REDIRECT_HOST),
      `Attacker host "${REDIRECT_HOST}" from X-Forwarded-Host must not appear in HTML`,
    );
  });

  test("Hostile Host value (with quotes) is not reflected in landing-page HTML", async () => {
    const hostileHost = `evil.com"onload="alert(1)`;
    const { statusCode, body } = await request({
      headers: { host: hostileHost },
    });
    assert.ok(
      statusCode === 400 || !body.includes(hostileHost),
      "Hostile Host must either be rejected (400) or not reflected in HTML",
    );
    assert.ok(!body.includes("alert(1)"), "alert(1) must not appear in HTML");
  });

  test("Valid Host is used as the deep-link base in landing-page HTML", async () => {
    const { body } = await request({
      headers: { host: `127.0.0.1:${TEST_PORT}` },
    });
    assert.ok(
      body.includes(`exps://127.0.0.1:${TEST_PORT}`),
      "Valid Host should appear as the exps:// deep-link base",
    );
  });

  test("Invalid Host falls back to localhost in landing-page HTML", async () => {
    const { body, statusCode } = await request({
      headers: { host: "not a valid host!" },
    });
    if (statusCode === 200) {
      assert.ok(
        body.includes("exps://localhost"),
        "Invalid Host should fall back to localhost in deep link",
      );
    } else {
      assert.equal(statusCode, 400);
    }
  });
});

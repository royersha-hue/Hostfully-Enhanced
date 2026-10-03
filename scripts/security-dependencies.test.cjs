const test = require("node:test");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { generateKeyPairSync } = require("node:crypto");

// Resolve the actual Expo dependency graph, not an unused copy in pnpm's store.
const app = createRequire(resolve(__dirname, "../artifacts/airbnb-manager/package.json"));
const cli = createRequire(app.resolve("@expo/cli/package.json"));
const metroParent = createRequire(cli.resolve("@expo/metro/package.json"));
const metro = createRequire(metroParent.resolve("metro/package.json"));
const fileMap = createRequire(metro.resolve("metro-file-map/package.json"));
const micromatch = createRequire(fileMap.resolve("micromatch/package.json"));
const braces = micromatch("braces");
const forge = cli("node-forge");

test("ordinary brace expansion, compilation and stringification remain compatible", () => {
  assert.deepEqual(braces.expand("a/{b,c}/{1..3}"), [
    "a/b/1", "a/b/2", "a/b/3", "a/c/1", "a/c/2", "a/c/3",
  ]);
  const ast = braces.parse("a/{b,c}");
  assert.equal(braces.stringify(ast), "a/{b,c}");
  assert.equal(braces.compile(ast), "a/(b|c)");
});

test("deep brace and parenthesis input is rejected before recursive walkers", () => {
  for (const [open, close] of [["{", "}"], ["(", ")"]]) {
    // Stay below the pre-existing 10,000-character limit to exercise the new guard.
    const malicious = open.repeat(4000) + "a,b" + close.repeat(4000);
    for (const operation of [braces.parse, braces.compile, braces.expand]) {
      assert.throws(() => operation(malicious), /safe nesting limit/);
    }
  }
});

test("direct deeply nested and cyclic AST inputs are rejected", () => {
  let ast = { type: "text", value: "ok" };
  for (let i = 0; i < 10000; i++) ast = { type: "root", nodes: [ast] };
  const cyclic = { type: "root", nodes: [] };
  cyclic.nodes.push(cyclic);
  for (const operation of [braces.compile, braces.expand, braces.stringify]) {
    assert.throws(() => operation(ast), /safe AST limits/);
    assert.throws(() => operation(cyclic), /safe AST limits/);
  }
});

const pem = generateKeyPairSync("rsa", {
  modulusLength: 1024,
  publicExponent: 3,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
});
const privateKey = forge.pki.privateKeyFromPem(pem.privateKey);
const publicKey = forge.pki.publicKeyFromPem(pem.publicKey);
const md = forge.md.sha256.create().update("security regression test");
const digest = md.digest().getBytes();
const { asn1 } = forge;
const universal = (type, constructed, value) =>
  asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);

function signDigestInfo(withNull, extra) {
  const algorithm = [universal(asn1.Type.OID, false, asn1.oidToDer(forge.oids.sha256).getBytes())];
  if (withNull) algorithm.push(universal(asn1.Type.NULL, false, ""));
  if (extra) algorithm.push(extra);
  const info = universal(asn1.Type.SEQUENCE, true, [
    universal(asn1.Type.SEQUENCE, true, algorithm),
    universal(asn1.Type.OCTETSTRING, false, digest),
  ]);
  return privateKey.sign(asn1.toDer(info).getBytes(), "NONE");
}

test("valid PKCS1 signatures with optional SHA256 NULL parameters still verify", () => {
  assert.equal(publicKey.verify(digest, privateKey.sign(md)), true);
  assert.equal(publicKey.verify(digest, signDigestInfo(true)), true);
  assert.equal(publicKey.verify(digest, signDigestInfo(false)), true);
});

test("PKCS1 DigestAlgorithm rejects extra elements with and without NULL parameters", () => {
  for (const withNull of [true, false]) {
    for (const extra of [
      ...(withNull ? [universal(asn1.Type.NULL, false, "")] : []),
      universal(asn1.Type.OCTETSTRING, false, "garbage"),
      universal(asn1.Type.SEQUENCE, true, []),
    ]) {
      assert.throws(
        () => publicKey.verify(digest, signDigestInfo(withNull, extra)),
        /valid RSASSA-PKCS1-v1_5 DigestInfo/,
      );
    }
  }
});

test("Metro image-size default export still handles PNG buffers after the upgrade", () => {
  const imported = metro("image-size");
  const imageSize = imported.__esModule ? imported.default : imported;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXv8AAAAASUVORK5CYII=",
    "base64",
  );
  assert.equal(imageSize(png).width, 1);
  assert.equal(imageSize(png).height, 1);
});
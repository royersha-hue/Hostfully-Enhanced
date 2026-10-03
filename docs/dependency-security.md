# Dependency security maintenance

Run `pnpm run test:dependency-security` and `pnpm audit` after dependency changes.
Use the full workspace `pnpm run typecheck`, and regenerate the API client with
`pnpm --filter @workspace/api-spec run codegen` when updating Orval.

## Local patches pending upstream releases

Two installed package versions are still reported by version-based dependency
audits. Do not suppress these findings or describe the raw audit as clean:

- **node-forge 1.4.0 — GHSA-86w9-cpqp-85rv:** The pnpm patch validates the
  DigestAlgorithm sequence's exact element count, accounting for optional NULL
  parameters. Regression tests cover valid signatures and reject extra NULL,
  octet-string and sequence elements.
- **braces 3.0.3 — GHSA-vfj7-8cjw-p6xm:** The pnpm patch rejects parser nesting
  over 128 levels and iteratively validates ASTs before recursive compilation,
  expansion and stringification. AST depth, cycles and excessive node counts
  are rejected. Tests include inputs below the existing character limit and
  direct AST entry points, plus ordinary expansion compatibility.

These are targeted local mitigations, not upstream-certified fixes or proof
that these packages have no other vulnerabilities. Keep the patch files and
`patchedDependencies` mappings until upstream releases address the advisories;
then replace the packages with patched releases and rerun the regression tests.
The tests resolve the actual Expo dependency graph to detect unapplied patches.

The unused `@expo/ngrok` dependency was removed rather than retaining vulnerable
`http-cache-semantics`. This project uses Expo's localhost server with Replit's
managed preview proxy; Expo's optional `--tunnel` mode is not configured.

SDK 54's pinned CLI/Metro dependencies prevent wholesale parent upgrades.
Compatible transitive overrides retain their API majors where possible.
`image-size` moves to the patched 2.x line; its default-export and PNG-buffer
compatibility with Metro is covered by regression tests. Metro's two SDK-pinned
versions are patched to read image files into buffers before calling image-size;
the 2.x release no longer accepts filesystem path strings.

Orval's React Query output explicitly targets v5 so code generation remains
compatible with the workspace's React Query version.
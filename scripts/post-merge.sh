#!/bin/bash
set -e
# Task merges may update workspace overrides without regenerating the lockfile.
# Reconcile it non-interactively before running the remaining setup.
pnpm install --no-frozen-lockfile
pnpm --filter db push

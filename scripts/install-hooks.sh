#!/bin/sh
# Install repo git hooks into .git/hooks (run once after cloning).
ROOT="$(git rev-parse --show-toplevel)"
ln -sf ../../scripts/git-hooks/pre-commit "$ROOT/.git/hooks/pre-commit"
echo "Installed pre-commit hook -> scripts/git-hooks/pre-commit"

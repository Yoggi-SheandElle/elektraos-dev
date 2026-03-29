#!/bin/bash
# Encrypt all protected pages with StatiCrypt
# Usage: bash scripts/encrypt.sh
# Passwords: mercy2026, aylamanage2026, mealshift2026

set -e
cd "$(dirname "$0")/.."

echo "Encrypting protected pages..."

staticrypt case/_src/index.html -p mercy2026 -o case/index.html --short
echo "  [OK] case/ (Mercy)"

staticrypt casestudy/ayla/manage/_src/index.html -p aylamanage2026 -o casestudy/ayla/manage/index.html --short
echo "  [OK] casestudy/ayla/manage/ (Aya)"

staticrypt casestudy/mealshift/_src/index.html -p mealshift2026 -o casestudy/mealshift/index.html --short
echo "  [OK] casestudy/mealshift/ (Said)"

staticrypt casestudy/mealshift/docs/_src/index.html -p mealshift2026 -o casestudy/mealshift/docs/index.html --short
echo "  [OK] casestudy/mealshift/docs/ (Said)"

echo ""
echo "All 4 pages encrypted with StatiCrypt."
echo ""
echo "Shareable links (auto-decrypt):"
echo "  Mercy:    https://elektraos.dev/case/#staticrypt_pwd=mercy2026"
echo "  Aya:      https://elektraos.dev/casestudy/ayla/manage/#staticrypt_pwd=aylamanage2026"
echo "  MealShift: https://elektraos.dev/casestudy/mealshift/#staticrypt_pwd=mealshift2026"
echo "  MS Docs:   https://elektraos.dev/casestudy/mealshift/docs/#staticrypt_pwd=mealshift2026"

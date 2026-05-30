#!/bin/bash
# Encrypt all protected pages with StatiCrypt
# Usage: bash scripts/encrypt.sh
# Passwords: mercy2026, izraa2026, aylamanage2026, mealshift2026
# Note: staticrypt v3.5+ uses -d for output directory; input filename is preserved.

cd "$(dirname "$0")/.."

echo "Encrypting protected pages..."

# Each block: skip if source missing (some _src/ are gitignored on shared machines)

encrypt() {
  local src="$1" pass="$2" outdir="$3" label="$4"
  if [ ! -f "$src" ]; then
    echo "  [SKIP] $label - source missing: $src"
    return 0
  fi
  staticrypt "$src" -p "$pass" -d "$outdir" --short >/dev/null
  echo "  [OK] $label"
}

encrypt case/_src/index.html               mercy2026       case/               "case/ (Global Creative Network / Mercy landing)"
encrypt case/izraa-baraa/_src/index.html   izraa2026       case/izraa-baraa/   "case/izraa-baraa/ (Izraa)"
encrypt casestudy/ayla/manage/_src/index.html  aylamanage2026  casestudy/ayla/manage/  "casestudy/ayla/manage/ (Aya)"
encrypt casestudy/mealshift/_src/index.html    mealshift2026   casestudy/mealshift/    "casestudy/mealshift/ (Said)"
encrypt casestudy/mealshift/docs/_src/index.html mealshift2026 casestudy/mealshift/docs/ "casestudy/mealshift/docs/ (Said)"

echo ""
echo "Encryption complete."
echo ""
echo "Shareable links (auto-decrypt):"
echo "  Mercy (GCN):  https://elektraos.dev/case/#staticrypt_pwd=mercy2026"
echo "  Izraa:        https://elektraos.dev/case/izraa-baraa/#staticrypt_pwd=izraa2026"
echo "  Aya:       https://elektraos.dev/casestudy/ayla/manage/#staticrypt_pwd=aylamanage2026"
echo "  MealShift: https://elektraos.dev/casestudy/mealshift/#staticrypt_pwd=mealshift2026"
echo "  MS Docs:   https://elektraos.dev/casestudy/mealshift/docs/#staticrypt_pwd=mealshift2026"

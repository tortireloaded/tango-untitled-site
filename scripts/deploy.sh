#!/usr/bin/env bash
# Cloudflare Pages direct upload deploy — no GitHub required.
# Usage: CF_API_TOKEN=xxxxx CF_ACCOUNT_ID=xxxxxxxx ./deploy.sh
#
# The API token needs "Cloudflare Pages: Edit" permission for your account.
# Create one at:  https://dash.cloudflare.com/profile/api-tokens
# Use "Edit Cloudflare Pages" template.

set -euo pipefail

PROJECT="tango-untitled"
BUILD_DIR="dist"

if [[ -z "${CF_API_TOKEN:-}" || -z "${CF_ACCOUNT_ID:-}" ]]; then
  echo "❌ Missing env vars."
  echo "  CF_API_TOKEN — Cloudflare API token with Pages:Edit perm"
  echo "  CF_ACCOUNT_ID — your account ID (top-right of Cloudflare dashboard)"
  echo ""
  echo "Example:"
  echo "  CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx ./deploy.sh"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "📦  Building…"
bun run build

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "❌ Build did not produce $BUILD_DIR/"
  exit 1
fi

echo "🆙  Creating Pages deployment…"

# Create a new deployment (returns a URL we upload to)
DEPLOY_RESPONSE=$(curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT}/deployments" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"deployment_trigger": {"type": "api"}}')
echo "$DEPLOY_RESPONSE" > /tmp/cf-deploy.json

DEPLOY_URL=$(echo "$DEPLOY_RESPONSE" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('result', {}).get('upload_url', ''))")

if [[ -z "$DEPLOY_URL" ]]; then
  echo "❌ Failed to create deployment:"
  cat /tmp/cf-deploy.json
  exit 1
fi
echo "    upload URL: ${DEPLOY_URL:0:80}…"

# Bundle the entire dist/ tree for upload.
# Cloudflare Pages accepts a single .tar or a directory via the upload-from-directory flag.
echo "📤  Uploading assets…"

# Approach: bundle directory into a hash-streamed manifest using wrangler
# (it knows the protocol).
./node_modules/.bin/wrangler pages deploy "$BUILD_DIR" \
  --project-name "$PROJECT" \
  --commit-dirty=true \
  --branch=main \
  --verbose 2>&1 | tail -30

echo ""
echo "✅  Done. Site URL:  https://${PROJECT}.pages.dev"
echo "    Custom domain:  configure at https://dash.cloudflare.com → Pages → ${PROJECT} → Custom domains"

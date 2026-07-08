#!/usr/bin/env bash
set -euo pipefail

VERSION="1.43.6"
ARCH="$(uname -m)"
case "$ARCH" in
  arm64) STRIPE_ARCH="arm64" ;;
  x86_64) STRIPE_ARCH="x86_64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "$INSTALL_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

URL="https://github.com/stripe/stripe-cli/releases/download/v${VERSION}/stripe_${VERSION}_mac-os_${STRIPE_ARCH}.tar.gz"

echo "Downloading Stripe CLI v${VERSION} (${STRIPE_ARCH})..."
curl -fsSL "$URL" -o "${TMP_DIR}/stripe-cli.tar.gz"
tar -xzf "${TMP_DIR}/stripe-cli.tar.gz" -C "$TMP_DIR" stripe
install -m 755 "${TMP_DIR}/stripe" "${INSTALL_DIR}/stripe"

echo "Installed: ${INSTALL_DIR}/stripe"
"${INSTALL_DIR}/stripe" --version
echo
echo "Add to your shell profile if needed:"
echo '  export PATH="$HOME/.local/bin:$PATH"'

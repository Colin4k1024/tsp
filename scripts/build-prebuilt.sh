#!/usr/bin/env bash
# scripts/build-prebuilt.sh
#
# Build oris-claude-bridge for all supported platforms and stage the binaries
# into bin/prebuilt/{platform}/.
#
# Usage:
#   ./scripts/build-prebuilt.sh             # build all platforms
#   ./scripts/build-prebuilt.sh darwin-arm64 darwin-x64   # build specific platforms
#
# Requirements:
#   - Rust/cargo (stable)  — https://rustup.rs
#   - cross (for Linux musl targets): cargo install cross --locked
#   - Docker (required by cross for Linux targets)
#
# Supported platform keys  →  Rust triple
#   darwin-arm64  →  aarch64-apple-darwin
#   darwin-x64    →  x86_64-apple-darwin
#   linux-x64     →  x86_64-unknown-linux-musl
#   linux-arm64   →  aarch64-unknown-linux-musl
#   win32-x64     →  x86_64-pc-windows-msvc  (native Windows only)

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CRATE_DIR="${REPO_ROOT}/crates/oris-claude-bridge"
PREBUILT_DIR="${REPO_ROOT}/bin/prebuilt"

# ── Colours ───────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[build-prebuilt]${RESET} $*"; }
success() { echo -e "${GREEN}[build-prebuilt] ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}[build-prebuilt] ⚠${RESET} $*"; }
error()   { echo -e "${RED}[build-prebuilt] ✗${RESET} $*" >&2; }

# ── Platform mapping helpers ──────────────────────────────────────────────────

platform_triple() {
  case "$1" in
    darwin-arm64) echo "aarch64-apple-darwin" ;;
    darwin-x64) echo "x86_64-apple-darwin" ;;
    linux-x64) echo "x86_64-unknown-linux-musl" ;;
    linux-arm64) echo "aarch64-unknown-linux-musl" ;;
    win32-x64) echo "x86_64-pc-windows-msvc" ;;
    *) return 1 ;;
  esac
}

platform_use_cross() {
  case "$1" in
    linux-x64|linux-arm64) echo "true" ;;
    darwin-arm64|darwin-x64|win32-x64) echo "false" ;;
    *) return 1 ;;
  esac
}

platform_binary_name() {
  case "$1" in
    win32-x64) echo "oris-claude-bridge.exe" ;;
    darwin-arm64|darwin-x64|linux-x64|linux-arm64) echo "oris-claude-bridge" ;;
    *) return 1 ;;
  esac
}

is_valid_platform() {
  case "$1" in
    darwin-arm64|darwin-x64|linux-x64|linux-arm64|win32-x64) return 0 ;;
    *) return 1 ;;
  esac
}

# ── Helpers ───────────────────────────────────────────────────────────────────

has_cmd() { command -v "$1" &>/dev/null; }

require_cargo() {
  if ! has_cmd cargo; then
    error "cargo not found. Install Rust from https://rustup.rs"
    exit 1
  fi
}

require_docker() {
  if ! has_cmd docker; then
    error "Docker is required for Linux musl targets. Install Docker and retry."
    exit 1
  fi
  if ! docker info &>/dev/null; then
    error "Docker daemon is not running. Start Docker Desktop and retry."
    exit 1
  fi
}

build_platform() {
  local platform="$1"
  local triple
  local use_cross
  local bin_name

  triple="$(platform_triple "${platform}")" || {
    error "Unknown platform '${platform}'"
    return 1
  }
  use_cross="$(platform_use_cross "${platform}")" || {
    error "Unknown platform '${platform}'"
    return 1
  }
  bin_name="$(platform_binary_name "${platform}")" || {
    error "Unknown platform '${platform}'"
    return 1
  }

  info "Building ${platform} (${triple})..."

  # Add rustup target (no-op if already present)
  if [[ "${use_cross}" == "false" ]]; then
    rustup target add "${triple}" 2>/dev/null || true
  fi

  # Build
  if [[ "${use_cross}" == "true" ]]; then
    require_docker
    # Linux musl: use messense/rust-musl-cross Docker images (works on macOS ARM)
    # openssl vendored feature in Cargo.toml ensures static OpenSSL compilation
    local docker_image
    case "${platform}" in
      linux-x64)   docker_image="messense/rust-musl-cross:x86_64-musl" ;;
      linux-arm64) docker_image="messense/rust-musl-cross:aarch64-musl" ;;
      *) error "No Docker image configured for ${platform}"; return 1 ;;
    esac
    docker run --rm \
      -v "${CRATE_DIR}":/home/rust/src \
      -v "${HOME}/.cargo/registry":/root/.cargo/registry \
      -v "${HOME}/.cargo/git":/root/.cargo/git \
      -e LIBSQLITE3_SYS_USE_PKG_CONFIG=0 \
      -e SQLITE3_STATIC=1 \
      "${docker_image}" \
      cargo build --release
  else
    (
      cd "${CRATE_DIR}"
      cargo build --release --target "${triple}"
    )
  fi

  # Stage binary
  local src="${CRATE_DIR}/target/${triple}/release/${bin_name}"
  local dest_dir="${PREBUILT_DIR}/${platform}"
  local dest="${dest_dir}/${bin_name}"

  if [[ ! -f "${src}" ]]; then
    error "Expected binary not found: ${src}"
    return 1
  fi

  mkdir -p "${dest_dir}"
  cp "${src}" "${dest}"
  if [[ "${bin_name}" != *.exe ]]; then
    chmod 755 "${dest}"
  fi

  success "Staged → ${dest}"
}

# ── Main ──────────────────────────────────────────────────────────────────────

main() {
  require_cargo

  # Determine which platforms to build
  local platforms=()
  if [[ $# -gt 0 ]]; then
    platforms=("$@")
  else
    platforms=("darwin-arm64" "darwin-x64" "linux-x64" "linux-arm64" "win32-x64")
  fi

  # Validate platform keys
  for p in "${platforms[@]}"; do
    if ! is_valid_platform "${p}"; then
      error "Unknown platform '${p}'. Valid keys: darwin-arm64 darwin-x64 linux-x64 linux-arm64 win32-x64"
      exit 1
    fi
  done

  # Warn about win32-x64 on non-Windows
  local current_os
  current_os="$(uname -s)"
  for p in "${platforms[@]}"; do
    if [[ "${p}" == "win32-x64" && "${current_os}" != "MINGW"* && "${current_os}" != "MSYS"* ]]; then
      warn "win32-x64 requires a native Windows / MSVC toolchain."
      warn "Skipping win32-x64 on ${current_os}."
      platforms=("${platforms[@]/win32-x64}")
    fi
  done

  # Build
  local failed=()
  for p in "${platforms[@]}"; do
    [[ -z "${p}" ]] && continue  # skip empty entries after removal above
    if build_platform "${p}"; then
      : # success logged inside build_platform
    else
      failed+=("${p}")
    fi
  done

  # Summary
  echo ""
  info "── Summary ──────────────────────────────────────────────"
  for p in "${platforms[@]}"; do
    [[ -z "${p}" ]] && continue
    bin_name="$(platform_binary_name "${p}")"
    dest="${PREBUILT_DIR}/${p}/${bin_name}"
    if [[ -f "${dest}" ]]; then
      size=$(du -sh "${dest}" 2>/dev/null | cut -f1)
      success "${p}/${bin_name}  (${size})"
    else
      error "${p}/${bin_name}  — MISSING"
    fi
  done

  if [[ ${#failed[@]} -gt 0 ]]; then
    echo ""
    warn "Failed platforms: ${failed[*]}"
    warn "Run with RUST_BACKTRACE=1 for details."
    exit 1
  fi

  echo ""
  success "All done. Binaries in ${PREBUILT_DIR}/"
  echo ""
  info "Next steps:"
  info "  git add bin/prebuilt/"
  info "  git commit -m 'chore: update prebuilt oris-claude-bridge binaries'"
}

main "$@"

#!/usr/bin/env bash
set -euo pipefail

PROG="$(basename "$0")"

usage() {
  cat <<EOF
Usage: $PROG [--check|--build|--full|--help]

Modes:
  --check   (default) verify required CLI tools are installed
  --build   run 'mops build' and build the frontend (src/frontend)
  --full    run --check, then --build, then tests
EOF
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

check_tools() {
  local missing=()
  local tools=(node pnpm icp mops ic-wasm)
  for t in "${tools[@]}"; do
    if ! require_cmd "$t"; then
      missing+=("$t")
    fi
  done

  if [ "${#missing[@]}" -ne 0 ]; then
    echo "ERROR: Missing required tools: ${missing[*]}"
    return 1
  fi

  echo "OK: All required tools are available."
  return 0
}

build_all() {
  echo "==> Running 'mops build'..."
  if ! command -v mops >/dev/null 2>&1; then
    echo "ERROR: 'mops' not found in PATH."
    return 2
  fi
  mops build

  echo "==> Building frontend (src/frontend)..."
  if [ ! -d "src/frontend" ]; then
    echo "ERROR: src/frontend not found."
    return 3
  fi

  pushd src/frontend >/dev/null
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile || pnpm install
    pnpm run build
  elif command -v npm >/dev/null 2>&1; then
    npm install
    npm run build
  else
    echo "ERROR: neither pnpm nor npm is available to build the frontend."
    popd >/dev/null
    return 4
  fi
  popd >/dev/null

  echo "OK: Build finished."
  return 0
}

run_tests() {
  echo "==> Running tests..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm test --if-present || true
  elif command -v npm >/dev/null 2>&1; then
    npm test --if-present || true
  else
    echo "WARN: No pnpm/npm found to run tests."
  fi
  echo "Tests completed (exit status ignored here)."
}

# Default mode
MODE="check"

if [ $# -gt 0 ]; then
  case "$1" in
    --check) MODE="check" ;;
    --build) MODE="build" ;;
    --full)  MODE="full" ;;
    --help|-h) usage; exit 0 ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
fi

case "$MODE" in
  check)
    check_tools
    exit $?
    ;;
  build)
    build_all
    exit $?
    ;;
  full)
    check_tools
    check_status=$?
    if [ $check_status -ne 0 ]; then
      echo "Aborting full run due to missing tools."
      exit $check_status
    fi
    build_all
    build_status=$?
    if [ $build_status -ne 0 ]; then
      echo "Build failed."
      exit $build_status
    fi
    run_tests
    exit 0
    ;;
esac

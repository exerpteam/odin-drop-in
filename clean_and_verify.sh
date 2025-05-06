#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🧹 Starting clean process..."

# Navigate to the monorepo root (assuming the script is run from the root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
if [ "$PWD" != "$SCRIPT_DIR" ]; then
  echo "Please run this script from the monorepo root directory."
  exit 1
fi

# 1. Delete global generated files/folders
echo "🗑️ Removing root .turbo and node_modules..."
rm -rf .turbo
rm -rf node_modules

# 2. Delete package-specific generated files/folders

# Packages
for pkg_path in packages/*; do
  if [ -d "$pkg_path" ]; then
    pkg_name=$(basename "$pkg_path")
    echo "🗑️ Removing generated files from packages/$pkg_name..."
    rm -rf "$pkg_path/node_modules"
    rm -rf "$pkg_path/dist"
    rm -rf "$pkg_path/.turbo"

    # Specific to 'core' package
    if [ "$pkg_name" == "core" ]; then
      rm -rf "$pkg_path/loader"
      rm -rf "$pkg_path/www"
      rm -rf "$pkg_path/.stencil"
      rm -f  "$pkg_path/src/components.d.ts"
    fi
  fi
done

# Apps
for app_path in apps/*; do
  if [ -d "$app_path" ]; then
    app_name=$(basename "$app_path")
    echo "🗑️ Removing generated files from apps/$app_name..."
    rm -rf "$app_path/node_modules"
    rm -rf "$app_path/dist" 
    rm -rf "$app_path/.turbo"
    # Add any other app-specific build artifacts if they exist
  fi
done

echo "✅ Clean process completed."
echo ""

# --- Installation and Build ---
echo "⚙️ Installing dependencies with pnpm..."
npx pnpm install

echo "✅ Dependencies installed."
echo ""

echo "🛠️ Building all packages with Turborepo..."
npx pnpm turbo build

echo "✅ Build process completed."
echo ""

# --- Verification ---
echo "🔎 Starting artifact verification..."

# Function to check if a file exists and optionally contains a string
check_file_content() {
  local file_path="$1"
  local search_string="$2"
  local file_description="$3"

  echo -n "Checking $file_description ($file_path)... "
  if [ ! -f "$file_path" ]; then
    echo "❌ FAILED: File does not exist."
    return 1
  fi

  if [ -n "$search_string" ]; then
    # 🧑‍💻 Using grep -q for quiet mode (no output) and checking exit status
    if grep -q "$search_string" "$file_path"; then
      echo "✅ PASSED: Exists and contains \"$search_string\"."
    else
      echo "❌ FAILED: Exists but does NOT contain \"$search_string\"."
      # 🧑‍💻 Optional: Display file content for debugging
      # echo "--- Content of $file_path ---"
      # cat "$file_path"
      # echo "--- End of content ---"
      return 1
    fi
  else
    echo "✅ PASSED: File exists."
  fi
  return 0
}

# Verification checks
verification_failed=0

# 1. packages/core/src/components.d.ts
#    For the `www` build (dev server), this file might be empty or minimal if no components are found.
#    For the `dist` build (which `pnpm turbo build` runs), it should be populated.
#    The string "ExerpOdinCcForm" is a good check for the interface/class name.
check_file_content "packages/core/src/components.d.ts" "ExerpOdinCcForm" "Core components.d.ts" || verification_failed=1

# 2. packages/core/dist/collection/components/exerp-odin-cc-form/exerp-odin-cc-form.js
#    This is a key compiled output for the `dist` target.
check_file_content "packages/core/dist/collection/components/exerp-odin-cc-form/exerp-odin-cc-form.js" "" "Core dist component JS" || verification_failed=1

# 3. packages/core/www/build/exerp-odin-dropin-core.esm.js
#    This is for the Stencil dev server (`pnpm start` in core).
#    `pnpm turbo build` *should* also populate the `www` output target if it's defined in stencil.config.ts.
#    We expect "exerp-odin-cc-form" to be in the component registration metadata.
#    However, this is the file that's problematic with `pnpm start`, so its content after `pnpm turbo build` is interesting.
check_file_content "packages/core/www/build/exerp-odin-dropin-core.esm.js" "exerp-odin-cc-form" "Core www build ESM" || verification_failed=1

# 4. packages/odin-dropin/dist/odin-dropin.es.js
#    Facade ESM build output.
check_file_content "packages/odin-dropin/dist/odin-dropin.es.js" "" "Facade ESM build" || verification_failed=1


if [ "$verification_failed" -eq 0 ]; then
  echo "✅ All artifact verifications passed."
else
  echo "❌ Some artifact verifications FAILED."
  # exit 1 # 🧑‍💻 Optionally exit if verification fails
fi
echo ""

# --- Output instructions will go here next ---

echo "🚀 Next Steps:"
echo "To run the demo application (consumes built packages):"
echo "  pnpm dev --filter demo"
echo ""
echo "To run the Stencil dev server for 'core' package (for isolated component testing):"
echo "  cd packages/core && pnpm start"
echo ""
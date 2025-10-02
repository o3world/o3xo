#!/bin/bash

# Replace inline noscript blocks with include directive
# This is a one-time migration script

echo "🔄 Replacing noscript blocks with include directives..."

# Find all HTML files (excluding node_modules, includes, etc.)
find . -name "*.html" \
  -not -path "./node_modules/*" \
  -not -path "./includes/*" \
  -not -path "./captured-site/*" \
  -not -path "./netlify/*" \
  -type f | while read file; do

  # Check if file has noscript block with navigation
  if grep -q '<noscript>' "$file" && grep -q 'Static header fallback' "$file"; then
    echo "Processing: $file"

    # Use perl for multi-line replacement
    perl -i -0pe 's/<noscript>\s*<!--\s*Static header fallback.*?<\/noscript>/<noscript>\n        <!-- #include virtual="\/includes\/header.noscript.html" -->\n    <\/noscript>/gs' "$file"

    echo "   ✓ Replaced noscript block"
  fi
done

echo ""
echo "✅ Replacement complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run inject:noscript"
echo "2. Test in browser with JS disabled"
echo "3. Commit changes"

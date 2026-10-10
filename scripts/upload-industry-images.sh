#!/bin/bash
#
# Upload Industry Solution Images to Media Library
#
# This script uploads the 107 images needed for Industry Solution pages
# and generates a URL mapping file for content replacement.
#

API_BASE_URL="http://localhost:9006/api"
EXTRACTED_PAGES_DIR="/Users/hazarekiz/Projects/v06/Affexai/extracted_pages"
IMAGE_LIST_FILE="/tmp/industry_images_original.txt"
MAPPING_OUTPUT_FILE="/tmp/industry_images_mapping.json"

echo "🚀 Starting Industry Solutions Image Upload..."
echo ""

# Initialize mapping JSON
echo "{" > "$MAPPING_OUTPUT_FILE"
first_entry=true

success_count=0
error_count=0
total=$(wc -l < "$IMAGE_LIST_FILE" | tr -d ' ')

line_num=0
while IFS= read -r original_url; do
    line_num=$((line_num + 1))

    # Skip empty lines
    [ -z "$original_url" ] && continue

    # Convert URL to local path
    # URL format: https://aluplan.com.tr/wp-content/uploads/2022/10/filename.png
    # Local format: /extracted_pages/uploads/2022/10/filename.png
    local_path=$(echo "$original_url" | sed "s|https://aluplan.com.tr/wp-content/uploads/|${EXTRACTED_PAGES_DIR}/uploads/|")
    filename=$(basename "$local_path")

    # Check if file exists
    if [ ! -f "$local_path" ]; then
        echo "⚠️  [$line_num/$total] File not found: $filename"
        error_count=$((error_count + 1))
        continue
    fi

    printf "📤 [%d/%d] Uploading %s... " "$line_num" "$total" "$filename"

    # Upload using curl
    response=$(curl -s -X POST "$API_BASE_URL/media/upload?module=cms&category=gallery&tags=industry-solutions,imported" \
        -F "file=@$local_path" \
        -H "Accept: application/json")

    # Check if upload was successful
    if echo "$response" | grep -q '"success":true'; then
        # Extract the new URL from response
        new_url=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', d).get('url', ''))" 2>/dev/null)
        media_id=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', d).get('id', ''))" 2>/dev/null)

        echo "✅"
        success_count=$((success_count + 1))

        # Add to mapping (JSON format)
        if [ "$first_entry" = true ]; then
            first_entry=false
        else
            echo "," >> "$MAPPING_OUTPUT_FILE"
        fi

        cat >> "$MAPPING_OUTPUT_FILE" << EOF
  "$original_url": {
    "newUrl": "$new_url",
    "mediaId": "$media_id"
  }
EOF
    else
        echo "❌"
        echo "   Error: $response" | head -c 200
        echo ""
        error_count=$((error_count + 1))
    fi

    # Small delay to avoid overwhelming the server
    sleep 0.1

done < "$IMAGE_LIST_FILE"

# Close mapping JSON
echo "" >> "$MAPPING_OUTPUT_FILE"
echo "}" >> "$MAPPING_OUTPUT_FILE"

echo ""
echo "=================================================="
echo "✅ Successfully uploaded: $success_count"
echo "❌ Failed: $error_count"
echo "📄 Mapping saved to: $MAPPING_OUTPUT_FILE"
echo "=================================================="

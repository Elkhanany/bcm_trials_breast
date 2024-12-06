#!/bin/bash

set -e

# Define relative paths
NODE_PATH="../../node-v22.2.0-win-x64"
PYTHON_SCRIPT_PATH="update_mindmap.py"
REPO_PATH=".."
MARKDOWN_FILE="landscape.md"
HTML_FILE="index.html"

# Add Node.js binary path to the PATH environment variable
export PATH="$PATH:$(pwd)/$NODE_PATH"

# Check if the Python script exists
if [ ! -f "$PYTHON_SCRIPT_PATH" ]; then
    echo "$PYTHON_SCRIPT_PATH not found"
    exit 1
fi

# Run the
# Run the Python script
echo "Running Python script to generate $MARKDOWN_FILE..."
python3 "$PYTHON_SCRIPT_PATH"

# Copy the new landscape file to the repository root
cp "$MARKDOWN_FILE" "$REPO_PATH/$MARKDOWN_FILE"

# Run the Node.js script to generate the HTML file
echo "Running Node.js script to generate $HTML_FILE..."
(cd "$REPO_PATH" && node generate-markmap.js)

# Commit the changes
(cd "$REPO_PATH" && git add . && git commit -m "Automated update of repository" && git push origin main)

echo "Pipeline executed successfully."
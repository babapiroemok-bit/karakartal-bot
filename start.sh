#!/bin/bash
# Ensure better-sqlite3 binary exists (Replit workaround)
BINARY="node_modules/better-sqlite3/build/Release/better_sqlite3.node"
if [ ! -f "$BINARY" ]; then
  echo "📦 better-sqlite3 binary indiriliyor..."
  mkdir -p node_modules/better-sqlite3/build/Release
  curl -sL "https://github.com/WiseLibs/better-sqlite3/releases/download/v12.11.1/better-sqlite3-v12.11.1-node-v137-linux-x64.tar.gz" -o /tmp/bsql.tar.gz
  tar -xzf /tmp/bsql.tar.gz -C node_modules/better-sqlite3/build/Release
  cp node_modules/better-sqlite3/build/Release/build/Release/better_sqlite3.node "$BINARY" 2>/dev/null || true
  echo "✅ Binary hazır."
fi
exec node index.js

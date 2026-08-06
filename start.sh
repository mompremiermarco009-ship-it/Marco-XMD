#!/bin/bash
cd "$(dirname "$0")"
[ ! -d "node_modules" ] && npm install
export PORT=${PORT:-10000}
node index.js

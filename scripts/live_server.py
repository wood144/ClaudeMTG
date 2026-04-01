#!/usr/bin/env python3
"""
Live bridge server — receives board state from MTG tracker via WebSocket.

Usage (from mtg-commander/):
    python scripts/live_server.py

Requires: pip install websockets
"""

import asyncio
import json
import os
import re
import sys
import tempfile
from datetime import datetime

try:
    import websockets
except ImportError:
    print("Missing dependency. Run:  pip install websockets")
    sys.exit(1)

OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'game_live.txt')
LIBRARY_OUT = os.path.join(os.path.dirname(__file__), '..', 'claude_library.json')
PORT = 8765


def write_atomic(path, content):
    """Write file atomically (temp + replace) to avoid read/write races."""
    directory = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=directory, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(content)
        os.replace(tmp, path)
    except Exception:
        os.unlink(tmp)
        raise


def extract_library(message):
    """Extract [[CLD_LIB|...]] from message, write to claude_library.json.
    Returns message with the CLD_LIB line stripped."""
    lines = message.split('\n')
    clean = []
    for line in lines:
        m = re.match(r'^\[\[CLD_LIB\|(.+)\]\]$', line)
        if m:
            try:
                lib = json.loads(m.group(1))
                write_atomic(LIBRARY_OUT, json.dumps(lib, indent=2))
            except (json.JSONDecodeError, TypeError):
                pass  # skip bad data silently
        else:
            clean.append(line)
    return '\n'.join(clean)


async def handler(websocket):
    remote = websocket.remote_address
    print(f"[{datetime.now():%H:%M:%S}] Client connected from {remote}")
    try:
        async for message in websocket:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            stripped = extract_library(message)
            content = f"[LIVE UPDATE: {timestamp}]\n{stripped}"
            write_atomic(OUTPUT, content)
            # Print a short summary
            lines = stripped.strip().split('\n')
            header = lines[0] if lines else '?'
            print(f"[{timestamp}] {header}  ({len(message)} bytes)")
    except websockets.ConnectionClosed:
        print(f"[{datetime.now():%H:%M:%S}] Client disconnected")


async def main():
    try:
        async with websockets.serve(handler, "localhost", PORT):
            abs_out = os.path.abspath(OUTPUT)
            print(f"Live bridge server running on ws://localhost:{PORT}")
            print(f"Writing to: {abs_out}")
            print("Waiting for tracker connection...\n")
            await asyncio.Future()  # run forever
    except OSError as e:
        if "address already in use" in str(e).lower() or e.errno == 10048:
            print(f"ERROR: Port {PORT} already in use. Kill the other process or change PORT.")
        else:
            raise


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")

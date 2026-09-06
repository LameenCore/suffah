#!/usr/bin/env python3
"""
demo.py - one command to put the Suffa demo online.

    python scripts/demo.py                  # build if needed, start, tunnel
    python scripts/demo.py --fresh          # force clean rebuild + restart
    python scripts/demo.py --migrate --seed # prep the local DB first
    python scripts/demo.py --port 3100

Starts `next start` and a Cloudflare *quick tunnel*, prints the public
https://<name>.trycloudflare.com URL, and keeps both alive until Ctrl+C.
No Cloudflare account or login needed - the quick tunnel is ephemeral.

Runs against whatever `.env.local` points at (local Supabase + Anthropic key);
this script never reads that file - migrate/seed go through the npm scripts,
which load it themselves.
"""

from __future__ import annotations

import argparse
import atexit
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IS_WIN = os.name == "nt"
PROCS: list[tuple[str, subprocess.Popen]] = []


def tool(name: str) -> str:
    """Resolve an executable, tolerating the .cmd shims npm/npx use on Windows."""
    return shutil.which(name) or (shutil.which(name + ".cmd") if IS_WIN else None) or name


NPM = tool("npm")
NPX = tool("npx")


def run(cmd: list[str]) -> None:
    print(f"\n$ {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def http_ok(url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:  # noqa: S310 (localhost)
            return r.status < 500
    except Exception:
        return False


def free_port(port: int) -> None:
    """Best-effort: kill whatever is LISTENING on `port`."""
    print(f"... freeing port {port}", flush=True)
    if IS_WIN:
        out = subprocess.run(
            ["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True
        ).stdout
        pids = {
            line.split()[-1]
            for line in out.splitlines()
            if f":{port} " in line and "LISTENING" in line
        }
        for pid in pids:
            subprocess.run(["taskkill", "/F", "/T", "/PID", pid], capture_output=True)
    else:
        subprocess.run(["bash", "-c", f"fuser -k {port}/tcp || true"], capture_output=True)
    time.sleep(1)


def spawn(cmd: list[str], name: str) -> subprocess.Popen:
    print(f"\n> starting {name}: {' '.join(cmd)}", flush=True)
    flags = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WIN else 0
    p = subprocess.Popen(
        cmd,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        creationflags=flags,
    )
    PROCS.append((name, p))
    return p


def pump(p: subprocess.Popen, name: str, on_line=None) -> None:
    assert p.stdout is not None
    for line in p.stdout:
        line = line.rstrip()
        print(f"[{name}] {line}", flush=True)
        if on_line:
            on_line(line)


def cleanup() -> None:
    for name, p in PROCS:
        if p.poll() is None:
            print(f"\n. stopping {name} (pid {p.pid})", flush=True)
            try:
                if IS_WIN:
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True
                    )
                else:
                    p.terminate()
            except Exception:
                pass


def main() -> None:
    ap = argparse.ArgumentParser(description="Put the Suffa demo online via a Cloudflare quick tunnel.")
    ap.add_argument("--port", type=int, default=3000)
    ap.add_argument("--fresh", action="store_true", help="force clean rebuild + restart the server")
    ap.add_argument("--no-build", action="store_true", help="never build, even if .next is missing")
    ap.add_argument("--migrate", action="store_true", help="run `npm run migrate` first")
    ap.add_argument("--seed", action="store_true", help="run `npm run seed` first")
    a = ap.parse_args()

    atexit.register(cleanup)

    if a.migrate:
        run([NPM, "run", "migrate"])
    if a.seed:
        run([NPM, "run", "seed"])

    base = f"http://localhost:{a.port}/"
    serving = http_ok(base)

    if serving and not a.fresh:
        print(f"\n[ok] something already answers on :{a.port} - tunnelling to it.")
        print("     (pass --fresh to force a clean rebuild + restart)")
    else:
        if serving and a.fresh:
            free_port(a.port)
        build_id = os.path.join(ROOT, ".next", "BUILD_ID")
        if a.fresh or (not a.no_build and not os.path.exists(build_id)):
            run([NPX, "next", "build"])
        else:
            print("\n[ok] .next build present - skipping build (pass --fresh to rebuild)")

        srv = spawn([NPX, "next", "start", "-p", str(a.port)], "next")
        threading.Thread(target=pump, args=(srv, "next"), daemon=True).start()

        print(f"\n... waiting for {base}", flush=True)
        for _ in range(60):
            if http_ok(base):
                break
            if srv.poll() is not None:
                sys.exit("next start exited early - see the log above")
            time.sleep(1)
        else:
            sys.exit("server did not come up within 60s")
        print("[ok] server is up")

    # --- Cloudflare quick tunnel ---
    cf = shutil.which("cloudflared")
    tunnel_cmd = ([cf] if cf else [NPX, "--yes", "cloudflared"]) + [
        "tunnel",
        "--url",
        f"http://localhost:{a.port}",
    ]

    state: dict[str, str] = {}
    url_re = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")

    def grab(line: str) -> None:
        if "url" not in state:
            m = url_re.search(line)
            if m:
                state["url"] = m.group(0)
                bar = "=" * 68
                print(f"\n{bar}\n  PUBLIC DEMO URL:  {state['url']}\n{bar}")
                print("  open it -> /login -> \"Explore the demo\" -> pick a role\n", flush=True)

    tun = spawn(tunnel_cmd, "cloudflared")
    threading.Thread(target=pump, args=(tun, "cloudflared", grab), daemon=True).start()

    for _ in range(40):
        if "url" in state:
            break
        if tun.poll() is not None:
            print(
                "\ncloudflared exited before printing a URL.\n"
                "  Install it and retry:\n"
                "    winget install --id Cloudflare.cloudflared   (Windows)\n"
                "    brew install cloudflared                      (macOS)\n",
                file=sys.stderr,
            )
            sys.exit(1)
        time.sleep(1)

    print("Press Ctrl+C to stop the demo (server + tunnel).\n", flush=True)
    try:
        while True:
            time.sleep(1)
            for name, p in PROCS:
                if p.poll() is not None:
                    sys.exit(f"\n{name} exited (code {p.returncode}) - shutting down.")
    except KeyboardInterrupt:
        print("\n\nshutting down...", flush=True)


if __name__ == "__main__":
    main()

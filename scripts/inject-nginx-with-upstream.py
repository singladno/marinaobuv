#!/usr/bin/env python3
"""Inject log_format with_upstream into nginx main config if missing. Run with sudo."""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "/etc/nginx/nginx.conf"
with open(path, encoding="utf-8", errors="replace") as f:
    s = f.read()

if "log_format with_upstream" in s:
    sys.exit(0)

block = """
    # Reverse-proxy correlation (upstream_status, upstream_addr) for log shipping
    log_format with_upstream '$remote_addr - $remote_user [$time_local] "$request" '
        '$status $body_bytes_sent rt=$request_time '
        'upstream_status=$upstream_status upstream_addr=$upstream_addr '
        'urt=$upstream_response_time req_id=$request_id '
        '"$http_referer" "$http_user_agent"';

"""

s, n = re.subn(
    r"(default_type application/octet-stream;\n)",
    r"\1" + block,
    s,
    count=1,
)
if n != 1:
    print("inject-nginx-with-upstream: no default_type line found", file=sys.stderr)
    sys.exit(2)

s = re.sub(
    r"access_log\s+/var/log/nginx/access\.log\s+main;",
    "access_log /var/log/nginx/access.log with_upstream;",
    s,
    count=1,
)
s = re.sub(
    r"access_log\s+/var/log/nginx/access\.log\s+combined;",
    "access_log /var/log/nginx/access.log with_upstream;",
    s,
    count=1,
)
s = re.sub(
    r"access_log\s+/var/log/nginx/access\.log\s*;",
    "access_log /var/log/nginx/access.log with_upstream;",
    s,
    count=1,
)

with open(path, "w", encoding="utf-8") as f:
    f.write(s)
sys.exit(0)

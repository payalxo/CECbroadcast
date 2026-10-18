import json
import os
import random
import threading
import time
import urllib.request
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    from send_alert import send_alert
except KeyError:
    def send_alert(text):
        print("(Telegram settings missing) would have sent a message")

# ---------- Settings (all come from the environment, never from this file) ----------
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
TRUST_PROXY = os.environ.get("TRUST_PROXY", "0") == "1"
ESCALATE_AFTER = int(os.environ.get("ESCALATE_AFTER", "60"))   # seconds

FLOOR_IDS = (0, 1, 2)
NAMES = {0: "Ground Floor", 1: "First Floor", 2: "Second Floor"}
TOKEN_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.")


# ---------- Rate limiting ----------
class RateLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.hits = defaultdict(deque)
        self.lock = threading.Lock()

    def _prune(self, key, now):
        q = self.hits[key]
        while q and q[0] <= now - self.window:
            q.popleft()
        return q

    def allow(self, key):
        now = time.time()
        with self.lock:
            q = self._prune(key, now)
            if len(q) >= self.limit:
                return False
            q.append(now)
            if len(self.hits) > 5000:
                for k in [k for k, v in self.hits.items() if not v]:
                    del self.hits[k]
            return True

    def blocked(self, key):
        with self.lock:
            return len(self._prune(key, time.time())) >= self.limit

    def hit(self, key):
        with self.lock:
            self._prune(key, time.time()).append(time.time())


general_limiter = RateLimiter(int(os.environ.get("RATE_LIMIT_PER_MIN", "600")), 60)
control_limiter = RateLimiter(10, 60)    # drills: 10 per minute per address
failed_logins = RateLimiter(10, 300)     # bad logins: 10 per 5 minutes per address


# ---------- Login check and role (done on the server, by asking Supabase) ----------
token_cache = {}   # token -> (expires_at, role)
cache_lock = threading.Lock()


def get_role(token):
    """Returns 'operator', 'viewer', or None when the token is not valid."""
    if not token or len(token) > 4096 or not set(token) <= TOKEN_CHARS:
        return None
    now = time.time()
    with cache_lock:
        hit = token_cache.get(token)
        if hit and hit[0] > now:
            return hit[1]
    if not SUPABASE_URL or not PUBLISHABLE_KEY:
        return None
    request = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"apikey": PUBLISHABLE_KEY, "Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            if response.status != 200:
                return None
            user = json.loads(response.read().decode("utf-8", errors="ignore"))
    except Exception:
        return None
    if not isinstance(user, dict):
        return None
    meta = user.get("app_metadata") or {}
    role = "operator" if isinstance(meta, dict) and meta.get("role") == "operator" else "viewer"
    with cache_lock:
        if len(token_cache) > 500:
            token_cache.clear()
        token_cache[token] = (now + 30, role)   # remember a good token for 30 seconds
    return role


# ---------- Saving alerts to the database ----------
def save_alert(floor_id, kind, message):
    if not SUPABASE_URL or not SECRET_KEY:
        return
    if floor_id not in FLOOR_IDS or kind not in ("fire", "quake"):
        return
    body = json.dumps({"floor_id": floor_id, "kind": kind, "message": message[:200]}).encode()
    headers = {"apikey": SECRET_KEY, "Content-Type": "application/json", "Prefer": "return=minimal"}
    if SECRET_KEY.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {SECRET_KEY}"
    request = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/alerts", data=body, headers=headers, method="POST")
    urllib.request.urlopen(request, timeout=8).close()


def notify(telegram_text, floor_id, kind, db_text):
    try:
        send_alert(telegram_text)
    except Exception as error:
        print("Telegram failed:", type(error).__name__)
    try:
        save_alert(floor_id, kind, db_text)
    except Exception as error:
        print("Saving alert failed:", type(error).__name__)


def alert(telegram_text, floor_id, kind, db_text):
    print("ALERT:", db_text)
    threading.Thread(target=notify, args=(telegram_text, floor_id, kind, db_text), daemon=True).start()


def telegram_only(text):
    def run():
        try:
            send_alert(text)
        except Exception as error:
            print("Telegram failed:", type(error).__name__)
    threading.Thread(target=run, daemon=True).start()


# ---------- Simulated sensors and detection rules ----------
lock = threading.Lock()
floors = {i: {"name": NAMES[i], "temperature": 28.0, "smoke": 30,
              "vibration": 0.03, "status": "ok"} for i in FLOOR_IDS}
fire_on = {i: False for i in FLOOR_IDS}
recent = {i: deque(maxlen=3) for i in FLOOR_IDS}
history = {i: deque(maxlen=30) for i in FLOOR_IDS}
fire_alerted = set()
quake_until = 0.0
quake_alerted = False

# Emergency tracking: when it started, whether the operator acknowledged, whether we escalated
emergency_since = None
acknowledged = False
escalated = False


# ---------- Simulated headcount (counts only, no names) ----------
BASE_PEOPLE = {0: 10, 1: 18, 2: 26}
people = {i: {"inside": BASE_PEOPLE[i], "stuck": 0, "cleared": False} for i in FLOOR_IDS}
evacuating = False


def people_step(any_emergency):
    global evacuating
    if any_emergency and not evacuating:
        # An emergency just started. At least one floor keeps a few people who do not get out on their own.
        evacuating = True
        trapped_floor = random.choice(FLOOR_IDS)
        for fid in FLOOR_IDS:
            p = people[fid]
            p["cleared"] = False
            wanted = random.randint(1, 3) if fid == trapped_floor else random.choice([0, 0, 1])
            p["stuck"] = min(p["inside"], wanted)
    elif not any_emergency and evacuating:
        evacuating = False
        for fid in FLOOR_IDS:
            people[fid]["stuck"] = 0
            people[fid]["cleared"] = False

    for fid in FLOOR_IDS:
        p = people[fid]
        if evacuating:
            if p["inside"] > p["stuck"]:
                p["inside"] = max(p["stuck"], p["inside"] - random.randint(1, 3))
        else:
            base = BASE_PEOPLE[fid]
            if p["inside"] < base - 3:
                p["inside"] = min(base, p["inside"] + 2)   # people come back after an all-clear
            elif random.random() < 0.3:
                p["inside"] = max(base - 3, min(base + 3, p["inside"] + random.choice([-1, 0, 1])))


def people_snapshot():
    out = {}
    for fid in FLOOR_IDS:
        p = people[fid]
        out[str(fid)] = {
            "inside": p["inside"],
            "base": BASE_PEOPLE[fid],
            "settled": evacuating and p["inside"] <= p["stuck"],
            "cleared": p["cleared"],
        }
    return {"floors": out, "evacuating": evacuating}


def clear_floor(fid):
    p = people[fid]
    p["inside"] = 0
    p["stuck"] = 0
    p["cleared"] = True


def people_reset():
    global evacuating
    evacuating = False
    for fid in FLOOR_IDS:
        people[fid]["stuck"] = 0
        people[fid]["cleared"] = False


def tick():
    global quake_alerted, emergency_since, acknowledged, escalated
    quake_on = time.time() < quake_until
    if not quake_on:
        quake_alerted = False
    for fid in FLOOR_IDS:
        f = floors[fid]
        if fire_on[fid]:
            f["smoke"] += random.randint(20, 60)
            f["temperature"] = round(f["temperature"] + random.uniform(0.5, 1.5), 1)
        else:
            f["smoke"] = random.randint(20, 40)
            f["temperature"] = round(random.uniform(27, 29), 1)

        if quake_on:
            f["vibration"] = round(random.uniform(0.5, 2.0), 2)
        else:
            f["vibration"] = round(random.uniform(0.01, 0.05), 2)

        recent[fid].append(f["vibration"])
        history[fid].append(f["vibration"])
        ratio = (sum(recent[fid]) / len(recent[fid])) / (sum(history[fid]) / len(history[fid]))

        fire_detected = f["smoke"] > 300 and f["temperature"] > 35
        quake_detected = quake_on and ratio > 3 and len(history[fid]) >= 10

        if fire_detected:
            f["status"] = "fire"
            if fid not in fire_alerted:
                fire_alerted.add(fid)
                alert(
                    f"🔥 FIRE on {f['name']}! smoke={f['smoke']}, temp={f['temperature']}C",
                    fid, "fire",
                    f"Fire on {f['name']}: smoke {f['smoke']}, temperature {f['temperature']}C",
                )
        elif quake_on and (quake_detected or f["status"] == "quake"):
            f["status"] = "quake"
            if not quake_alerted:
                quake_alerted = True
                alert(
                    f"🌍 EARTHQUAKE detected! shaking is {ratio:.1f}x normal",
                    fid, "quake",
                    f"Earthquake detected: shaking {ratio:.1f}x normal",
                )
        else:
            f["status"] = "ok"

    # --- simulated headcount ---
    people_step(any(floors[i]["status"] != "ok" for i in FLOOR_IDS))

    # --- emergency tracking and escalation ---
    active = [fid for fid in FLOOR_IDS if floors[fid]["status"] != "ok"]
    now = time.time()
    if not active:
        emergency_since = None
        acknowledged = False
        escalated = False
    elif emergency_since is None:
        emergency_since = now
        acknowledged = False
        escalated = False
    elif not acknowledged and not escalated and now - emergency_since >= ESCALATE_AFTER:
        escalated = True
        fid = active[0]
        kind = "fire" if floors[fid]["status"] == "fire" else "quake"
        inside_now = sum(people[i]["inside"] for i in FLOOR_IDS)
        alert(
            f"🚨 ESCALATION: the {kind} alert has not been acknowledged for {ESCALATE_AFTER} seconds! "
            f"People still inside (simulated): {inside_now}",
            fid, kind,
            f"Escalated: {kind} alert not acknowledged for {ESCALATE_AFTER} seconds",
        )


def loop():
    while True:
        with lock:
            tick()
        time.sleep(1)


def reset():
    global quake_until, quake_alerted, emergency_since, acknowledged, escalated
    for fid in FLOOR_IDS:
        fire_on[fid] = False
    fire_alerted.clear()
    quake_until = 0.0
    quake_alerted = False
    emergency_since = None
    acknowledged = False
    escalated = False
    people_reset()


# ---------- The web server ----------
class Handler(BaseHTTPRequestHandler):
    timeout = 10           # drop slow or stuck connections
    server_version = "Twin"
    sys_version = ""

    def client_ip(self):
        if TRUST_PROXY:
            forwarded = self.headers.get("X-Forwarded-For", "")
            parts = [p.strip() for p in forwarded.split(",") if p.strip()]
            if parts:
                # behind Render's proxy the real client is the entry before the proxy's own
                return parts[-2] if len(parts) >= 2 else parts[0]
        return self.client_address[0]

    def safe_headers(self):
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    def reply(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.safe_headers()
        self.end_headers()
        self.wfile.write(body)

    def allowed_through(self, ip):
        if len(self.path) > 200:
            self.reply(414, {"error": "address too long"})
            return False
        if int(self.headers.get("Content-Length", "0") or 0) > 1024:
            self.reply(413, {"error": "request too large"})
            return False
        if not general_limiter.allow(ip):
            self.reply(429, {"error": "too many requests"})
            return False
        return True

    def current_role(self, ip):
        """Returns 'operator' or 'viewer'. If not signed in, sends the error reply and returns None."""
        if failed_logins.blocked(ip):
            self.reply(429, {"error": "too many failed attempts, try later"})
            return None
        header = self.headers.get("Authorization", "")
        token = header[7:].strip() if header.startswith("Bearer ") else ""
        role = get_role(token)
        if role is None:
            failed_logins.hit(ip)
            self.reply(401, {"error": "unauthorized"})
            return None
        return role

    def do_OPTIONS(self):
        self.send_response(204)
        self.safe_headers()
        self.end_headers()

    def do_GET(self):
        ip = self.client_ip()
        if not self.allowed_through(ip):
            return
        path = self.path.split("?")[0].strip("/")
        if path == "health":
            self.reply(200, {"status": "ok"})
            return
        if path == "data":
            role = self.current_role(ip)
            if role is None:
                return
            with lock:
                trimmed = {
                    str(i): {k: floors[i][k] for k in ("name", "temperature", "smoke", "vibration", "status")}
                    for i in FLOOR_IDS
                }
                emergency = {
                    "active": emergency_since is not None,
                    "seconds": int(time.time() - emergency_since) if emergency_since is not None else 0,
                    "acknowledged": acknowledged,
                    "escalated": escalated,
                    "escalate_after": ESCALATE_AFTER,
                    "people": people_snapshot(),
                }
            self.reply(200, {"floors": trimmed, "emergency": emergency, "role": role})
            return
        self.reply(404, {"error": "not found"})

    def do_POST(self):
        global quake_until, acknowledged
        ip = self.client_ip()
        if not self.allowed_through(ip):
            return
        role = self.current_role(ip)
        if role is None:
            return
        if role != "operator":
            self.reply(403, {"error": "operators only"})
            return
        if not control_limiter.allow(ip):
            self.reply(429, {"error": "too many drills, slow down"})
            return
        parts = self.path.split("?")[0].strip("/").split("/")
        send_ack = False
        cleared_floor = None
        with lock:
            if len(parts) == 3 and parts[:2] == ["control", "fire"] and parts[2] in ("0", "1", "2"):
                fire_on[int(parts[2])] = True; floors[int(parts[2])]["smoke"] = 180; floors[int(parts[2])]["temperature"] = 31.0
                message = f"fire drill started on floor {parts[2]}"
            elif parts == ["control", "quake"]:
                quake_until = time.time() + 25
                message = "earthquake drill started (25 seconds)"
            elif parts == ["control", "reset"]:
                reset()
                message = "all alarms cleared"
            elif len(parts) == 3 and parts[:2] == ["control", "clear"] and parts[2] in ("0", "1", "2"):
                if evacuating:
                    clear_floor(int(parts[2]))
                    cleared_floor = int(parts[2])
                    message = f"{NAMES[cleared_floor]} marked as cleared"
                else:
                    message = "no emergency is active"
            elif parts == ["control", "ack"]:
                if emergency_since is not None and not acknowledged:
                    acknowledged = True
                    send_ack = True
                message = "alert acknowledged"
            else:
                message = None
        if send_ack:
            telegram_only("✅ The alert was acknowledged by the operator.")
        if cleared_floor is not None:
            telegram_only(f"✅ {NAMES[cleared_floor]} marked as cleared by the operator.")
        if message is None:
            self.reply(404, {"error": "not found"})
        else:
            self.reply(200, {"message": message})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    needed = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"]
    missing = [name for name in needed if not os.environ.get(name)]
    if missing:
        print("Missing settings:", ", ".join(missing))
    threading.Thread(target=loop, daemon=True).start()
    print(f"Server running on {HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
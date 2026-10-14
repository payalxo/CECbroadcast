import json
import random
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    from send_alert import send_alert
except KeyError:
    def send_alert(text):
        print("(Telegram token not set) would have sent:", text)

FLOOR_IDS = (0, 1, 2)
NAMES = {0: "Ground Floor", 1: "First Floor", 2: "Second Floor"}

lock = threading.Lock()
floors = {i: {"name": NAMES[i], "temperature": 28.0, "smoke": 30,
              "vibration": 0.03, "status": "ok"} for i in FLOOR_IDS}
fire_on = {i: False for i in FLOOR_IDS}
recent = {i: deque(maxlen=3) for i in FLOOR_IDS}
history = {i: deque(maxlen=30) for i in FLOOR_IDS}
fire_alerted = set()
quake_until = 0.0
quake_alerted = False


def safe_send(text):
    try:
        send_alert(text)
    except Exception as error:
        print("Could not send Telegram message:", error)


def alert(text):
    print("ALERT:", text)
    threading.Thread(target=safe_send, args=(text,)).start()


def tick():
    global quake_alerted
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
                alert(f"🔥 FIRE on {f['name']}! smoke={f['smoke']}, temp={f['temperature']}C")
        elif quake_on and (quake_detected or f["status"] == "quake"):
            f["status"] = "quake"
            if not quake_alerted:
                quake_alerted = True
                alert(f"🌍 EARTHQUAKE detected! shaking is {ratio:.1f}x normal")
        else:
            f["status"] = "ok"


def loop():
    while True:
        with lock:
            tick()
        time.sleep(1)


def reset():
    global quake_until, quake_alerted
    for fid in FLOOR_IDS:
        fire_on[fid] = False
    fire_alerted.clear()
    quake_until = 0.0
    quake_alerted = False


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global quake_until
        parts = self.path.split("?")[0].strip("/").split("/")
        message = "ok"
        with lock:
            if parts[0] == "fire" and len(parts) == 2 and parts[1].isdigit() and int(parts[1]) in FLOOR_IDS:
                fire_on[int(parts[1])] = True
                message = f"fire started on floor {parts[1]}"
            elif parts[0] == "quake":
                quake_until = time.time() + 8
                message = "earthquake started (lasts 8 seconds)"
            elif parts[0] == "reset":
                reset()
                message = "everything reset"
            body = json.dumps({"message": message, "floors": floors}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    threading.Thread(target=loop, daemon=True).start()
    print("Server running. Open http://localhost:8000/data  (Ctrl+C to stop)")
    HTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
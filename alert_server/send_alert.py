import os
import time
import urllib.parse
import urllib.request

TOKEN = os.environ["TELEGRAM_TOKEN"]
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]


def send_alert(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = urllib.parse.urlencode({"chat_id": CHAT_ID, "text": text}).encode()
    for attempt in range(1, 4):
        try:
            urllib.request.urlopen(url, data, timeout=10)
            return
        except Exception as error:
            print(f"Telegram try {attempt} failed: {error}")
            time.sleep(2)
    raise RuntimeError("Telegram failed 3 times")


if __name__ == "__main__":
    send_alert("🔥 Test alert from Python")
    print("Alert sent!")
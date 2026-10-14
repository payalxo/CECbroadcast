# CEC Broadcast: Fire and Earthquake Alerts for a Building Digital Twin

A monitoring and alert system for a college building. A Python server simulates sensors, detects fire and earthquake events, sends **Telegram alerts** to a phone, and drives a **3D dashboard** where the affected floor glows red (fire) or orange (earthquake).

> **Status: working prototype.** All sensor data is **simulated**. This is a learning and demo project. It is not a safety system and does not replace real fire alarms.

## What this project adds

The 3D dashboard (React + Three.js) comes from another student's project (see Credits). The parts added in this repository are:

- **`alert_server/server.py`**: a Python server (standard library only) that
  - simulates smoke, temperature and vibration readings for three floors,
  - detects **fire** when smoke and temperature are both high (two signals together, so one faulty sensor doesn't trigger it),
  - detects **earthquakes** by comparing recent shaking (last 3 seconds) to normal shaking (last 30 seconds), instead of using a fixed threshold,
  - sends Telegram alerts (with retries if the connection is slow),
  - shares live readings at `http://localhost:8000/data`.
- **`alert_server/send_alert.py`**: sends a message through a Telegram bot.
- **`src/context/SensorContext.jsx`** (modified): the dashboard asks the server for readings every second and adds fire and earthquake alerts to the alert feed. If the server is not running, it falls back to the original random demo data.
- **`src/components/BuildingModel.jsx`** (modified): a translucent overlay makes the affected floor glow red or orange.

## How it works

```
server.py (simulated sensors + fire/earthquake rules)
   |-- Telegram bot --> alert on your phone
   '-- /data (JSON) --> React dashboard --> alert feed + glowing floors
```

## Run it locally

You need Node.js, Python 3 and Git.

**1. Create a Telegram bot.** Message `@BotFather` on Telegram, send `/newbot`, and keep the token it gives you private. Send any message to your new bot, then open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` to find your chat ID.

**2. Start the alert server** (Windows):

```
cd alert_server
set TELEGRAM_TOKEN=your_token_here
set TELEGRAM_CHAT_ID=your_chat_id_here
python server.py
```

The token is read from the environment and is never stored in the code. If it isn't set, the server still runs and only prints the alerts.

**3. Start the dashboard** (in a second terminal, from the project root):

```
npm install
npm run dev
```

Open `http://localhost:3000`.

## Try it

Wait about 15 seconds after starting the server (the earthquake detector needs a little history), then open these in your browser:

| Address | What happens |
|---|---|
| `http://localhost:8000/fire/2` | Starts a fire on the second floor. Within about 10 seconds the floor glows red and Telegram sends an alert |
| `http://localhost:8000/quake` | Simulates an 8-second earthquake on all floors (orange) |
| `http://localhost:8000/reset` | Clears all alarms |
| `http://localhost:8000/data` | Shows the current readings as JSON |

## Limitations

- Sensors are simulated. Real hardware (for example an ESP32 with a smoke sensor and an accelerometer) is not connected yet.
- The dashboard talks to `localhost:8000`, so it currently works only on the same computer. Deployment is not done yet.
- Earthquakes are **detected as they happen**, not predicted.

## Roadmap

- [ ] Connect real sensors (ESP32 with smoke and acceleration sensors)
- [ ] Deploy the server and dashboard online
- [ ] Store readings over time
- [ ] Add real earthquake data from the USGS API

## Credits

The 3D digital twin dashboard is based on the work of **Devendra Gupta**: [CEC civil department virtual digital twin dashboard](https://github.com/devendragupta-BIM/CEC-civil-department-virtual-digital-twin-dashboard). Its README states the MIT License.

Alert server, alert rules, Telegram integration and dashboard connection by **payalxo**.
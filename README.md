# 🏢 Chaibasa Engineering College Civil Dept — AI Digital Twin Dashboard

[![Live Dashboard Demo](https://img.shields.io/badge/Live%20Demo-View%20Digital%20Twin-00d4ff?style=for-the-badge&logo=googlechrome)](https://devendragupta-BIM.github.io/CEC-civil-department-virtual-digital-twin-dashboard/)
[![Published in Automation in Construction](https://img.shields.io/badge/Published-Automation%20in%20Construction%20(Elsevier)-00d4ff?style=for-the-badge&logo=elsevier)](https://www.sciencedirect.com/journal/automation-in-construction)
[![Building](https://img.shields.io/badge/Building-Chaibasa%20Engineering%20College-00ff88?style=for-the-badge)](https://www.chaibasaengg.edu.in/)
[![University](https://img.shields.io/badge/University-JUT%20Ranchi-8855ff?style=for-the-badge)](https://jutranchi.ac.in/)

> 🌐 **Live Public Web Link**: [https://devendragupta-BIM.github.io/CEC-civil-department-virtual-digital-twin-dashboard/](https://devendragupta-BIM.github.io/CEC-civil-department-virtual-digital-twin-dashboard/)

Created & Developed by **Devendra Gupta** — BIM Automation Consultant at BMSI, Gurugram.

---

## 🌐 Live Online Access (Shareable Link)

You can share this live web link with anyone (professors, researchers, students, or clients) to view and interact with the 3D Digital Twin directly in their browser without downloading anything:

👉 **[https://devendragupta-BIM.github.io/CEC-civil-department-virtual-digital-twin-dashboard/](https://devendragupta-BIM.github.io/CEC-civil-department-virtual-digital-twin-dashboard/)**

---

## 🔰 How to Run Locally (Step-by-Step Guide for Beginners)

If you want to run the project on your local computer:

### 📋 Prerequisites (Only needed once)
First, make sure you have **Node.js** installed on your computer:
1. Download Node.js (LTS Version) from: 👉 **[https://nodejs.org/](https://nodejs.org/)**
2. Run the installer and click **Next** until installation finishes.

---

### Option A: Using Git Clone (Recommended)

#### Step 1: Open Terminal / Command Prompt
- On **Windows**: Press `Win + R`, type `cmd`, and press **Enter**.
- On **Mac**: Press `Cmd + Space`, type `Terminal`, and press **Enter**.

#### Step 2: Clone the Repository
Copy and paste this command into your terminal, then press **Enter**:
```bash
git clone https://github.com/devendragupta-BIM/CEC-civil-department-virtual-digital-twin-dashboard.git
```

#### Step 3: Enter the Project Folder
Type this command and press **Enter**:
```bash
cd CEC-civil-department-virtual-digital-twin-dashboard
```

#### Step 4: Install Required Packages
Type this command and press **Enter**:
```bash
npm install
```

#### Step 5: Start the Dashboard!
Type this command and press **Enter**:
```bash
npm run dev
```

#### Step 6: View in Your Browser
Open Chrome, Edge, Safari, or Firefox and go to:
👉 **`http://localhost:3000/`**

---

### Option B: Download as ZIP File (No Git Required)

1. Click the green **`Code`** button at the top right of this GitHub page.
2. Select **`Download ZIP`**.
3. Unzip/Extract the downloaded folder onto your Desktop or computer.
4. Open your **Command Prompt** or **Terminal**.
5. Type `cd ` (with a space) and drag & drop the unzipped folder into the terminal window, then press **Enter**.
6. Run:
   ```bash
   npm install
   ```
7. Run:
   ```bash
   npm run dev
   ```
8. Open your browser to: 👉 **`http://localhost:3000/`**

🎉 **That's it!** The 3D rotating building and live AI dashboard will appear on your screen!

---

## 🌟 Highlights & Features

- **3D Procedural BIM Model**: Faithfully recreated in Three.js from Autodesk Revit & Navisworks (`CIVIL DEPARTMENT CEC 01.nwc`), featuring G+2 floors, cream facade with red horizontal band courses, 4 projecting corner towers with top apertures, double window wings, and entrance portico signage.
- **25 Simulated IoT Data Streams**: Live environmental monitoring across 3 floors + MEP systems (Temperature, Humidity, CO2, Occupancy, Energy Load, Noise, and Structural Vibration) updating every 2.5 seconds.
- **AI Anomaly Detection Engine**: Isolation Forest ML simulation flagging real-time indoor air quality (CO2 spikes up to 1600 ppm) and thermal variances.
- **Natural Language AI Query Bar**: Ask questions in plain English (e.g., *"Which floor has highest CO2?"*, *"What is total energy load?"*).
- **Cinematic Glassmorphism UI**: NASA mission-control dark theme (`#040810`), real-time Chart.js energy trend graph, dynamic SVG building health score arc (0–100), alert popups, and scanline overlay.

---

## 🎮 How to Interact with the Dashboard

- **Rotate & Zoom 3D Building**: Click and drag your mouse anywhere on the 3D canvas to rotate the building. Use your mouse scroll wheel to zoom in or out.
- **Switch Floor Views**: Click any floor button on the left sidebar (**Ground Floor**, **First Floor**, **Second Floor**) to move the camera and view that specific floor's live sensor cards.
- **Change Camera Angle**: Use the top-left buttons on the 3D canvas (**3D View**, **Floor Plan**, **Front Elevation**, or **Pause**).
- **Ask AI Questions**: Click the **"Ask AI"** input box at the bottom right, type a question like `Which floor has highest CO2?`, and press Enter to receive an instant AI report.

---

## 🛠️ Technology Stack

- **Core**: React 18 + Vite
- **3D Graphics**: Three.js + `@react-three/fiber` + `@react-three/drei`
- **Styling**: Vanilla CSS tokens + Tailwind CSS + Glassmorphism Backdrop Blurs
- **Charts**: Chart.js + `react-chartjs-2`
- **Icons**: Lucide React

---

## 👨‍💻 Author Profile

**Devendra Gupta**
* BIM Automation Consultant | BMSI, Gurugram
* Specialization: BIM + AI Integration, IoT Digital Twins, Revit Automation & Computational Design
* Email: [devendragupta.bim@gmail.com](mailto:devendragupta.bim@gmail.com)
* GitHub: [@devendragupta-BIM](https://github.com/devendragupta-BIM)

---

*Chaibasa Engineering College, Jharkhand University of Technology (JUT), Ranchi · 2025*
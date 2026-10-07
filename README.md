# AI Rubik's Cube Solver 🧩

An interactive 3D Rubik's Cube solver featuring camera-based face scanning, step-by-step 3D move animations, and the optimal two-phase Kociemba algorithm.

---

## 🚀 Features

- **Computer Vision Scanner**: Real-time webcam scanning with perspective correction and HSV color detection to scan all 6 cube faces automatically.
- **Kociemba Two-Phase Algorithm**: Computes near-optimal solutions (under 20–22 moves) quickly.
- **Interactive 3D Visualization**: Built with Three.js / React Three Fiber for full 3D manipulation, realistic animations, and step-by-step move walkthroughs.
- **Manual & Auto Playback**: Step forward/backward through moves or let the solver animate automatically with adjustable playback speed.
- **Full State Validation**: Validates corner parity, edge parity, color counts, and orientation before solving.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Three.js / React Three Fiber, Lucide Icons
- **Backend**: FastAPI, OpenCV, NumPy, Kociemba Two-Phase Algorithm

---

## 🏁 Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📜 License

MIT License.

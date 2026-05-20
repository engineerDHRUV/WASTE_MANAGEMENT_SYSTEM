# 🗑️ Smart Waste Collection System

> An AI-powered smart waste management dashboard that optimizes garbage collection routes in real time — built with React, TypeScript, Google Gemini AI, and Motion animations.

![TypeScript](https://img.shields.io/badge/TypeScript-97.8%25-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## 📌 Problem Statement

Cities run garbage trucks on **fixed routes every single day** — regardless of whether bins are full or empty. This wastes fuel, time, and municipal resources. The Smart Waste Collection System solves this by using AI to monitor bin fill levels and dynamically generate the most efficient collection route.

---

## 🎯 Objective

To optimize waste collection routes based on real-time bin status — collecting **only from bins that need it**, in the **most fuel-efficient order possible**.

---

## ✨ Features

- **AI-powered route optimization** — Google Gemini analyzes bin data and suggests the optimal truck route
- **Live bin fill monitoring** — Visual fill-level indicators update in real time
- **Priority queue management** — Fullest bins are always collected first
- **Smart alerts** — Bins crossing 80% capacity trigger instant notifications
- **Fuel savings calculator** — Compare fixed-route vs optimized-route distances
- **City map visualization** — SVG map showing bin locations colored by fill status (green / yellow / red)
- **Route export** — Download optimized route as JSON
- **Smooth animations** — Powered by Motion (Framer Motion v12)
- **Responsive design** — Works on desktop and mobile

---

## 🧠 Data Structures & Algorithms

| Concept | Usage |
|---|---|
| **Graph** | City map modeled as an adjacency list; bins are nodes, roads are weighted edges |
| **Priority Queue** | Bins sorted by fill % — fullest bin is always collected first |
| **Array** | Stores all `GarbageBin` objects; updated in-place on fill level change |
| **Dijkstra's Algorithm** | Finds the shortest collection path across all full bins |

### OOP Classes

```
GarbageBin     → id, location, fillLevel, capacity, isFull(), getStatus()
Truck          → id, currentLocation, assignRoute(), startCollection()
RouteManager   → bins[], graph, getFullBins(), buildPriorityQueue(), optimizeRoute()
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion v12) |
| Icons | Lucide React |
| Build Tool | Vite 6 |
| Backend | Express.js (serves AI API proxy) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/engineerDHRUV/WASTE_MANAGEMENT_SYSTEM.git
cd WASTE_MANAGEMENT_SYSTEM

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

### Configuration

Open `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the App

```bash
npm run dev
```

The app runs at **http://localhost:3000**

---

## 📁 Project Structure

```
WASTE_MANAGEMENT_SYSTEM/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Dashboard, Bins Manager, Truck Tracker, DSA page
│   ├── classes/           # GarbageBin, Truck, RouteManager (OOP logic)
│   ├── algorithms/        # Dijkstra's, priority queue implementation
│   └── utils/             # Helpers, formatters
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## 📸 Live Demo

View the app live on Google AI Studio:
🔗 [https://ai.studio/apps/3c8111d3-bce1-495a-9d95-b3a4b66e9ab4](https://ai.studio/apps/3c8111d3-bce1-495a-9d95-b3a4b66e9ab4)

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Type-check with TypeScript |
| `npm run clean` | Remove build artifacts |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new branch — `git checkout -b feature/your-feature-name`
3. Commit your changes — `git commit -m 'Add some feature'`
4. Push to the branch — `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Dhruv**
GitHub: [@engineerDHRUV](https://github.com/engineerDHRUV)

---

> *"Don't collect what isn't full. Don't travel where you don't need to."*
> Built as Case Study 7 — Smart Waste Collection System (DSA + OOP Project)

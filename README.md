# 🌪️ DRRTS: Resilience in the Rupture

An **offline-first, AI-driven disaster response platform** prioritizing **equity over efficiency**.

---

## 🚨 The Problem: Efficiency vs. Equity

In the immediate aftermath of a disaster (the "rupture"), two critical failures occur:

- Communication networks routinely fail, leaving emergency management blind  
- Traditional routing algorithms optimize purely for efficiency (shortest path, lowest fuel cost)  

This creates a dangerous bias:

> Vulnerable populations in hard-to-reach or marginalized areas are systematically deprioritized, worsening the humanitarian crisis.

---

## 💡 The Solution: Engineering Empathy

**DRRTS (Disaster Resilient Response & Tactical Simulation)** is a tactical command center designed to operate seamlessly during total network blackouts.

Instead of relying on fragile cloud systems and biased algorithms, DRRTS introduces:

### 🧠 The Noble Equation

A specialized Evolutionary AI model that prioritizes **human vulnerability over distance or cost**, ensuring:

- Marginalized populations receive aid first  
- Equity is built directly into the algorithm  

---

## 🔥 Key Innovations

### 1️⃣ Offline-First Resiliency
- Works even during **complete network failure**
- Uses **IndexedDB** for local storage
- Automatically syncs when connectivity is restored  

---

### 2️⃣ Autonomous Polyglot Bridge
- Uses **MongoDB Change Data Capture (CDC)**
- Automatically updates **Neo4j graph database**
- Detects roadblocks and reroutes in real time  
- Eliminates manual sync and race conditions  

---

### 3️⃣ Tactical AI & The Noble Equation
- Uses **Genetic Algorithm (DEAP)** for optimization  
- Prioritizes **Social Vulnerability Index (SVI)**  

#### 🧮 Fitness Function:
Fitness = Total SVI - (α × Distance)


Where:
- α (alpha) = 0.05  
- SVI is heavily weighted to prioritize human need  

---

## ⚙️ Technology Stack

| Layer            | Technology                     | Purpose |
|------------------|------------------------------|--------|
| Frontend         | React, Vite, Leaflet          | Real-time dashboard & maps |
| Edge Storage     | IndexedDB                     | Offline data persistence |
| Backend API      | Node.js, Express              | Orchestration layer |
| Primary DB       | MongoDB                       | Flexible incident storage |
| Graph DB         | Neo4j                         | Fast routing & pathfinding |
| AI Engine        | Python, FastAPI, DEAP         | Genetic algorithm optimization |

---

## 🔄 How It Works (Data Flow)

1. **Report & Queue**
   - Incidents logged  
   - Stored locally if offline  

2. **Uplink Sync**
   - Data synced when network restores  

3. **Graph Cascade**
   - MongoDB triggers Neo4j updates  
   - Roadblocks remove graph edges  

4. **AI Dispatch**
   - Backend sends data to AI engine  

5. **Noble Allocation**
   - AI returns optimal routing  
   - Prioritizes high-SVI zones  

---

## 📊 DRRTS vs Traditional Systems

| Feature | Traditional CAD | DRRTS |
|--------|----------------|------|
| Routing Priority | Shortest path | Equity-first (SVI) |
| Network Dependency | Always online | Offline-first |
| Infrastructure | Static relational | Dynamic polyglot |
| Adaptability | Manual rerouting | Autonomous updates |

---

## 🌍 Global Impact

DRRTS aligns with:

- **SDG 11** – Sustainable Cities & Communities  
- **SDG 10** – Reduced Inequalities  

### Impact:
- Ensures **fair disaster response**
- Reduces **bias in aid distribution**
- Builds **resilient infrastructure**

---

## 🚀 Future Enhancements

- 🔗 Edge Mesh Networking (LAN/Bluetooth sync)
- 🚁 Drone & IoT integration for live updates
- 🤖 Deep Reinforcement Learning for predictive routing

---

## 👨‍💻 Author

**Apratim Jha**

---

## ⭐ Final Note

DRRTS is not just a system — it’s a **paradigm shift**:

> From efficiency-driven disaster response → to **equity-driven humanitarian AI**

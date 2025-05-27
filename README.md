# 📉 PricePulse – Price Drop Alert & Tracker

**PricePulse** is a full-stack web application that tracks Amazon product prices and alerts users via email when a price drop hits their specified threshold. It also leverages LLMs and APIs to extract metadata and compare prices across multiple e-commerce platforms.

## 🔗 Live Demo

- **Frontend (Vercel)**: [price-drop-alert-seven.vercel.app](https://price-drop-alert-seven.vercel.app/)
- **Backend (Railway)**:
  - FastAPI service
  - Scheduler service (runs every 30 minutes)

---

## 🧠 Features

### ✅ Core Features (Amazon Tracker)
- 🔍 Input field for Amazon product URL
- 🕒 Scheduler scrapes price every 30 minutes
- 📉 Live graph showing historical prices
- 🖼️ Product name, image, and current price preview
- 📬 Email alerts when price drops below a threshold

### 🌟 Bonus Features (Multi-Platform + Generative AI)
- 🧠 Uses LLMs (gemini-1.5-flash) to extract product metadata (name, brand, model)
- 🌐 Searches and compares prices across other platforms (via Serper.dev & scraping)
- 📊 Similar Products suggestions
- 📈 Price comparison table across platforms

---

## 🛠️ Tech Stack

### 🧩 Frontend (Vercel)
- [Vite](https://vitejs.dev/) + [React](https://reactjs.org/)
- TypeScript
- TailwindCSS + shadcn/ui
- Firebase Authentication (Email/Password + Google Sign-In)
- Firestore (Product & user tracking data)

### ⚙️ Backend (Railway - Dockerized)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Playwright](https://playwright.dev/) (for scraping)
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) (for HTML parsing)
- Firebase Admin SDK
- APScheduler (for cron jobs)
- Gemini API, Google Generative AI, SerpAPI

---

## 🚀 How to Run Locally

### 1. Clone the Repo

```bash
git clone https://github.com/saibharath954/Price-Drop-Alert.git
cd Price-Drop-Alert
````

---

### 2. Backend Setup

#### Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Run FastAPI server

```bash
uvicorn app.main:app --reload
```

#### Run Scheduler

```bash
python scheduler.py
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Deployment

### Backend (Railway)

* Deployed using two Dockerfiles:

  * `Dockerfile.web` for FastAPI API
  * `Dockerfile.scheduler` runs every 30 minutes to check and alert on price drops

### Frontend (Vercel)

* Auto-deployed on push to main branch

---

## 🧪 Example Technologies Used

| Category       | Tech / Library                       |
| -------------- | ------------------------------------ |
| Web Framework  | FastAPI, Vite, React, TypeScript     |
| Scraping       | Playwright, BeautifulSoup            |
| Auth & Storage | Firebase Auth, Firestore             |
| Scheduler      | APScheduler                          |
| LLMs & APIs    | Gemini, Google Generative AI, SerpAPI|
| Charting       | React Chart Library (e.g., Recharts) |
| Deployment     | Railway, Vercel                      |

---

## 📬 Contact

Built with 💙 by [@saibharath954](https://github.com/saibharath954)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```

---

Let me know if you'd like to include screenshots, contribution guidelines, or badges (build, license, deployment status) in the README as well.
```

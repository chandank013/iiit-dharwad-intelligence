 # 🎓 IIIT Dharwad AIS — Academic Intelligence System

> An AI-powered academic platform built for **IIIT Dharwad** to streamline course management, assignment evaluation, and student performance tracking.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=flat-square&logo=mongodb)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?style=flat-square&logo=firebase)
![Groq](https://img.shields.io/badge/Groq-AI-blue?style=flat-square)

---

## 📖 Overview

IIIT Dharwad AIS is an intelligent academic system that enhances both teaching and learning experiences using AI. It provides tools for **professors** to manage courses and assignments efficiently, while offering **students** detailed feedback, analytics, and personalized learning resources.

---

## ✨ Features

### 🔐 Authentication & Access Control
- Secure login system for Professors and Students
- Role-based routing and access management

### 📚 Course Management
- Create, manage, and archive courses
- Auto-generated join codes for student enrollment

### 📝 Assignment System
- Rich assignment creation with deadlines, multiple submission formats, late submission policies, resubmission options, and leaderboard support
- Supported formats: **Text, File, ZIP, GitHub Link, Google Drive Link**

### 🤖 AI-Powered Features
- **Rubric Generator** — Automatically suggests evaluation rubrics
- **AI Grading** — Submission evaluation with feedback and scoring
- **Plagiarism Detection** — Cross-submission comparison using AI
- **Group Evaluation** — Fair grading based on contribution and commit history

### 📊 Analytics Dashboard
- Class performance insights and grade distribution
- Weak area detection and student progress tracking

### 📈 Student Features
- Personalized AI feedback reports
- AI-suggested learning resources
- Auto-generated **portfolio with shareable link**

### 💬 Communication
- Announcements, messaging, and deadline reminders

### 🤖 AI Chatbot Assistant
- Helps students with queries and hints
- Assists professors with quick insights

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS, TypeScript |
| Backend | Node.js |
| Database | MongoDB |
| Hosting | Firebase |
| AI | Groq API |
| Auth | Role-based system |

---

## 📁 Project Structure

```
iiit-dharwad-intelligence/
├── src/
│   ├── ai/              # AI integration logic (Groq)
│   ├── app/             # Next.js app router pages
│   ├── components/      # Reusable UI components
│   ├── firebase/        # Firebase config & helpers
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions
├── docs/                # Documentation
├── .env                 # Environment variables (DO NOT COMMIT)
├── apphosting.yaml      # Firebase App Hosting config
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS config
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project metadata & scripts
```

---

## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd iiit-dharwad-intelligence
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_API_URL=your_api_base_url

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment

This project is configured for **Firebase App Hosting** via `apphosting.yaml`.

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

---

## 🎨 UI Design Guidelines

| Property | Value |
|---|---|
| Primary Color | `#3A7CA5` |
| Secondary Color | `#4AB9D6` |
| Heading Font | Space Grotesk |
| Body Font | Inter |
| Code Font | Source Code Pro |
| Theme | Light, clean academic UI |

---

## ⚠️ Important Notes

- **Never commit `.env`** — keep API keys and credentials secure
- **`node_modules/`** should not be committed (covered by `.gitignore`)
- Firebase rules are managed in `firestore.rules`

---

## 🔮 Roadmap

- [ ] Advanced analytics with ML models
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] LMS integrations (Moodle, Canvas)
- [ ] Detailed audit logs and admin panel

---

## 👨‍💻 Author

**Chandan Kumar**  
B.Tech — IIIT Dharwad

---

## 📄 License

This project is developed for academic and educational purposes at IIIT Dharwad.
AI Prompt Architect ⚡

A modern, minimalist web application designed to transform rough, plain text ideas—written in English, Roman Urdu, or any local language—into structured, high-performance professional prompts optimized for AI models.

Built with a clean UI/UX inspired by Linear and Vercel, it features real-time voice dictation, multi-engine speech recognition, and instant structured prompt generation.

✨ Key Features

🗣️ Instant Voice-to-Text Dictation: Seamless microphone integration with support for multiple languages (English, Urdu / Roman Urdu, Hindi, Arabic, and German) featuring real-time speech transcription without page reloads.

🌐 Multilingual & Local Language Support: Write or speak your thoughts naturally in your native language, and watch the app intelligently interpret your intent.

📐 Structured Prompt Breakdown: Automatically formats raw input into industry-standard AI prompting components:

Role (Expert persona assignment)

Context & Objective (Background and goal)

Task Instructions (Step-by-step guidance)

Constraints & Format (Output guardrails and styling)

🎛️ Use-Case Presets: Tailor your prompts instantly for General, Coding, Writing, Image Generation, or Analysis.

🌓 Modern Minimalist UI/UX: Clean monochrome aesthetic featuring a Light/Dark theme toggle, keyboard shortcuts (⌘/Ctrl + Enter), quick-load sample pills, and a one-click copy button.

🚀 Quick Start

Clone the repository:

git clone https://github.com/Sheri0098/Roman-urdu-to-prompt.git
cd Roman-urdu-to-prompt


Install dependencies:

npm install


Run the development server:

npm run dev


AI features call a serverless function (`api/gemini.js`) that needs a `GEMINI_API_KEY` environment variable. On Vercel, add it under Settings → Environment Variables. Locally, use `vercel dev` with a `.env.local` file.


🛠️ Tech Stack

React (Component Architecture & State Management)

Tailwind CSS (Styling & Modern Minimalist UI Design)

Lucide Icons (Clean, Lightweight Vector Icons)

Web Speech API & MediaRecorder (Multi-tier speech recognition & audio handling)

💡 How to Use

Select your desired Category Preset (e.g., Coding or Writing).

Type your rough idea in the left box—or click the Voice button to speak naturally in your local language or English.

Click Convert Prompt (or press ⌘/Ctrl + Enter).

Review the engineered prompt in the right box, switch between the Master Prompt and Breakdown views, and click Copy Prompt!

📄 License

Distributed under the MIT License. See LICENSE for more information.

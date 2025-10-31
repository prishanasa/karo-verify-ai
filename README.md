# karo-verify-ai
> AI-powered verification front-end built with Vite, React, TypeScript, Tailwind CSS & shadcn-ui

---

## Table of Contents
- [About](#about)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running Locally](#running-locally)
- [Features](#features)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About
karo-verify-ai is a front-end verification interface built with modern web technologies (Vite + React + TypeScript + Tailwind CSS) and styled using shadcn-ui.  
The live demo is available at: [karo-verify-ai.vercel.app](https://karo-verify-ai.vercel.app/auth)   https://karo-verify-ai.lovable.app/auth

This repository contains the UI layer which integrates with backend services (e.g., Supabase) to provide an end-to-end verification experience.

---

## Technologies Used
- **Vite** — Fast build and development tooling  
- **React with TypeScript** — For robust, type-safe component development  
- **Tailwind CSS** — Utility-first styling  
- **shadcn-ui** — Component library built on Tailwind and Radix UI  
- **Supabase** — Backend services (authentication, database)

---

## Getting Started

### Prerequisites
- Node.js v16+  
- npm or yarn  
- A Supabase (or other backend) project with required environment variables

### Installation
```bash
# Clone the repository
git clone https://github.com/prishanasa/karo-verify-ai.git
cd karo-verify-ai

# Install dependencies
npm install
# or
yarn install
## 🛠 Configuration

Create a `.env` file in the **root directory** of your project and add the following environment variables:

bash
# Supabase Configuration
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>

# Optional: Add other environment keys here as needed
# Example:
# VITE_API_BASE_URL=<your_backend_api_url>
# VITE_ENVIRONMENT=development

##Features
# 🔍 OCR (Optical Character Recognition)
# Extracts text such as Name, DOB, and ID Number from uploaded ID cards.

# 🧠 Face Similarity Detection
# Compares the live/selfie photo with the ID card photo to verify identity.
# 📂 Document Upload System
# Allows secure uploading of ID cards and photos.

# ⚙ Fuzzy Logic Fraud Scoring
# Calculates a fraud score based on text and face match confidence.

# 📊 Verification Dashboard
# Displays extracted data, similarity scores, and overall verification results.

# 🌐 Responsive Web Interface
# Works seamlessly on desktops, tablets, and mobile devices.

# 🧾 Error Handling & Validation
# Validates image formats and handles invalid or unclear uploads gracefully.

# 🧩 Modular Code Structure
# Clean and extensible codebase for easy maintenance and upgrades.

##Project Structure
karo-verify-ai/
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages
│   ├── styles/         # Tailwind and custom styles
│   └── utils/          # Helper functions
├── supabase/           # Supabase client and backend integration
├── .env                # Environment variables
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation

##Usage
# ▶️ Run the Project Locally
# Start the development server and open it in your browser.
npm run dev
# or
yarn dev

# 🌐 Open in Browser
# Visit the local URL to view the app.
# Default: http://localhost:5173

# 🔑 Authentication
# Navigate to /auth to sign up or log in to your account.
# 📊 Verification Dashboard
# Upload documents or images for verification.
# View extracted text, similarity scores, and fraud analysis.
# Manage user profile and account settings.

# 🏗 Build for Production
# Create an optimized production build of the app.
npm run build
# or
yarn build

# 🚀 Deployment
# Deploy the 'dist' folder to your preferred hosting platform.
# Example: Vercel, Netlify, or any static hosting service.

# 🧩 Extend Functionality
# Add new pages or components in the 'src' folder
# to enhance and customize the project features.




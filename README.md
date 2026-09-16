 # ✈️ TripPilot

TripPilot is an AI-powered travel planning platform that helps users create personalized trips based on their destination, duration, travelers, origin, and budget.

It combines AI trip planning with real-world travel research so users can explore researched hotels, attractions, activities, restaurants, and transportation options before building their final itinerary.

---

## 🌍 Features

- 🤖 AI-powered trip planning
- 💰 Budget-aware itineraries
- 🗺️ Destination-based travel planning
- 👥 Multiple travelers support
- ✈️ Flight planning
- 🏨 Hotel recommendations
- 🎟️ Attraction research
- 🎯 Activity recommendations
- 🍽️ Restaurant research
- 🚆 Local transportation research
- 🔎 Real-world web research
- 🔗 Source links for researched options
- 🔐 Google authentication with Clerk
- 💬 Multi-turn trip planning conversation
- 📱 Responsive modern UI

---

## 🧠 How TripPilot Works

### 1. Tell TripPilot about your trip

Users can provide information naturally, for example:

> I want to visit Berlin, Germany for 5 days, for 2 people, from Karachi, with a budget of Rs. 300,000.

TripPilot understands the request and extracts the important travel details.

### 2. AI creates an initial plan

Groq generates a personalized trip plan including:

- Destination
- Duration
- Travelers
- Estimated budget
- Hotel recommendation
- Budget breakdown
- Day-by-day itinerary
- Activities
- Travel notes
- Assumptions

### 3. Research real travel options

TripPilot uses Firecrawl to research publicly available travel information from the web.

Research categories include:

- Hotels
- Attractions
- Activities
- Restaurants
- Transportation
- Travel information

Each researched option includes its original source when available.

### 4. Choose what you like

Users can select researched hotels, attractions, activities, and other options.

### 5. Final itinerary optimization

The selected options can be used by the AI to build a personalized final itinerary around the user's budget and preferences.

---

## 🛠️ Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- Framer Motion

### AI

- Groq API
- `openai/gpt-oss-20b`

### Web Research

- Firecrawl

### Authentication

- Clerk
- Google Sign-In

---

## 📁 Project Structure

```text
ai-travel-agent/
│
├── app/
│   ├── api/
│   │   ├── plan-trip/
│   │   │   └── route.ts
│   │   │
│   │   └── research/
│   │       └── route.ts
│   │
│   ├── icon.png
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── public/
│
├── proxy.ts
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md

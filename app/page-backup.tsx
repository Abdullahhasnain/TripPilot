"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Plane,
  Sparkles,
  Star,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Plane size={18} />
          </div>
          TripPilot
        </div>

        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#" className="hover:text-slate-950">
            Explore
          </a>
          <a href="#" className="hover:text-slate-950">
            How it works
          </a>
          <a href="#" className="hover:text-slate-950">
            Pricing
          </a>
        </div>

        <button className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium shadow-sm">
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
          >
            <Sparkles size={15} />
            Your personal AI travel agent
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-semibold tracking-tight md:text-7xl"
          >
            Plan your entire trip
            <span className="block text-slate-500">with AI.</span>
          </motion.h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Tell us where you want to go. TripPilot finds flights, hotels,
            activities and creates a personalized itinerary around your budget.
          </p>
        </div>

        {/* Trip Planner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/60">
            <div className="rounded-2xl bg-slate-50 p-6">
              <div className="mb-5 flex items-center gap-2 text-sm font-medium">
                <Sparkles size={16} />
                What can I plan for you?
              </div>

              <textarea
                placeholder="e.g. Plan a 4-day Karachi trip from Lahore for 2 people under Rs. 80,000..."
                className="min-h-32 w-full resize-none border-none bg-transparent text-lg outline-none placeholder:text-slate-400"
              />

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                    <MapPin size={14} />
                    Destination
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                    <CalendarDays size={14} />
                    Dates
                  </div>
                </div>

                <button className="flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                  Plan my trip
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
          <span>✦ Personalized</span>
          <span>✦ Budget-aware</span>
          <span>✦ AI-powered</span>
        </div>
      </section>

      {/* Example Trip */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <p className="text-sm font-medium text-slate-500">HOW IT WORKS</p>
            <h2 className="mt-2 text-3xl font-semibold">
              From one message to a complete trip.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: <Plane size={20} />,
                title: "Find the best options",
                text: "Compare flights and hotels according to your budget and preferences.",
              },
              {
                icon: <MapPin size={20} />,
                title: "Build your itinerary",
                text: "Get a day-by-day plan with activities, food and travel time.",
              },
              {
                icon: <Sparkles size={20} />,
                title: "Optimize everything",
                text: "Ask the AI to change your budget, hotel, activities or schedule anytime.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 p-7"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  {item.icon}
                </div>

                <h3 className="text-lg font-semibold">{item.title}</h3>

                <p className="mt-2 leading-7 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Trip */}
      <section className="bg-[#f7f8fc] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={15} />
                  Karachi, Pakistan
                </div>

                <h2 className="mt-2 text-3xl font-semibold">
                  Your 3-day Karachi trip
                </h2>

                <p className="mt-2 text-slate-500">
                  2 travelers · 20–23 October
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-slate-500">Estimated total</p>
                <p className="text-3xl font-semibold">Rs. 66,500</p>
              </div>
            </div>

            <div className="my-8 h-px bg-slate-200" />

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["✈️", "Flights", "Rs. 28,500"],
                ["🏨", "Hotel", "Rs. 18,000"],
                ["🎯", "Activities", "Rs. 4,000"],
              ].map(([emoji, title, price]) => (
                <div
                  key={title}
                  className="rounded-2xl bg-slate-50 p-5"
                >
                  <div className="text-2xl">{emoji}</div>
                  <p className="mt-3 text-sm text-slate-500">{title}</p>
                  <p className="mt-1 font-semibold">{price}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-2">
                <Star size={17} />
                <span className="font-medium">AI recommendation</span>
              </div>

              <p className="mt-3 leading-7 text-slate-300">
                Stay around Clifton for easier access to your planned
                activities while keeping the total trip comfortably below
                your Rs. 80,000 budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl justify-between px-6 text-sm text-slate-500">
          <span>© 2026 TripPilot</span>
          <span>AI-powered travel planning</span>
        </div>
      </footer>
    </main>
  );
}
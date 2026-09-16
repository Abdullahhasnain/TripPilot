"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Hotel,
  Loader2,
  Menu,
  MessageSquare,
  Plane,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

type TripPlan = {
  status?: string;

  destination?: string;
  duration?: string;
  travelers?: number;
  summary?: string;
  estimated_total?: string;

  trip_request?: {
    origin?: string;
    destination?: string;
    dates?: string;
    duration?: string;
    travelers?: number;
    budget?: string;
    transport_preference?: string;
    preferences?: string[];
  };

  hotel?: {
    name?: string;
    location?: string;
    estimated_price?: string;
    estimated_cost?: string;
    reason?: string;
  };

  itinerary?: {
    day: number;
    title: string;
    activities: {
      time?: string;
      activity?: string;
      estimated_cost?: string;
    }[];
  }[];

  activities?: {
    name?: string;
    description?: string;
    estimated_cost?: string;
  }[];

  cost_breakdown?: {
    category?: string;
    estimated_cost?: string;
  }[];

  budget_breakdown?: {
    flights?: string;
    hotel?: string;
    food?: string;
    activities?: string;
    transport?: string;
    other?: string;
  };

  travel_notes?: string[];
  notes?: string[];
  assumptions?: string[];
};

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ResearchHotel = {
  name?: string;
  location?: string;
  rating?: string;
  price?: string;
  description?: string;
  source_url?: string;
};

type ResearchFlight = {
  airline?: string;
  route?: string;
  duration?: string;
  stops?: string;
  price?: string;
  baggage?: string;
  source_url?: string;
};

type ResearchAttraction = {
  name?: string;
  description?: string;
  ticket_price?: string;
  opening_info?: string;
  recommended_time?: string;
  source_url?: string;
};

type ResearchActivity = {
  name?: string;
  description?: string;
  price?: string;
  source_url?: string;
};

type ResearchRestaurant = {
  name?: string;
  description?: string;
  price_level?: string;
  source_url?: string;
};

type ResearchTransport = {
  name?: string;
  description?: string;
  price?: string;
  source_url?: string;
};

type ResearchData = {
  destination?: string;
  hotels?: ResearchHotel[];
  flights?: ResearchFlight[];
  attractions?: ResearchAttraction[];
  activities?: ResearchActivity[];
  restaurants?: ResearchRestaurant[];
  transport?: ResearchTransport[];
  travel_tips?: string[];
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);

  const [loading, setLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);

  const [error, setError] = useState("");
  const [researchError, setResearchError] = useState("");

  const [research, setResearch] =
    useState<ResearchData | null>(null);

  const [selectedHotel, setSelectedHotel] =
    useState<ResearchHotel | null>(null);

  const [selectedFlight, setSelectedFlight] =
    useState<ResearchFlight | null>(null);

  const [selectedAttractions, setSelectedAttractions] =
    useState<ResearchAttraction[]>([]);

  const [selectedActivities, setSelectedActivities] =
    useState<ResearchActivity[]>([]);

  const [conversation, setConversation] = useState<
    ConversationMessage[]
  >([]);

  const [mobileMenu, setMobileMenu] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenu(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleNewTrip = () => {
    setMessage("");
    setTripPlan(null);
    setResearch(null);
    setError("");
    setResearchError("");
    setResearchLoading(false);

    setSelectedHotel(null);
    setSelectedFlight(null);
    setSelectedAttractions([]);
    setSelectedActivities([]);

    setConversation([]);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleResearch = async (
    destination: string
  ) => {
    setResearchLoading(true);
    setResearchError("");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to research travel options."
        );
      }

      setResearch(data.research || null);

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 150);
    } catch (err) {
      setResearchError(
        err instanceof Error
          ? err.message
          : "Unable to research travel options."
      );
    } finally {
      setResearchLoading(false);
    }
  };

  const toggleAttraction = (
    attraction: ResearchAttraction
  ) => {
    setSelectedAttractions((previous) => {
      const exists = previous.some(
        (item) =>
          item.name === attraction.name
      );

      if (exists) {
        return previous.filter(
          (item) =>
            item.name !== attraction.name
        );
      }

      return [...previous, attraction];
    });
  };

  const toggleActivity = (
    activity: ResearchActivity
  ) => {
    setSelectedActivities((previous) => {
      const exists = previous.some(
        (item) =>
          item.name === activity.name
      );

      if (exists) {
        return previous.filter(
          (item) =>
            item.name !== activity.name
        );
      }

      return [...previous, activity];
    });
  };

  const handlePlanTrip = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/plan-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          conversation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Something went wrong."
        );
      }

      setConversation((previous) => [
        ...previous,
        {
          role: "user",
          content: trimmedMessage,
        },
        {
          role: "assistant",
          content: data.message || "",
        },
      ]);

      setMessage("");

      if (data.status === "complete") {
        setTripPlan(data);

        const destination =
          data.destination ||
          data.trip_request?.destination;

        if (destination) {
          await handleResearch(destination);
        }

        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to plan your trip right now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <button
            onClick={handleNewTrip}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Compass size={19} />
            </div>

            <span className="text-lg font-bold tracking-tight">
              TripPilot
            </span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">

            <button
              onClick={() =>
                scrollToSection("planner")
              }
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Explore
            </button>

            <button
              onClick={() =>
                scrollToSection("how-it-works")
              }
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              How it works
            </button>

            <button
              onClick={() =>
                scrollToSection("pricing")
              }
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Pricing
            </button>

          </nav>

          <div className="hidden items-center gap-3 md:flex">

            <Show when="signed-out">

              <SignInButton>
                <button className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Sign in
                </button>
              </SignInButton>

              <SignInButton>
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Get started
                </button>
              </SignInButton>

            </Show>

            <Show when="signed-in">

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />

            </Show>

          </div>

          <button
            onClick={() =>
              setMobileMenu((value) => !value)
            }
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

        </div>

        {mobileMenu && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">

            <div className="flex flex-col gap-2">

              <button
                onClick={() =>
                  scrollToSection("planner")
                }
                className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Explore
              </button>

              <button
                onClick={() =>
                  scrollToSection("how-it-works")
                }
                className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                How it works
              </button>

              <button
                onClick={() =>
                  scrollToSection("pricing")
                }
                className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Pricing
              </button>

              <div className="mt-2 border-t border-slate-200 pt-3">

                <Show when="signed-out">

                  <SignInButton>
                    <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                      Sign in
                    </button>
                  </SignInButton>

                </Show>

                <Show when="signed-in">

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">

                    <span className="text-sm font-medium text-slate-700">
                      Your account
                    </span>

                    <UserButton />

                  </div>

                </Show>

              </div>

            </div>

          </div>
        )}

      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(226,232,240,0.7),transparent_35%),radial-gradient(circle_at_top_left,rgba(241,245,249,0.9),transparent_30%)]" />

        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 md:pb-24 md:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">

          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <Sparkles size={14} />
              AI-powered travel planning
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Plan your entire trip
              <span className="block text-slate-500">
                with AI.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Tell us where you want to go.
              TripPilot builds a personalized
              itinerary around your destination,
              travelers and budget.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">

              <span className="rounded-full bg-slate-100 px-3 py-2">
                ✦ Personalized
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-2">
                ✦ Budget-aware
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-2">
                ✦ AI-powered
              </span>

            </div>

          </div>

          {/* PLANNER */}
          <div
            id="planner"
            className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_25px_70px_rgba(15,23,42,0.10)] sm:p-7"
          >

            <div className="mb-5">

              <p className="text-sm font-semibold text-slate-950">
                What can I plan for you?
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Start with a destination or simply
                tell me what you need.
              </p>

            </div>

            <form onSubmit={handlePlanTrip}>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  placeholder="e.g. I want to visit Dubai..."
                  rows={4}
                  className="w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <div className="flex items-center justify-between border-t border-slate-200 pt-2">

                  <span className="px-2 text-xs text-slate-400">
                    You can add details step by step
                  </span>

                  <button
                    type="submit"
                    disabled={
                      loading || !message.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {loading ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Planning...
                      </>
                    ) : (
                      <>
                        Plan my trip
                        <ArrowRight size={16} />
                      </>
                    )}

                  </button>

                </div>

              </div>

            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {conversation.length > 0 && (
              <div className="mt-6 space-y-3">

                {conversation.map(
                  (item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={`flex ${
                        item.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          item.role === "user"
                            ? "bg-slate-950 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.content}
                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

      </section>

      {/* RESULTS */}
      {tripPlan && (
        <section className="border-t border-slate-200 bg-slate-50">

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Your trip
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {tripPlan.destination ||
                    "Your personalized trip"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {tripPlan.duration ||
                    "Custom itinerary"}

                  {tripPlan.travelers
                    ? ` · ${tripPlan.travelers} travelers`
                    : ""}
                </p>

              </div>

              <button
                onClick={handleNewTrip}
                className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Start new trip
              </button>

            </div>

            {/* SUMMARY CARDS */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Plane size={19} />
                </div>

                <p className="text-xs font-medium text-slate-500">
                  Destination
                </p>

                <p className="mt-1 font-semibold">
                  {tripPlan.destination || "—"}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <CalendarDays size={19} />
                </div>

                <p className="text-xs font-medium text-slate-500">
                  Duration
                </p>

                <p className="mt-1 font-semibold">
                  {tripPlan.duration || "—"}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Users size={19} />
                </div>

                <p className="text-xs font-medium text-slate-500">
                  Travelers
                </p>

                <p className="mt-1 font-semibold">
                  {tripPlan.travelers || "—"}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <CircleDollarSign size={19} />
                </div>

                <p className="text-xs font-medium text-slate-500">
                  Estimated total
                </p>

                <p className="mt-1 font-semibold">
                  {tripPlan.estimated_total || "—"}
                </p>

              </div>

            </div>

            {/* SUMMARY */}
            {tripPlan.summary && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">

                <div className="flex gap-4">

                  <MessageSquare
                    size={20}
                    className="mt-0.5 shrink-0 text-slate-500"
                  />

                  <p className="text-sm leading-7 text-slate-600">
                    {tripPlan.summary}
                  </p>

                </div>

              </div>
            )}

            {/* ORIGINAL PLAN */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">

              {/* HOTEL */}
              {tripPlan.hotel && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Hotel size={19} />
                    </div>

                    <div>

                      <p className="text-xs font-medium text-slate-500">
                        AI recommended stay
                      </p>

                      <h3 className="font-bold">
                        {tripPlan.hotel.name ||
                          "Hotel"}
                      </h3>

                    </div>

                  </div>

                  <div className="space-y-3 text-sm">

                    {tripPlan.hotel.location && (
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">
                          Location:
                        </span>{" "}
                        {tripPlan.hotel.location}
                      </p>
                    )}

                    {(tripPlan.hotel.estimated_price ||
                      tripPlan.hotel.estimated_cost) && (
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">
                          Estimated cost:
                        </span>{" "}
                        {tripPlan.hotel.estimated_price ||
                          tripPlan.hotel.estimated_cost}
                      </p>
                    )}

                    {tripPlan.hotel.reason && (
                      <p className="leading-6 text-slate-600">
                        {tripPlan.hotel.reason}
                      </p>
                    )}

                  </div>

                </div>
              )}

              {/* COST BREAKDOWN */}
              {tripPlan.cost_breakdown &&
                tripPlan.cost_breakdown.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">

                    <div className="mb-5 flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                        <CircleDollarSign size={19} />
                      </div>

                      <div>

                        <p className="text-xs font-medium text-slate-500">
                          Budget
                        </p>

                        <h3 className="font-bold">
                          Estimated breakdown
                        </h3>

                      </div>

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">

                      {tripPlan.cost_breakdown.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-slate-50 p-4"
                          >

                            <p className="text-xs capitalize text-slate-500">
                              {item.category ||
                                "Other"}
                            </p>

                            <p className="mt-1 font-semibold">
                              {item.estimated_cost ||
                                "—"}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

            </div>

            {/* ITINERARY */}
            {tripPlan.itinerary &&
              tripPlan.itinerary.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">

                  <div className="mb-6">

                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Day by day
                    </p>

                    <h3 className="mt-1 text-xl font-bold">
                      Your itinerary
                    </h3>

                  </div>

                  <div className="space-y-4">

                    {tripPlan.itinerary.map(
                      (day) => (
                        <div
                          key={day.day}
                          className="rounded-2xl border border-slate-200 p-5"
                        >

                          <div className="flex gap-4">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                              {day.day}
                            </div>

                            <div className="min-w-0 flex-1">

                              <h4 className="font-bold">
                                {day.title}
                              </h4>

                              <div className="mt-4 space-y-3">

                                {day.activities?.map(
                                  (
                                    activity,
                                    index
                                  ) => (
                                    <div
                                      key={index}
                                      className="rounded-xl bg-slate-50 p-4"
                                    >

                                      <div className="flex gap-3">

                                        <Check
                                          size={16}
                                          className="mt-1 shrink-0"
                                        />

                                        <div className="min-w-0">

                                          {activity.time && (
                                            <p className="text-xs font-semibold text-slate-400">
                                              {activity.time}
                                            </p>
                                          )}

                                          <p className="mt-1 text-sm leading-6 text-slate-700">
                                            {activity.activity}
                                          </p>

                                          {activity.estimated_cost &&
                                            activity.estimated_cost !==
                                              "0" &&
                                            activity.estimated_cost !==
                                              "Rs. 0" && (
                                              <p className="mt-1 text-xs font-medium text-slate-500">
                                                Estimated cost:{" "}
                                                {
                                                  activity.estimated_cost
                                                }
                                              </p>
                                            )}

                                        </div>

                                      </div>

                                    </div>
                                  )
                                )}

                              </div>

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            {/* ACTIVITIES */}
            {tripPlan.activities &&
              tripPlan.activities.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">

                  <h3 className="text-xl font-bold">
                    Recommended activities
                  </h3>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {tripPlan.activities.map(
                      (activity, index) => (
                        <div
                          key={index}
                          className="rounded-xl bg-slate-50 p-4"
                        >

                          <div className="flex items-start gap-3">

                            <ChevronRight
                              size={16}
                              className="mt-1 shrink-0"
                            />

                            <div>

                              <p className="text-sm font-semibold text-slate-900">
                                {activity.name ||
                                  "Activity"}
                              </p>

                              {activity.description && (
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {activity.description}
                                </p>
                              )}

                              {activity.estimated_cost &&
                                activity.estimated_cost !==
                                  "0" &&
                                activity.estimated_cost !==
                                  "Rs. 0" && (
                                  <p className="mt-2 text-xs font-medium text-slate-500">
                                    Estimated cost:{" "}
                                    {
                                      activity.estimated_cost
                                    }
                                  </p>
                                )}

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            {/* TRAVEL NOTES */}
            {((tripPlan.travel_notes &&
              tripPlan.travel_notes.length > 0) ||
              (tripPlan.notes &&
                tripPlan.notes.length > 0) ||
              (tripPlan.assumptions &&
                tripPlan.assumptions.length > 0)) && (
              <div className="mt-6 grid gap-6 md:grid-cols-2">

                {(tripPlan.travel_notes ||
                  tripPlan.notes) &&
                  (
                    tripPlan.travel_notes ||
                    tripPlan.notes
                  )!.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                      <h3 className="font-bold">
                        Travel notes
                      </h3>

                      <ul className="mt-4 space-y-2">

                        {(tripPlan.travel_notes ||
                          tripPlan.notes ||
                          []).map(
                          (note, index) => (
                            <li
                              key={index}
                              className="text-sm leading-6 text-slate-600"
                            >
                              • {note}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}

                {tripPlan.assumptions &&
                  tripPlan.assumptions.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                      <h3 className="font-bold">
                        Assumptions
                      </h3>

                      <ul className="mt-4 space-y-2">

                        {tripPlan.assumptions.map(
                          (
                            assumption,
                            index
                          ) => (
                            <li
                              key={index}
                              className="text-sm leading-6 text-slate-600"
                            >
                              • {assumption}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}

              </div>
            )}

            {/* RESEARCH SECTION */}
            <div className="mt-10">

              <div className="mb-6">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Real-world research
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-tight">
                  Explore researched options
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  TripPilot searches travel sources and
                  organizes useful options for you to review.
                  Prices and availability should always be
                  confirmed on the original source.
                </p>

              </div>

              {/* RESEARCH LOADING */}
              {researchLoading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8">

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />
                    </div>

                    <div>

                      <p className="font-semibold">
                        Researching travel options...
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Searching hotels, attractions,
                        activities, restaurants and transport.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* RESEARCH ERROR */}
              {researchError && !researchLoading && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                  <p className="font-semibold text-amber-900">
                    Research could not be completed
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    {researchError}
                  </p>

                </div>
              )}

              {/* RESEARCH RESULTS */}
              {research && !researchLoading && (

                <div className="space-y-8">

                  {/* HOTELS */}
                  {research.hotels &&
                    research.hotels.length > 0 && (
                      <div>

                        <div className="mb-4 flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                            <Hotel size={19} />
                          </div>

                          <div>

                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                              Stay
                            </p>

                            <h4 className="text-xl font-bold">
                              Hotel options
                            </h4>

                          </div>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                          {research.hotels.map(
                            (hotel, index) => {

                              const selected =
                                selectedHotel?.name ===
                                hotel.name;

                              return (
                                <div
                                  key={`${hotel.name}-${index}`}
                                  className={`rounded-2xl border bg-white p-5 transition ${
                                    selected
                                      ? "border-slate-950 ring-2 ring-slate-950/10"
                                      : "border-slate-200"
                                  }`}
                                >

                                  <div className="flex items-start justify-between gap-3">

                                    <div>

                                      <h5 className="font-bold">
                                        {hotel.name ||
                                          "Hotel option"}
                                      </h5>

                                      {hotel.location && (
                                        <p className="mt-1 text-xs text-slate-500">
                                          {hotel.location}
                                        </p>
                                      )}

                                    </div>

                                    {selected && (
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                                        <Check size={14} />
                                      </div>
                                    )}

                                  </div>

                                  {hotel.rating && (
                                    <p className="mt-3 text-sm font-semibold">
                                      Rating:{" "}
                                      {hotel.rating}
                                    </p>
                                  )}

                                  {hotel.price && (
                                    <p className="mt-2 text-sm font-semibold text-slate-700">
                                      Source-listed price:{" "}
                                      {hotel.price}
                                    </p>
                                  )}

                                  {hotel.description && (
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                      {hotel.description}
                                    </p>
                                  )}

                                  <div className="mt-5 flex flex-wrap gap-2">

                                    <button
                                      onClick={() =>
                                        setSelectedHotel(
                                          selected
                                            ? null
                                            : hotel
                                        )
                                      }
                                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        selected
                                          ? "bg-slate-200 text-slate-900"
                                          : "bg-slate-950 text-white hover:bg-slate-800"
                                      }`}
                                    >
                                      {selected
                                        ? "Selected"
                                        : "Select hotel"}
                                    </button>

                                    {hotel.source_url && (
                                      <a
                                        href={
                                          hotel.source_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        View source
                                      </a>
                                    )}

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    )}

                  {/* FLIGHTS */}
                  {research.flights &&
                    research.flights.length > 0 && (
                      <div>

                        <div className="mb-4 flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                            <Plane size={19} />
                          </div>

                          <div>

                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                              Air travel
                            </p>

                            <h4 className="text-xl font-bold">
                              Flight options
                            </h4>

                          </div>

                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">

                          {research.flights.map(
                            (flight, index) => {

                              const selected =
                                selectedFlight?.airline ===
                                  flight.airline &&
                                selectedFlight?.route ===
                                  flight.route;

                              return (
                                <div
                                  key={`${flight.airline}-${flight.route}-${index}`}
                                  className={`rounded-2xl border bg-white p-5 ${
                                    selected
                                      ? "border-slate-950 ring-2 ring-slate-950/10"
                                      : "border-slate-200"
                                  }`}
                                >

                                  <div className="flex items-start justify-between gap-4">

                                    <div>

                                      <h5 className="font-bold">
                                        {flight.airline ||
                                          "Flight option"}
                                      </h5>

                                      {flight.route && (
                                        <p className="mt-1 text-sm text-slate-600">
                                          {flight.route}
                                        </p>
                                      )}

                                    </div>

                                    {selected && (
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white">
                                        <Check size={14} />
                                      </div>
                                    )}

                                  </div>

                                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">

                                    {flight.duration && (
                                      <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">
                                          Duration:
                                        </span>{" "}
                                        {
                                          flight.duration
                                        }
                                      </p>
                                    )}

                                    {flight.stops && (
                                      <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">
                                          Stops:
                                        </span>{" "}
                                        {flight.stops}
                                      </p>
                                    )}

                                    {flight.price && (
                                      <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">
                                          Price:
                                        </span>{" "}
                                        {flight.price}
                                      </p>
                                    )}

                                    {flight.baggage && (
                                      <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">
                                          Baggage:
                                        </span>{" "}
                                        {flight.baggage}
                                      </p>
                                    )}

                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-2">

                                    <button
                                      onClick={() =>
                                        setSelectedFlight(
                                          selected
                                            ? null
                                            : flight
                                        )
                                      }
                                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                        selected
                                          ? "bg-slate-200 text-slate-900"
                                          : "bg-slate-950 text-white hover:bg-slate-800"
                                      }`}
                                    >
                                      {selected
                                        ? "Selected"
                                        : "Select flight"}
                                    </button>

                                    {flight.source_url && (
                                      <a
                                        href={
                                          flight.source_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        View source
                                      </a>
                                    )}

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    )}

                  {/* ATTRACTIONS */}
                  {research.attractions &&
                    research.attractions.length > 0 && (
                      <div>

                        <div className="mb-4">

                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Places
                          </p>

                          <h4 className="text-xl font-bold">
                            Attractions
                          </h4>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                          {research.attractions.map(
                            (
                              attraction,
                              index
                            ) => {

                              const selected =
                                selectedAttractions.some(
                                  (item) =>
                                    item.name ===
                                    attraction.name
                                );

                              return (
                                <div
                                  key={`${attraction.name}-${index}`}
                                  className={`rounded-2xl border bg-white p-5 ${
                                    selected
                                      ? "border-slate-950 ring-2 ring-slate-950/10"
                                      : "border-slate-200"
                                  }`}
                                >

                                  <div className="flex items-start justify-between gap-3">

                                    <h5 className="font-bold">
                                      {attraction.name ||
                                        "Attraction"}
                                    </h5>

                                    {selected && (
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                                        <Check size={14} />
                                      </div>
                                    )}

                                  </div>

                                  {attraction.description && (
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                      {
                                        attraction.description
                                      }
                                    </p>
                                  )}

                                  <div className="mt-4 space-y-2 text-xs text-slate-500">

                                    {attraction.ticket_price && (
                                      <p>
                                        Ticket:{" "}
                                        {
                                          attraction.ticket_price
                                        }
                                      </p>
                                    )}

                                    {attraction.opening_info && (
                                      <p>
                                        Opening:{" "}
                                        {
                                          attraction.opening_info
                                        }
                                      </p>
                                    )}

                                    {attraction.recommended_time && (
                                      <p>
                                        Recommended time:{" "}
                                        {
                                          attraction.recommended_time
                                        }
                                      </p>
                                    )}

                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-2">

                                    <button
                                      onClick={() =>
                                        toggleAttraction(
                                          attraction
                                        )
                                      }
                                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                        selected
                                          ? "bg-slate-200 text-slate-900"
                                          : "bg-slate-950 text-white hover:bg-slate-800"
                                      }`}
                                    >
                                      {selected
                                        ? "Selected"
                                        : "Select place"}
                                    </button>

                                    {attraction.source_url && (
                                      <a
                                        href={
                                          attraction.source_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Source
                                      </a>
                                    )}

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    )}

                  {/* ACTIVITIES */}
                  {research.activities &&
                    research.activities.length > 0 && (
                      <div>

                        <div className="mb-4">

                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Experiences
                          </p>

                          <h4 className="text-xl font-bold">
                            Tours & activities
                          </h4>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2">

                          {research.activities.map(
                            (
                              activity,
                              index
                            ) => {

                              const selected =
                                selectedActivities.some(
                                  (item) =>
                                    item.name ===
                                    activity.name
                                );

                              return (
                                <div
                                  key={`${activity.name}-${index}`}
                                  className={`rounded-2xl border bg-white p-5 ${
                                    selected
                                      ? "border-slate-950 ring-2 ring-slate-950/10"
                                      : "border-slate-200"
                                  }`}
                                >

                                  <div className="flex items-start justify-between gap-3">

                                    <h5 className="font-bold">
                                      {activity.name ||
                                        "Activity"}
                                    </h5>

                                    {selected && (
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                                        <Check size={14} />
                                      </div>
                                    )}

                                  </div>

                                  {activity.description && (
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                      {
                                        activity.description
                                      }
                                    </p>
                                  )}

                                  {activity.price && (
                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                      Source-listed price:{" "}
                                      {activity.price}
                                    </p>
                                  )}

                                  <div className="mt-5 flex flex-wrap gap-2">

                                    <button
                                      onClick={() =>
                                        toggleActivity(
                                          activity
                                        )
                                      }
                                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                        selected
                                          ? "bg-slate-200 text-slate-900"
                                          : "bg-slate-950 text-white hover:bg-slate-800"
                                      }`}
                                    >
                                      {selected
                                        ? "Selected"
                                        : "Select activity"}
                                    </button>

                                    {activity.source_url && (
                                      <a
                                        href={
                                          activity.source_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Source
                                      </a>
                                    )}

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    )}

                  {/* RESTAURANTS */}
                  {research.restaurants &&
                    research.restaurants.length > 0 && (
                      <div>

                        <div className="mb-4">

                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Food
                          </p>

                          <h4 className="text-xl font-bold">
                            Restaurant options
                          </h4>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                          {research.restaurants.map(
                            (
                              restaurant,
                              index
                            ) => (
                              <div
                                key={`${restaurant.name}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                              >

                                <h5 className="font-bold">
                                  {restaurant.name ||
                                    "Restaurant"}
                                </h5>

                                {restaurant.description && (
                                  <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {
                                      restaurant.description
                                    }
                                  </p>
                                )}

                                {restaurant.price_level && (
                                  <p className="mt-3 text-xs font-semibold text-slate-500">
                                    Price level:{" "}
                                    {
                                      restaurant.price_level
                                    }
                                  </p>
                                )}

                                {restaurant.source_url && (
                                  <a
                                    href={
                                      restaurant.source_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    View source
                                  </a>
                                )}

                              </div>
                            )
                          )}

                        </div>

                      </div>
                    )}

                  {/* TRANSPORT */}
                  {research.transport &&
                    research.transport.length > 0 && (
                      <div>

                        <div className="mb-4">

                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Getting around
                          </p>

                          <h4 className="text-xl font-bold">
                            Transport options
                          </h4>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2">

                          {research.transport.map(
                            (
                              transport,
                              index
                            ) => (
                              <div
                                key={`${transport.name}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                              >

                                <h5 className="font-bold">
                                  {transport.name ||
                                    "Transport option"}
                                </h5>

                                {transport.description && (
                                  <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {
                                      transport.description
                                    }
                                  </p>
                                )}

                                {transport.price && (
                                  <p className="mt-3 text-sm font-semibold text-slate-700">
                                    Source-listed price:{" "}
                                    {transport.price}
                                  </p>
                                )}

                                {transport.source_url && (
                                  <a
                                    href={
                                      transport.source_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    View source
                                  </a>
                                )}

                              </div>
                            )
                          )}

                        </div>

                      </div>
                    )}

                  {/* TRAVEL TIPS */}
                  {research.travel_tips &&
                    research.travel_tips.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                            <Sparkles size={19} />
                          </div>

                          <div>

                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                              Research notes
                            </p>

                            <h4 className="font-bold">
                              Travel tips
                            </h4>

                          </div>

                        </div>

                        <ul className="mt-5 space-y-3">

                          {research.travel_tips.map(
                            (tip, index) => (
                              <li
                                key={index}
                                className="flex gap-3 text-sm leading-6 text-slate-600"
                              >
                                <Check
                                  size={16}
                                  className="mt-1 shrink-0"
                                />
                                {tip}
                              </li>
                            )
                          )}

                        </ul>

                      </div>
                    )}

                  {/* SELECTION SUMMARY */}
                  {(selectedHotel ||
                    selectedFlight ||
                    selectedAttractions.length >
                      0 ||
                    selectedActivities.length >
                      0) && (
                    <div className="rounded-2xl border border-slate-950 bg-slate-950 p-6 text-white">

                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Your selections
                      </p>

                      <h4 className="mt-2 text-xl font-bold">
                        Ready to build your final trip
                      </h4>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        {selectedFlight && (
                          <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs text-slate-400">
                              Flight
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {selectedFlight.airline ||
                                "Selected flight"}
                            </p>
                          </div>
                        )}

                        {selectedHotel && (
                          <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs text-slate-400">
                              Hotel
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {selectedHotel.name ||
                                "Selected hotel"}
                            </p>
                          </div>
                        )}

                        {selectedAttractions.length >
                          0 && (
                          <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs text-slate-400">
                              Places
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {
                                selectedAttractions.length
                              }{" "}
                              selected
                            </p>
                          </div>
                        )}

                        {selectedActivities.length >
                          0 && (
                          <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs text-slate-400">
                              Activities
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {
                                selectedActivities.length
                              }{" "}
                              selected
                            </p>
                          </div>
                        )}

                      </div>

                      <p className="mt-5 text-sm leading-6 text-slate-400">
                        Selection is saved in this trip session.
                        The next step will send these choices
                        back to the AI so it can optimize the
                        final itinerary around your budget.
                      </p>

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

        </section>
      )}

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

          <div className="max-w-2xl">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From one message to a complete trip.
            </h2>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">

            {[
              {
                number: "01",
                title: "Research real options",
                description:
                  "TripPilot researches travel sources for hotels, attractions, activities, restaurants and transport.",
              },
              {
                number: "02",
                title: "Choose what you like",
                description:
                  "Review researched options and select the hotel, flight, places and experiences that fit your trip.",
              },
              {
                number: "03",
                title: "Optimize everything",
                description:
                  "The AI can use your selections and budget to build a personalized final itinerary.",
              },
            ].map((item) => (

              <div
                key={item.number}
                className="rounded-2xl border border-slate-200 p-6"
              >

                <span className="text-xs font-bold tracking-widest text-slate-400">
                  {item.number}
                </span>

                <h3 className="mt-5 text-lg font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* DEMO / PRICING */}
      <section
        id="pricing"
        className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
      >

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

          <div className="grid gap-8 lg:grid-cols-2">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Demo trip
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Karachi, Pakistan
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your 3-day Karachi trip
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-500">
                    Estimated total
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    Rs. 66,500
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <CircleDollarSign size={20} />
                </div>

              </div>

              <div className="mt-6 space-y-3">

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Flights
                  </span>

                  <span className="font-semibold">
                    Rs. 28,500
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Hotel
                  </span>

                  <span className="font-semibold">
                    Rs. 18,000
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Activities
                  </span>

                  <span className="font-semibold">
                    Rs. 4,000
                  </span>
                </div>

              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  AI recommendation
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Stay around Clifton for easier
                  access to your planned activities
                  while keeping your trip flexible.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">

          <p>
            © 2026 TripPilot
          </p>

          <p className="flex items-center gap-2">
            <Sparkles size={14} />
            AI-powered travel planning
          </p>

        </div>

      </footer>

    </main>
  );
}
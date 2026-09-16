 import { NextResponse } from "next/server";
import Groq from "groq-sdk";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type PlanTripRequest = {
  message?: string;
  conversation?: ConversationMessage[];
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body: PlanTripRequest = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          status: "error",
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          status: "error",
          error: "GROQ_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const conversation = Array.isArray(body.conversation)
      ? body.conversation
          .filter(
            (item): item is ConversationMessage =>
              (item?.role === "user" ||
                item?.role === "assistant") &&
              typeof item?.content === "string" &&
              item.content.trim().length > 0
          )
          .slice(-16)
      : [];

    const systemPrompt = `
You are TripPilot, an AI travel planning assistant.

Your job is to collect the user's travel requirements through natural conversation and then create a practical travel plan.

IMPORTANT FACTS RULES:
- Extract facts from ALL USER messages in the conversation.
- Assistant messages are NOT facts unless the user confirms them.
- A later user message can update an earlier fact.
- Understand short natural language replies such as:
  "2 days", "two people", "from Karachi", "budget 300k".
- Do not repeatedly ask for information the user already provided.
- Never invent missing information.

REQUIRED INFORMATION:
1. Destination
2. Trip duration or travel dates
3. Number of travelers
4. Budget
5. Origin city when transportation/flights are relevant

If genuinely required information is missing, ask only for the missing information.

When all required information is available, create a trip plan.

IMPORTANT RESEARCH RULES:
- This endpoint currently does NOT have verified live flight or hotel prices.
- Never claim that a price is live, confirmed, bookable, or currently available.
- Clearly treat generated prices as estimates.
- Keep the estimated total reasonably within the user's stated budget when possible.
- Use Pakistani Rupees (Rs.) for Pakistan-related trips and budgets.

Return ONLY valid JSON.

If information is missing, return:

{
  "status": "needs_information",
  "message": "short natural question asking only for the missing information"
}

If information is complete, return:

{
  "status": "complete",
  "message": "short friendly confirmation",
  "destination": "city, country",
  "duration": "5 days",
  "travelers": 2,
  "origin": "Karachi",
  "budget": 300000,
  "estimated_total": 295000,
  "currency": "PKR",
  "hotel": {
    "name": "hotel recommendation",
    "location": "area or city",
    "estimated_price": 100000,
    "description": "short description"
  },
  "cost_breakdown": [
    {
      "category": "Flights",
      "estimated_cost": 160000
    },
    {
      "category": "Hotel",
      "estimated_cost": 100000
    },
    {
      "category": "Activities",
      "estimated_cost": 20000
    },
    {
      "category": "Meals & Local Transport",
      "estimated_cost": 10000
    },
    {
      "category": "Miscellaneous",
      "estimated_cost": 5000
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival",
      "activities": [
        {
          "time": "Afternoon",
          "activity": "Activity description",
          "estimated_cost": 0
        }
      ]
    }
  ],
  "activities": [
    {
      "name": "activity",
      "description": "short description",
      "estimated_cost": 0
    }
  ],
  "travel_notes": [
    "short useful note"
  ],
  "assumptions": [
    "short assumption"
  ]
}

IMPORTANT:
- estimated_total MUST equal the sum of the cost_breakdown estimated_cost values.
- Keep the itinerary practical for the number of days.
- Do not create an itinerary longer than the requested trip duration.
- Keep all descriptions concise.
`.trim();

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...conversation.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      max_tokens: 1800,
      response_format: {
        type: "json_object",
      },
      messages,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          status: "error",
          error: "Groq returned an empty response.",
        },
        { status: 502 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Invalid JSON returned by Groq:", content);

      return NextResponse.json(
        {
          status: "error",
          error: "Groq returned invalid JSON.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Trip planning error:", error);

    return NextResponse.json(
      {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unable to plan your trip right now.",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tripPlan,
      selectedHotel,
      selectedFlight,
      selectedAttractions,
      selectedActivities,
      research,
    } = body;

    if (!tripPlan) {
      return NextResponse.json(
        { error: "Trip plan is required." },
        { status: 400 }
      );
    }

    const planningData = {
      original_trip: {
        request: tripPlan.trip_request ?? {},
        destination: tripPlan.destination,
        duration_days: tripPlan.duration_days,
        travelers: tripPlan.travelers,
        budget: tripPlan.budget,
      },

      selected_options: {
        hotel: selectedHotel ?? null,
        flight: selectedFlight ?? null,
        attractions: selectedAttractions ?? [],
        activities: selectedActivities ?? [],
      },

      researched_options: research ?? null,
    };

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are TripPilot's final travel optimization agent.

Your job is to create the user's FINAL travel itinerary using:
1. The original trip request.
2. The user's selected travel options.
3. The researched travel data and source-backed prices.

IMPORTANT RULES:

1. Preserve the user's destination, duration, travelers and budget exactly.
2. Respect the user's selected hotel, flight, attractions and activities.
3. Use researched data whenever it contains a relevant price or fact.
4. NEVER invent a price.
5. NEVER invent a source URL.
6. NEVER claim that something is booked.
7. NEVER claim live availability unless the research explicitly proves it.
8. If a selected item has a price, preserve that price.
9. If researched data contains a price for an item, use that price.
10. If no reliable price exists, use "N/A".
11. Do not replace a selected hotel or flight with another option unless the selected option is unusable or missing.
12. Keep the total as close to the user's budget as reasonably possible without inventing costs.
13. Clearly separate researched prices from estimates.
14. Organize activities geographically and logically.
15. Avoid unnecessary travel between distant areas.
16. Do not overload a single day.
17. Include practical travel notes.
18. Use the research source URLs when they support an item.
19. Keep source URLs exactly as provided.
20. Return valid JSON only.

PRICE RULES:

- Never convert "N/A" into a guessed number.
- Never create a fake exact price.
- If the research provides a price range, preserve it as a range.
- If the research provides a "from" price, preserve the "from" wording.
- If a price is per person or per night and that information is known, preserve that context.
- The final estimated total may be "N/A" if reliable prices are insufficient.
- Do not pretend that the original AI-generated budget is a researched price.

Return exactly this structure:

{
  "status": "complete",
  "title": "string",
  "summary": "string",
  "destination": "string",
  "duration_days": number,
  "travelers": number,
  "budget": "string",
  "estimated_total": "string",
  "selected_options": {
    "hotel": object or null,
    "flight": object or null,
    "attractions": array,
    "activities": array
  },
  "budget_breakdown": [
    {
      "category": "string",
      "estimated_cost": "string"
    }
  ],
  "itinerary": [
    {
      "day": number,
      "title": "string",
      "activities": [
        {
          "time": "string",
          "activity": "string",
          "estimated_cost": "string"
        }
      ]
    }
  ],
  "optimization_notes": [
    "string"
  ],
  "travel_notes": [
    "string"
  ],
  "sources": [
    {
      "title": "string",
      "url": "string"
    }
  ]
}

Only include sources that actually appear in the provided research data.
          `,
        },
        {
          role: "user",
          content: JSON.stringify(planningData),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No itinerary was generated." },
        { status: 500 }
      );
    }

    const finalItinerary = JSON.parse(content);

    return NextResponse.json({
      success: true,
      itinerary: finalItinerary,
    });
  } catch (error) {
    console.error("Final itinerary error:", error);

    return NextResponse.json(
      {
        error: "Failed to build final itinerary.",
      },
      { status: 500 }
    );
  }
}
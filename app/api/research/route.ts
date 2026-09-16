 import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";
import Groq from "groq-sdk";

type SearchSource = {
  title: string;
  url: string;
  description: string;
};

type SuccessfulSource = {
  title: string;
  url: string;
  content: string;
};

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const destination =
      typeof body?.destination === "string"
        ? body.destination.trim()
        : "";

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Destination is required.",
        },
        { status: 400 }
      );
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "FIRECRAWL_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const queries = [
      `${destination} hotels prices`,
      `${destination} best hotels`,
      `${destination} attractions ticket prices`,
      `${destination} things to do tours prices`,
      `${destination} restaurants`,
      `${destination} public transport airport transport`,
      `${destination} travel visa requirements`,
    ];

    const searchResults = await Promise.all(
      queries.map(async (query) => {
        try {
          const result = await firecrawl.search(query, {
            limit: 5,
          });

          return result;
        } catch (error) {
          console.error(`Firecrawl search failed for "${query}":`, error);
          return null;
        }
      })
    );

    const sourceMap = new Map<string, SearchSource>();

    for (const result of searchResults) {
      if (!result || !Array.isArray(result.web)) {
        continue;
      }

      for (const item of result.web) {
        if (!item || typeof item !== "object") {
          continue;
        }

        if (!("url" in item)) {
          continue;
        }

        const url =
          typeof item.url === "string"
            ? item.url
            : "";

        if (!url) {
          continue;
        }

        const title =
          "title" in item && typeof item.title === "string"
            ? item.title
            : "Untitled source";

        const description =
          "description" in item &&
          typeof item.description === "string"
            ? item.description
            : "";

        if (!sourceMap.has(url)) {
          sourceMap.set(url, {
            title,
            url,
            description,
          });
        }
      }
    }

    const sources = Array.from(sourceMap.values()).slice(0, 10);

    if (sources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Firecrawl did not return any usable sources.",
        },
        { status: 502 }
      );
    }

    const successfulSources: SuccessfulSource[] = [];

    for (const source of sources) {
      try {
        const scraped = await firecrawl.scrape(source.url, {
          formats: ["markdown"],
        });

        if (!scraped || typeof scraped !== "object") {
          continue;
        }

        const markdown =
          "markdown" in scraped &&
          typeof scraped.markdown === "string"
            ? scraped.markdown
            : "";

        if (!markdown.trim()) {
          continue;
        }

        successfulSources.push({
          title: source.title,
          url: source.url,
          content: markdown.slice(0, 1500),
        });
      } catch (error) {
        console.error(
          `Firecrawl scrape failed for ${source.url}:`,
          error
        );
      }
    }

    if (successfulSources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Firecrawl could not scrape any usable sources.",
        },
        { status: 502 }
      );
    }

    const researchInput = successfulSources
      .map(
        (source, index) =>
          `SOURCE ${index + 1}
TITLE: ${source.title}
URL: ${source.url}

CONTENT:
${source.content}`
      )
      .join("\n\n-------------------------\n\n");

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `
You are a professional travel research assistant.

Your job is to analyze web research collected by Firecrawl for a travel destination.

Important rules:

1. Use ONLY information supported by the provided sources.
2. Do not invent prices, ratings, opening hours, addresses, airlines, hotels, restaurants, or transport information.
3. If a price is not available, use null rather than inventing one.
4. Clearly distinguish estimated information from verified information.
5. Preserve source URLs so the user can inspect the original information.
6. Do not claim that something is live, available, bookable, or guaranteed unless the source explicitly supports that claim.
7. Keep the output practical for a travel-planning application.
8. Use simple clean English.
9. Avoid strange Unicode characters and unnecessary special symbols.
10. Return valid JSON only.

Return this structure:

{
  "destination": "string",
  "hotels": [
    {
      "name": "string",
      "location": "string",
      "rating": "string or null",
      "price": "string or null",
      "description": "string",
      "source_url": "string"
    }
  ],
  "flights": [
    {
      "airline": "string",
      "route": "string",
      "duration": "string or null",
      "stops": "string or null",
      "price": "string or null",
      "baggage": "string or null",
      "source_url": "string"
    }
  ],
  "attractions": [
    {
      "name": "string",
      "description": "string",
      "ticket_price": "string or null",
      "opening_info": "string or null",
      "recommended_time": "string or null",
      "source_url": "string"
    }
  ],
  "activities": [
    {
      "name": "string",
      "description": "string",
      "price": "string or null",
      "source_url": "string"
    }
  ],
  "restaurants": [
    {
      "name": "string",
      "description": "string",
      "price_level": "string or null",
      "source_url": "string"
    }
  ],
  "transport": [
    {
      "name": "string",
      "description": "string",
      "price": "string or null",
      "source_url": "string"
    }
  ],
  "travel_tips": [
    "string"
  ]
}

Return up to 5 useful items per category when the sources support them.
If the sources do not contain enough information for a category, return an empty array.
          `,
        },
        {
          role: "user",
          content: `
Destination:
${destination}

Firecrawl research:

${researchInput}
          `,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Groq returned an empty research response.",
        },
        { status: 502 }
      );
    }

    let research: unknown;

    try {
      research = JSON.parse(content);
    } catch {
      console.error("Invalid research JSON:", content);

      return NextResponse.json(
        {
          success: false,
          error: "Groq returned invalid research JSON.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      destination,
      research,
      sources: successfulSources.map((source) => ({
        title: source.title,
        url: source.url,
      })),
    });
  } catch (error) {
    console.error("Research API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Research request failed.",
      },
      { status: 500 }
    );
  }
}
 import { NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";
import Groq from "groq-sdk";

type ResearchRequest = {
  destination?: string;
};

type SearchResult = {
  url?: string;
  title?: string;
  description?: string;
};

type ResearchSource = {
  success: boolean;
  url: string;
  title?: string;
  markdown?: string;
  error?: string;
};

const MAX_SEARCH_RESULTS = 5;
const MAX_CONTENT_PER_SOURCE = 2200;
const MAX_TOTAL_RESEARCH_CHARS = 9000;

export async function POST(request: Request) {
  try {
    const body: ResearchRequest = await request.json();

    const destination =
      typeof body.destination === "string"
        ? body.destination.trim()
        : "";

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Destination is required",
        },
        { status: 400 }
      );
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "FIRECRAWL_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    const firecrawl = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });

    /*
     * STEP 1:
     * Search the web automatically for the destination.
     */
    const searchQuery = `
${destination} travel guide attractions hotels transportation official tourism
    `.trim();

    const searchResponse = await firecrawl.search(searchQuery, {
      limit: MAX_SEARCH_RESULTS,
    });

    /*
     * Firecrawl search normally returns web results.
     * We keep this defensive because SDK response shapes can vary.
     */
    const searchData = searchResponse as {
      web?: SearchResult[];
      results?: SearchResult[];
    };

    const searchResults =
      Array.isArray(searchData.web)
        ? searchData.web
        : Array.isArray(searchData.results)
          ? searchData.results
          : [];

    const uniqueUrls = Array.from(
      new Set(
        searchResults
          .map((result) => result.url)
          .filter(
            (url): url is string =>
              typeof url === "string" && url.startsWith("http")
          )
      )
    ).slice(0, MAX_SEARCH_RESULTS);

    if (uniqueUrls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No useful web sources were found for this destination",
        },
        { status: 502 }
      );
    }

    /*
     * STEP 2:
     * Scrape the discovered travel pages.
     */
    const sources: ResearchSource[] = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          const result = await firecrawl.scrape(url, {
            formats: ["markdown"],
          });

          return {
            success: true,
            url,
            title: result.metadata?.title,
            markdown: result.markdown,
          };
        } catch (error) {
          return {
            success: false,
            url,
            error:
              error instanceof Error
                ? error.message
                : "Unknown research error",
          };
        }
      })
    );

    const successfulSources = sources.filter(
      (source) => source.success && source.markdown
    );

    if (successfulSources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Search succeeded, but the discovered pages could not be researched",
          sources,
        },
        { status: 502 }
      );
    }

    /*
     * STEP 3:
     * Keep the research payload small enough for Groq.
     */
    let totalCharacters = 0;

    const researchText = successfulSources
      .map((source, index) => {
        const remaining = MAX_TOTAL_RESEARCH_CHARS - totalCharacters;

        if (remaining <= 0) {
          return "";
        }

        const contentLimit = Math.min(
          MAX_CONTENT_PER_SOURCE,
          remaining
        );

        const content = source.markdown!.slice(
          0,
          contentLimit
        );

        totalCharacters += content.length;

        return `
SOURCE ${index + 1}
Title: ${source.title || "Unknown"}
URL: ${source.url}

CONTENT:
${content}
`;
      })
      .filter(Boolean)
      .join("\n");

    /*
     * STEP 4:
     * Ask Groq to turn the researched information
     * into a small structured travel research object.
     */
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      max_tokens: 1200,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `
You are TripPilot's travel research analyst.

Use ONLY information contained in the supplied web sources.

Rules:
- Never invent facts.
- Never claim live prices unless the source explicitly provides them.
- Keep every array to a maximum of 3 items.
- Keep descriptions short.
- Include the source URL for every item.
- If information is unavailable, return an empty array.
- Return ONLY valid JSON.
          `.trim(),
        },
        {
          role: "user",
          content: `
Destination: ${destination}

WEB RESEARCH:
${researchText}

Return exactly this JSON structure:

{
  "destination": "${destination}",
  "overview": "short factual overview",
  "attractions": [
    {
      "name": "name",
      "description": "short factual description",
      "source_url": "URL"
    }
  ],
  "activities": [
    {
      "name": "name",
      "description": "short factual description",
      "source_url": "URL"
    }
  ],
  "transport": [
    {
      "name": "transport option",
      "description": "short factual description",
      "source_url": "URL"
    }
  ],
  "accommodation": [
    {
      "name": "accommodation option",
      "description": "short factual description",
      "source_url": "URL"
    }
  ],
  "travel_tips": [
    {
      "tip": "short factual tip",
      "source_url": "URL"
    }
  ]
}

Maximum 3 items per array.
Keep the JSON concise.
          `.trim(),
        },
      ],
    });

    const researchSummary =
      completion.choices[0]?.message?.content;

    if (!researchSummary) {
      return NextResponse.json(
        {
          success: false,
          error: "Groq returned an empty research summary",
        },
        { status: 502 }
      );
    }

    let parsedResearch: unknown;

    try {
      parsedResearch = JSON.parse(researchSummary);
    } catch {
      console.error(
        "Invalid JSON returned by Groq:",
        researchSummary
      );

      return NextResponse.json(
        {
          success: false,
          error: "Groq returned invalid JSON",
        },
        { status: 502 }
      );
    }

    /*
     * STEP 5:
     * Return both the AI research and the actual sources.
     */
    return NextResponse.json({
      success: true,
      destination,
      sources: successfulSources.map((source) => ({
        title: source.title || "Travel source",
        url: source.url,
      })),
      research: parsedResearch,
    });
  } catch (error) {
    console.error("Research agent error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown research agent error",
      },
      { status: 500 }
    );
  }
}
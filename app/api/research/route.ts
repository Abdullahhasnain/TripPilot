import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const SEARCHES = [
  {
    category: "hotels",
    query: (destination: string) =>
      `${destination} hotels prices per night`,
  },
  {
    category: "flights",
    query: (destination: string) =>
      `Karachi to ${destination} flights prices PKR`,
  },
  {
    category: "attractions",
    query: (destination: string) =>
      `${destination} attractions ticket prices`,
  },
  {
    category: "activities",
    query: (destination: string) =>
      `${destination} tours activities prices`,
  },
  {
    category: "restaurants",
    query: (destination: string) =>
      `${destination} restaurants prices`,
  },
  {
    category: "transport",
    query: (destination: string) =>
      `${destination} airport metro taxi prices`,
  },
  {
    category: "travel",
    query: (destination: string) =>
      `${destination} visa requirements Pakistani passport`,
  },
];

type SimpleSource = {
  title: string;
  description: string;
  url: string;
};

type SearchGroup = {
  category: string;
  result: {
    web?: unknown[];
  } | null;
};

const cleanText = (
  text: string,
  maxLength = 120
): string => {
  const cleaned = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[#*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trim()}...`;
};

const getPrice = (
  source: SimpleSource
): string | null => {
  const combined =
    `${source.title} ${source.description}`;

  /*
    Only accept actual currency + number combinations.

    Examples accepted:
    PKR 57,390
    AED 20
    Rs. 5,000
    $40
    USD 213
    €50

    Examples rejected:
    rs,
    2026
    2025
    Ticket: rs
  */

  const matches = combined.matchAll(
    /(?:PKR|AED|Rs\.?|USD|US\$|\$|€|£)\s*([\d,]+(?:\.\d+)?)/gi
  );

  for (const match of matches) {
    const fullMatch = match[0];
    const numericText = match[1];

    if (!numericText) {
      continue;
    }

    const numericValue = Number(
      numericText.replace(/,/g, "")
    );

    if (!Number.isFinite(numericValue)) {
      continue;
    }

    /*
      Reject years accidentally detected as prices.
      This prevents things like "Rs 2026" when 2026
      is actually part of a travel article title.
    */
    if (
      Number.isInteger(numericValue) &&
      numericValue >= 1900 &&
      numericValue <= 2100
    ) {
      continue;
    }

    return fullMatch.trim();
  }

  return null;
};

const getSources = (
  results: SearchGroup[],
  category: string
): SimpleSource[] => {
  const output: SimpleSource[] = [];

  for (const item of results) {
    if (item.category !== category) {
      continue;
    }

    const webResults = item.result?.web;

    if (!Array.isArray(webResults)) {
      continue;
    }

    for (const source of webResults.slice(0, 3)) {
      if (!source || typeof source !== "object") {
        continue;
      }

      const data =
        source as Record<string, unknown>;

      const url =
        typeof data.url === "string"
          ? data.url.trim()
          : "";

      if (!url) {
        continue;
      }

      const title =
        typeof data.title === "string"
          ? data.title.trim()
          : "";

      const description =
        typeof data.description === "string"
          ? data.description.trim()
          : "";

      output.push({
        title,
        description,
        url,
      });
    }
  }

  return output;
};

const createSources = (
  results: SearchGroup[]
) => {
  const seen = new Set<string>();

  return results.flatMap((item) => {
    const webResults = item.result?.web;

    if (!Array.isArray(webResults)) {
      return [];
    }

    return webResults
      .slice(0, 3)
      .map((source) => {
        if (
          !source ||
          typeof source !== "object"
        ) {
          return null;
        }

        const data =
          source as Record<string, unknown>;

        const url =
          typeof data.url === "string"
            ? data.url.trim()
            : "";

        if (!url || seen.has(url)) {
          return null;
        }

        seen.add(url);

        const title =
          typeof data.title === "string"
            ? cleanText(data.title, 100)
            : "Travel source";

        return {
          title: title || "Travel source",
          url,
        };
      })
      .filter(
        (
          source
        ): source is {
          title: string;
          url: string;
        } => source !== null
      );
  });
};

export async function POST(
  request: NextRequest
) {
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

    /*
      Run all travel research searches in parallel.
    */
    const results: SearchGroup[] =
      await Promise.all(
        SEARCHES.map(async (search) => {
          try {
            const result =
              await firecrawl.search(
                search.query(destination),
                {
                  limit: 3,
                }
              );

            return {
              category: search.category,
              result,
            };
          } catch (error) {
            console.error(
              `Search failed: ${search.category}`,
              error
            );

            return {
              category: search.category,
              result: null,
            };
          }
        })
      );

    /*
      Hotels
    */
    const hotels = getSources(
      results,
      "hotels"
    ).map((source) => ({
      name:
        cleanText(source.title, 90) ||
        "Hotel option",

      location: destination,

      rating: null,

      price: getPrice(source),

      description:
        cleanText(
          source.description,
          120
        ) ||
        "Hotel information found from travel research.",

      source_url: source.url,
    }));

    /*
      Flights
    */
    const flights = getSources(
      results,
      "flights"
    ).map((source) => ({
      airline:
        cleanText(source.title, 90) ||
        "Flight option",

      route:
        `Karachi → ${destination}`,

      duration: null,

      stops: null,

      price: getPrice(source),

      baggage: null,

      source_url: source.url,
    }));

    /*
      Attractions
    */
    const attractions = getSources(
      results,
      "attractions"
    ).map((source) => ({
      name:
        cleanText(source.title, 90) ||
        "Attraction option",

      description:
        cleanText(
          source.description,
          120
        ) ||
        "Attraction information found from travel research.",

      ticket_price:
        getPrice(source),

      opening_info: null,

      recommended_time: null,

      source_url: source.url,
    }));

    /*
      Activities
    */
    const activities = getSources(
      results,
      "activities"
    ).map((source) => ({
      name:
        cleanText(source.title, 90) ||
        "Activity option",

      description:
        cleanText(
          source.description,
          120
        ) ||
        "Activity information found from travel research.",

      price: getPrice(source),

      source_url: source.url,
    }));

    /*
      Restaurants
    */
    const restaurants = getSources(
      results,
      "restaurants"
    ).map((source) => ({
      name:
        cleanText(source.title, 90) ||
        "Restaurant option",

      description:
        cleanText(
          source.description,
          120
        ) ||
        "Restaurant information found from travel research.",

      price_level: null,

      source_url: source.url,
    }));

    /*
      Transport
    */
    const transport = getSources(
      results,
      "transport"
    ).map((source) => ({
      name:
        cleanText(source.title, 90) ||
        "Transport option",

      description:
        cleanText(
          source.description,
          120
        ) ||
        "Transport information found from travel research.",

      price: getPrice(source),

      source_url: source.url,
    }));

    /*
      Visa / travel tips
    */
    const travel_tips = getSources(
      results,
      "travel"
    )
      .map((source) =>
        cleanText(
          source.description,
          160
        )
      )
      .filter(Boolean);

    /*
      Final structured research object
    */
    const research = {
      destination,
      hotels,
      flights,
      attractions,
      activities,
      restaurants,
      transport,
      travel_tips,
    };

    /*
      Unique source list for the frontend.
    */
    const sources =
      createSources(results);

    return NextResponse.json({
      success: true,
      destination,
      research,
      sources,
    });
  } catch (error) {
    console.error(
      "Research API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Research request failed.",
      },
      { status: 500 }
    );
  }
}
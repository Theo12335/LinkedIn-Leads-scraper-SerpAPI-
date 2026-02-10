'use server';

// Server Action for SerpAPI LinkedIn Scraping
// Six Sigma Principle: Controlled process with error handling and validation

import { Lead, LeadCategory, ScrapingResult, SerpApiResponse } from '@/lib/types';
import { serpResultToLead, deduplicateLeads } from '@/lib/categorization';

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

interface ScrapeParams {
  apiKey: string;
  query: string;
  queryLabel: string;
  queryCategory: LeadCategory;
  numResults?: number;
}

/**
 * Validate API key format
 */
function validateApiKey(apiKey: string): boolean {
  // SerpAPI keys are typically 64 character hex strings
  return /^[a-f0-9]{64}$/i.test(apiKey.trim());
}

/**
 * Scrape LinkedIn profiles using SerpAPI Google Search
 */
export async function scrapeLinkedInLeads(params: ScrapeParams): Promise<ScrapingResult> {
  const { apiKey, query, queryLabel, queryCategory, numResults = 10 } = params;

  // Input validation
  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      leads: [],
      error: 'API key is required',
      totalResults: 0,
      query,
    };
  }

  if (!validateApiKey(apiKey)) {
    return {
      success: false,
      leads: [],
      error: 'Invalid API key format. SerpAPI keys are 64 character hex strings.',
      totalResults: 0,
      query,
    };
  }

  if (!query || !query.trim()) {
    return {
      success: false,
      leads: [],
      error: 'Search query is required',
      totalResults: 0,
      query,
    };
  }

  try {
    // Build SerpAPI request URL
    const searchParams = new URLSearchParams({
      api_key: apiKey.trim(),
      engine: 'google',
      q: query,
      num: String(Math.min(numResults, 100)), // SerpAPI max is 100
      gl: 'us', // United States
      hl: 'en', // English
    });

    const response = await fetch(`${SERPAPI_BASE_URL}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401) {
        return {
          success: false,
          leads: [],
          error: 'Invalid API key. Please check your SerpAPI key.',
          totalResults: 0,
          query,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          leads: [],
          error: 'Rate limit exceeded. Please wait and try again.',
          totalResults: 0,
          query,
        };
      }

      return {
        success: false,
        leads: [],
        error: `SerpAPI error (${response.status}): ${errorText}`,
        totalResults: 0,
        query,
      };
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      return {
        success: false,
        leads: [],
        error: `SerpAPI error: ${data.error}`,
        totalResults: 0,
        query,
      };
    }

    // Process results
    const organicResults = data.organic_results || [];

    // Filter for LinkedIn profile URLs only
    const linkedInResults = organicResults.filter(result =>
      result.link?.includes('linkedin.com/in/')
    );

    // Convert to Lead objects with categorization
    const leads: Lead[] = linkedInResults.map((result, index) =>
      serpResultToLead(
        { ...result, position: index },
        queryCategory,
        queryLabel
      )
    );

    return {
      success: true,
      leads,
      totalResults: linkedInResults.length,
      query,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      leads: [],
      error: `Network error: ${errorMessage}`,
      totalResults: 0,
      query,
    };
  }
}

/**
 * Batch scrape multiple queries
 */
export async function batchScrapeLeads(
  apiKey: string,
  queries: Array<{ query: string; label: string; category: LeadCategory }>,
  numResultsPerQuery: number = 10
): Promise<{
  success: boolean;
  leads: Lead[];
  errors: string[];
  totalResults: number;
}> {
  const allLeads: Lead[] = [];
  const errors: string[] = [];
  let totalResults = 0;

  // Process queries sequentially to avoid rate limiting
  for (const { query, label, category } of queries) {
    const result = await scrapeLinkedInLeads({
      apiKey,
      query,
      queryLabel: label,
      queryCategory: category,
      numResults: numResultsPerQuery,
    });

    if (result.success) {
      allLeads.push(...result.leads);
      totalResults += result.totalResults;
    } else if (result.error) {
      errors.push(`${label}: ${result.error}`);
    }

    // Small delay between requests to be respectful of API limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Deduplicate leads
  const uniqueLeads = deduplicateLeads(allLeads);

  return {
    success: errors.length === 0,
    leads: uniqueLeads,
    errors,
    totalResults,
  };
}

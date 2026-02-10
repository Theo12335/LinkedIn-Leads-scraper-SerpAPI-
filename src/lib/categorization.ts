// Lead Categorization Engine
// Six Sigma Principle: Data-driven classification reduces variability

import { Lead, LeadCategory, SerpApiResult } from './types';

// Keyword weights for categorization - Higher weight = stronger signal
const CATEGORY_KEYWORDS: Record<LeadCategory, { keywords: string[]; weight: number }[]> = {
  'Kitchen Tenant': [
    { keywords: ['catering', 'caterer', 'catering business', 'catering company'], weight: 10 },
    { keywords: ['food truck', 'mobile food', 'food trailer'], weight: 10 },
    { keywords: ['ghost kitchen', 'virtual kitchen', 'cloud kitchen', 'delivery kitchen'], weight: 10 },
    { keywords: ['private chef', 'personal chef', 'executive chef'], weight: 8 },
    { keywords: ['meal prep', 'meal delivery', 'healthy meals', 'prepared meals'], weight: 8 },
    { keywords: ['chef owner', 'culinary entrepreneur', 'food entrepreneur'], weight: 7 },
    { keywords: ['commercial kitchen', 'commissary', 'shared kitchen'], weight: 9 },
    { keywords: ['food production', 'food manufacturing'], weight: 6 },
  ],
  'Office Tenant': [
    { keywords: ['food consultant', 'culinary consultant', 'restaurant consultant'], weight: 10 },
    { keywords: ['food brand', 'cpg', 'consumer packaged goods'], weight: 10 },
    { keywords: ['food startup', 'food tech', 'foodtech'], weight: 9 },
    { keywords: ['restaurant group', 'hospitality management'], weight: 7 },
    { keywords: ['food marketing', 'food branding'], weight: 6 },
    { keywords: ['nutrition consultant', 'dietitian', 'nutritionist'], weight: 5 },
  ],
  'Event Client': [
    { keywords: ['event planner', 'event planning', 'event coordinator'], weight: 10 },
    { keywords: ['wedding planner', 'wedding coordinator', 'bridal'], weight: 10 },
    { keywords: ['corporate events', 'event management', 'event producer'], weight: 9 },
    { keywords: ['party planner', 'celebration', 'special events'], weight: 8 },
    { keywords: ['venue coordinator', 'banquet', 'reception'], weight: 7 },
  ],
  'Uncategorized': [],
};

// Location relevance keywords for Baltimore/Maryland area
const LOCATION_KEYWORDS = [
  'baltimore', 'maryland', 'md', 'dc', 'washington', 'dmv',
  'annapolis', 'columbia', 'silver spring', 'bethesda', 'rockville',
  'towson', 'glen burnie', 'dundalk', 'essex', 'middle river',
];

interface CategorizationResult {
  category: LeadCategory;
  confidence: 'High' | 'Medium' | 'Low';
  scores: Record<LeadCategory, number>;
}

/**
 * Categorize a lead based on their LinkedIn headline and snippet
 * Uses weighted keyword matching for accurate classification
 */
export function categorizeLead(title: string, snippet: string): CategorizationResult {
  const combinedText = `${title} ${snippet}`.toLowerCase();

  const scores: Record<LeadCategory, number> = {
    'Kitchen Tenant': 0,
    'Office Tenant': 0,
    'Event Client': 0,
    'Uncategorized': 0,
  };

  // Calculate scores for each category
  for (const [category, keywordGroups] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Uncategorized') continue;

    for (const { keywords, weight } of keywordGroups) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          scores[category as LeadCategory] += weight;
        }
      }
    }
  }

  // Bonus for location relevance
  const hasLocationRelevance = LOCATION_KEYWORDS.some(loc =>
    combinedText.includes(loc.toLowerCase())
  );

  if (hasLocationRelevance) {
    // Boost the highest scoring category if location is relevant
    const maxCategory = Object.entries(scores)
      .filter(([cat]) => cat !== 'Uncategorized')
      .sort(([, a], [, b]) => b - a)[0];

    if (maxCategory && scores[maxCategory[0] as LeadCategory] > 0) {
      scores[maxCategory[0] as LeadCategory] += 3;
    }
  }

  // Determine category and confidence
  const sortedCategories = Object.entries(scores)
    .filter(([cat]) => cat !== 'Uncategorized')
    .sort(([, a], [, b]) => b - a);

  const [topCategory, topScore] = sortedCategories[0] || ['Uncategorized', 0];
  const [, secondScore] = sortedCategories[1] || ['', 0];

  let category: LeadCategory;
  let confidence: 'High' | 'Medium' | 'Low';

  if (topScore === 0) {
    category = 'Uncategorized';
    confidence = 'Low';
  } else if (topScore >= 15 && topScore > secondScore * 1.5) {
    category = topCategory as LeadCategory;
    confidence = 'High';
  } else if (topScore >= 8) {
    category = topCategory as LeadCategory;
    confidence = 'Medium';
  } else {
    category = topCategory as LeadCategory;
    confidence = 'Low';
  }

  return { category, confidence, scores };
}

/**
 * Extract name from LinkedIn title
 * LinkedIn titles typically follow: "Name - Headline | LinkedIn"
 */
export function extractNameFromTitle(title: string): string {
  // Remove " | LinkedIn" suffix
  let cleaned = title.replace(/\s*\|\s*LinkedIn\s*$/i, '');

  // Split by " - " to separate name from headline
  const parts = cleaned.split(' - ');

  if (parts.length > 0) {
    return parts[0].trim();
  }

  return cleaned.trim();
}

/**
 * Extract headline from LinkedIn title
 */
export function extractHeadlineFromTitle(title: string): string {
  // Remove " | LinkedIn" suffix
  let cleaned = title.replace(/\s*\|\s*LinkedIn\s*$/i, '');

  // Split by " - " to separate name from headline
  const parts = cleaned.split(' - ');

  if (parts.length > 1) {
    return parts.slice(1).join(' - ').trim();
  }

  return '';
}

/**
 * Convert SerpAPI result to Lead object with categorization
 */
export function serpResultToLead(
  result: SerpApiResult,
  queryCategory: LeadCategory,
  queryLabel: string
): Lead {
  const name = extractNameFromTitle(result.title);
  const headline = extractHeadlineFromTitle(result.title);
  const { category, confidence } = categorizeLead(result.title, result.snippet);

  // Use query category if our categorization is uncertain
  const finalCategory = category === 'Uncategorized' ? queryCategory : category;

  return {
    id: `lead-${Date.now()}-${result.position}`,
    name,
    headline,
    profileUrl: result.link,
    snippet: result.snippet,
    category: finalCategory,
    confidence: category === 'Uncategorized' ? 'Low' : confidence,
    source: queryLabel,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Deduplicate leads by profile URL
 */
export function deduplicateLeads(leads: Lead[]): Lead[] {
  const seen = new Map<string, Lead>();

  for (const lead of leads) {
    // Normalize URL for comparison
    const normalizedUrl = lead.profileUrl.toLowerCase().replace(/\/$/, '');

    if (!seen.has(normalizedUrl)) {
      seen.set(normalizedUrl, lead);
    } else {
      // Keep the one with higher confidence
      const existing = seen.get(normalizedUrl)!;
      const confidenceOrder = { High: 3, Medium: 2, Low: 1 };

      if (confidenceOrder[lead.confidence] > confidenceOrder[existing.confidence]) {
        seen.set(normalizedUrl, lead);
      }
    }
  }

  return Array.from(seen.values());
}

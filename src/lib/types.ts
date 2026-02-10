// Type definitions for LinkedIn Lead Scraper
// Six Sigma Principle: Clearly defined specifications reduce defects

export type LeadCategory = 'Kitchen Tenant' | 'Office Tenant' | 'Event Client' | 'Uncategorized';

export interface Lead {
  id: string;
  name: string;
  headline: string;
  profileUrl: string;
  snippet: string;
  category: LeadCategory;
  confidence: 'High' | 'Medium' | 'Low';
  source: string;
  scrapedAt: string;
}

export interface SearchQuery {
  id: string;
  label: string;
  query: string;
  category: LeadCategory;
  enabled: boolean;
}

export interface SerpApiResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    num: number;
  };
  organic_results?: SerpApiResult[];
  error?: string;
}

export interface SerpApiResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
}

export interface ScrapingResult {
  success: boolean;
  leads: Lead[];
  error?: string;
  totalResults: number;
  query: string;
}

// Default search queries optimized for The LaChow's target audience
export const DEFAULT_SEARCH_QUERIES: SearchQuery[] = [
  // Kitchen Tenant Queries
  {
    id: 'catering-owner',
    label: 'Catering Owners',
    query: '"catering owner" OR "catering business" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Kitchen Tenant',
    enabled: true,
  },
  {
    id: 'food-truck',
    label: 'Food Truck Operators',
    query: '"food truck" owner Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Kitchen Tenant',
    enabled: true,
  },
  {
    id: 'ghost-kitchen',
    label: 'Ghost Kitchen Operators',
    query: '"ghost kitchen" OR "virtual kitchen" OR "cloud kitchen" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Kitchen Tenant',
    enabled: false,
  },
  {
    id: 'private-chef',
    label: 'Private Chefs',
    query: '"private chef" OR "personal chef" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Kitchen Tenant',
    enabled: false,
  },
  {
    id: 'meal-prep',
    label: 'Meal Prep Business',
    query: '"meal prep" business owner Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Kitchen Tenant',
    enabled: false,
  },
  // Office Tenant Queries
  {
    id: 'food-consultant',
    label: 'Food Consultants',
    query: '"food consultant" OR "culinary consultant" OR "restaurant consultant" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Office Tenant',
    enabled: false,
  },
  {
    id: 'cpg-founder',
    label: 'CPG/Food Brand Founders',
    query: '"food brand" founder OR "CPG founder" OR "food startup" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Office Tenant',
    enabled: false,
  },
  // Event Client Queries
  {
    id: 'event-planner',
    label: 'Event Planners',
    query: '"event planner" OR "event coordinator" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Event Client',
    enabled: true,
  },
  {
    id: 'wedding-planner',
    label: 'Wedding Planners',
    query: '"wedding planner" OR "wedding coordinator" Baltimore OR Maryland site:linkedin.com/in/',
    category: 'Event Client',
    enabled: false,
  },
];

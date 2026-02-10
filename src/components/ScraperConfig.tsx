'use client';

// Scraper Configuration Component
// Six Sigma Principle: User-controlled parameters with validation

import { useState, useCallback } from 'react';
import { SearchQuery, DEFAULT_SEARCH_QUERIES, Lead, LeadCategory } from '@/lib/types';
import { batchScrapeLeads } from '@/app/actions/scrape';

interface ScraperConfigProps {
  onLeadsScraped: (leads: Lead[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ScraperConfig({ onLeadsScraped, isLoading, setIsLoading }: ScraperConfigProps) {
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_SERPAPI_KEY || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>(DEFAULT_SEARCH_QUERIES);
  const [customQuery, setCustomQuery] = useState('');
  const [customCategory, setCustomCategory] = useState<LeadCategory>('Kitchen Tenant');
  const [resultsPerQuery, setResultsPerQuery] = useState(10);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const toggleQuery = useCallback((id: string) => {
    setSearchQueries(prev =>
      prev.map(q => q.id === id ? { ...q, enabled: !q.enabled } : q)
    );
  }, []);

  const addCustomQuery = useCallback(() => {
    if (!customQuery.trim()) return;

    const newQuery: SearchQuery = {
      id: `custom-${Date.now()}`,
      label: `Custom: ${customQuery.slice(0, 30)}...`,
      query: customQuery.includes('site:linkedin.com')
        ? customQuery
        : `${customQuery} site:linkedin.com/in/`,
      category: customCategory,
      enabled: true,
    };

    setSearchQueries(prev => [...prev, newQuery]);
    setCustomQuery('');
  }, [customQuery, customCategory]);

  const removeQuery = useCallback((id: string) => {
    setSearchQueries(prev => prev.filter(q => q.id !== id));
  }, []);

  const handleScrape = async () => {
    setErrors([]);
    setStatus('');

    if (!apiKey.trim()) {
      setErrors(['Please enter your SerpAPI key']);
      return;
    }

    const enabledQueries = searchQueries.filter(q => q.enabled);

    if (enabledQueries.length === 0) {
      setErrors(['Please enable at least one search query']);
      return;
    }

    setIsLoading(true);
    setStatus(`Scraping ${enabledQueries.length} queries...`);

    try {
      const result = await batchScrapeLeads(
        apiKey,
        enabledQueries.map(q => ({
          query: q.query,
          label: q.label,
          category: q.category,
        })),
        resultsPerQuery
      );

      if (result.errors.length > 0) {
        setErrors(result.errors);
      }

      if (result.leads.length > 0) {
        setStatus(`Found ${result.leads.length} unique leads`);
        onLeadsScraped(result.leads);
      } else if (result.errors.length === 0) {
        setStatus('No leads found. Try adjusting your search queries.');
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An error occurred']);
    } finally {
      setIsLoading(false);
    }
  };

  const enabledCount = searchQueries.filter(q => q.enabled).length;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Scraper Configuration
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure your SerpAPI key and search queries to find LinkedIn leads
        </p>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <label htmlFor="apiKey" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          SerpAPI Key
        </label>
        <div className="relative">
          <input
            id="apiKey"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your SerpAPI key"
            className="w-full px-3 py-2 pr-20 border border-zinc-300 dark:border-zinc-700 rounded-md
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500
                       hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Get your API key from{' '}
          <a
            href="https://serpapi.com/manage-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-700 underline"
          >
            serpapi.com
          </a>
        </p>
      </div>

      {/* Results Per Query */}
      <div className="space-y-2">
        <label htmlFor="resultsPerQuery" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Results per Query: {resultsPerQuery}
        </label>
        <input
          id="resultsPerQuery"
          type="range"
          min="5"
          max="50"
          step="5"
          value={resultsPerQuery}
          onChange={(e) => setResultsPerQuery(Number(e.target.value))}
          className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer
                     accent-amber-500"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      {/* Predefined Queries */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Search Queries ({enabledCount} enabled)
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {searchQueries.map((query) => (
            <div
              key={query.id}
              className={`flex items-center justify-between p-3 rounded-md border transition-colors
                         ${query.enabled
                           ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                           : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                         }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={query.enabled}
                  onChange={() => toggleQuery(query.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {query.label}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {query.category}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap
                           ${query.category === 'Kitchen Tenant'
                             ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                             : query.category === 'Office Tenant'
                             ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                             : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                           }`}
              >
                {query.category}
              </span>
              {query.id.startsWith('custom-') && (
                <button
                  onClick={() => removeQuery(query.id)}
                  className="ml-2 text-zinc-400 hover:text-red-500 transition-colors"
                  aria-label="Remove query"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Query Input */}
      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add Custom Query
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder='e.g., "sous chef" Baltimore'
            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       placeholder:text-zinc-400 text-sm"
          />
          <select
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value as LeadCategory)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          >
            <option value="Kitchen Tenant">Kitchen Tenant</option>
            <option value="Office Tenant">Office Tenant</option>
            <option value="Event Client">Event Client</option>
          </select>
          <button
            onClick={addCustomQuery}
            disabled={!customQuery.trim()}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
                       rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Message */}
      {status && !errors.length && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
      )}

      {/* Scrape Button */}
      <button
        onClick={handleScrape}
        disabled={isLoading || !apiKey.trim() || enabledCount === 0}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold
                   rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Scraping...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Start Scraping
          </>
        )}
      </button>
    </div>
  );
}

'use client';

// LinkedIn Lead Scraper for The LaChow
// Six Sigma Black Belt Implementation: DMAIC Framework Applied

import { useState } from 'react';
import { Lead } from '@/lib/types';
import ScraperConfig from '@/components/ScraperConfig';
import LeadsTable from '@/components/LeadsTable';

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLeadsScraped = (newLeads: Lead[]) => {
    setLeads(prev => {
      // Merge with existing leads and deduplicate by URL
      const allLeads = [...prev, ...newLeads];
      const seen = new Map<string, Lead>();

      for (const lead of allLeads) {
        const normalizedUrl = lead.profileUrl.toLowerCase().replace(/\/$/, '');
        if (!seen.has(normalizedUrl)) {
          seen.set(normalizedUrl, lead);
        }
      }

      return Array.from(seen.values());
    });
  };

  const clearLeads = () => {
    setLeads([]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  LinkedIn Lead Scraper
                </h1>
                <p className="text-sm text-zinc-500">
                  Powered by SerpAPI for{' '}
                  <a
                    href="https://www.thelachow.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    The LaChow
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {leads.length > 0 && (
                <button
                  onClick={clearLeads}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Clear All
                </button>
              )}
              <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {leads.length} leads found
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <ScraperConfig
                onLeadsScraped={handleLeadsScraped}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />

              {/* Quick Stats */}
              {leads.length > 0 && (
                <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    Lead Summary
                  </h3>
                  <div className="space-y-2">
                    {['Kitchen Tenant', 'Office Tenant', 'Event Client', 'Uncategorized'].map((category) => {
                      const count = leads.filter(l => l.category === category).length;
                      if (count === 0) return null;
                      const percentage = Math.round((count / leads.length) * 100);
                      return (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">{category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  category === 'Kitchen Tenant' ? 'bg-green-500' :
                                  category === 'Office Tenant' ? 'bg-blue-500' :
                                  category === 'Event Client' ? 'bg-purple-500' : 'bg-zinc-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-zinc-900 dark:text-zinc-100 font-medium w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  About This Tool
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  This scraper finds potential leads for The LaChow by searching LinkedIn profiles
                  using SerpAPI. Leads are automatically categorized as Kitchen Tenants, Office Tenants,
                  or Event Clients based on their profile information.
                </p>
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Target Area: Baltimore, MD / DMV Region
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results Table */}
          <div className="lg:col-span-8">
            <LeadsTable leads={leads} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              Built with Next.js, Tailwind CSS, and SerpAPI
            </p>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <a
                href="https://www.thelachow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-600 transition-colors"
              >
                The LaChow
              </a>
              <span>|</span>
              <a
                href="https://serpapi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-600 transition-colors"
              >
                SerpAPI
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

// Leads Data Table Component
// Six Sigma Principle: Clear data visualization with sorting and filtering

import { useState, useMemo } from 'react';
import { Lead, LeadCategory } from '@/lib/types';
import { downloadCSV } from '@/lib/csv-export';
import { exportToGoogleSheets } from '@/app/actions/sheets';

interface LeadsTableProps {
  leads: Lead[];
}

type SortField = 'name' | 'category' | 'confidence' | 'scrapedAt';
type SortDirection = 'asc' | 'desc';

const CATEGORY_COLORS: Record<LeadCategory, string> = {
  'Kitchen Tenant': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Office Tenant': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Event Client': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Uncategorized': 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  'High': 'text-green-600 dark:text-green-400',
  'Medium': 'text-amber-600 dark:text-amber-400',
  'Low': 'text-zinc-500 dark:text-zinc-500',
};

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>('confidence');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState<LeadCategory | 'all'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sheetsExporting, setSheetsExporting] = useState(false);
  const [sheetsMessage, setSheetsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    leads.forEach(lead => {
      counts[lead.category] = (counts[lead.category] || 0) + 1;
    });
    return counts;
  }, [leads]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(lead => lead.category === categoryFilter);
    }

    // Apply confidence filter
    if (confidenceFilter !== 'all') {
      result = result.filter(lead => lead.confidence === confidenceFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(term) ||
        lead.headline.toLowerCase().includes(term) ||
        lead.snippet.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'confidence':
          const confidenceOrder = { High: 3, Medium: 2, Low: 1 };
          comparison = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
          break;
        case 'scrapedAt':
          comparison = new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, categoryFilter, confidenceFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    downloadCSV(filteredLeads);
  };

  const handleExportAll = () => {
    downloadCSV(leads);
  };

  const handleExportToSheets = async () => {
    setSheetsExporting(true);
    setSheetsMessage(null);

    try {
      const result = await exportToGoogleSheets(filteredLeads);
      setSheetsMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });

      // Clear success message after 5 seconds
      if (result.success) {
        setTimeout(() => setSheetsMessage(null), 5000);
      }
    } catch (error) {
      setSheetsMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export',
      });
    } finally {
      setSheetsExporting(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-block">
      {sortField === field ? (
        sortDirection === 'asc' ? '↑' : '↓'
      ) : (
        <span className="text-zinc-300 dark:text-zinc-600">↕</span>
      )}
    </span>
  );

  if (leads.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">No leads yet</h3>
        <p className="mt-2 text-sm text-zinc-500">Configure your search queries and start scraping to find leads.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header with filters */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Leads ({filteredLeads.length})
            </h2>
            <p className="text-sm text-zinc-500">
              {filteredLeads.length !== leads.length && `Filtered from ${leads.length} total`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300
                         bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200
                         dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors
                         flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Filtered
            </button>
            <button
              onClick={handleExportAll}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-500
                         rounded-md hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export All
            </button>
            <button
              onClick={handleExportToSheets}
              disabled={filteredLeads.length === 0 || sheetsExporting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600
                         rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {sheetsExporting ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-9 15H6v-4.5h4.5V18zm0-6H6v-4.5h4.5V12zm6 6h-4.5v-4.5H18V18zm0-6h-4.5v-4.5H18V12z"/>
                </svg>
              )}
              {sheetsExporting ? 'Exporting...' : 'To Google Sheets'}
            </button>
          </div>
        </div>

        {/* Google Sheets Export Status */}
        {sheetsMessage && (
          <div className={`p-3 rounded-md text-sm ${
            sheetsMessage.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {sheetsMessage.text}
            {sheetsMessage.type === 'success' && (
              <a
                href="https://docs.google.com/spreadsheets/d/1GIBEIhp93QSzygM-ZEFJmJOixinptiOLwJdCt8eqNFc/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline font-medium"
              >
                Open Sheet
              </a>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, headline, or snippet..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md
                         bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         placeholder:text-zinc-400 text-sm"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LeadCategory | 'all')}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          >
            <option value="all">All Categories ({categoryCounts.all})</option>
            <option value="Kitchen Tenant">Kitchen Tenant ({categoryCounts['Kitchen Tenant'] || 0})</option>
            <option value="Office Tenant">Office Tenant ({categoryCounts['Office Tenant'] || 0})</option>
            <option value="Event Client">Event Client ({categoryCounts['Event Client'] || 0})</option>
            <option value="Uncategorized">Uncategorized ({categoryCounts['Uncategorized'] || 0})</option>
          </select>

          {/* Confidence Filter */}
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          >
            <option value="all">All Confidence</option>
            <option value="High">High Confidence</option>
            <option value="Medium">Medium Confidence</option>
            <option value="Low">Low Confidence</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Name <SortIcon field="name" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Headline
              </th>
              <th
                onClick={() => handleSort('category')}
                className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Category <SortIcon field="category" />
              </th>
              <th
                onClick={() => handleSort('confidence')}
                className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Confidence <SortIcon field="confidence" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-4">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{lead.name}</div>
                  <div className="text-xs text-zinc-500 mt-1">{lead.source}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={lead.headline}>
                    {lead.headline || <span className="italic text-zinc-400">No headline</span>}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[lead.category]}`}>
                    {lead.category}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm font-medium ${CONFIDENCE_COLORS[lead.confidence]}`}>
                    {lead.confidence}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <a
                    href={lead.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700
                             dark:text-amber-400 dark:hover:text-amber-300 font-medium"
                  >
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No results message */}
      {filteredLeads.length === 0 && leads.length > 0 && (
        <div className="p-8 text-center">
          <p className="text-zinc-500">No leads match your current filters.</p>
          <button
            onClick={() => {
              setCategoryFilter('all');
              setConfidenceFilter('all');
              setSearchTerm('');
            }}
            className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

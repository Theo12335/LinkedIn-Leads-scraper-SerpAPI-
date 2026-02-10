// CSV Export Utility
// Six Sigma Principle: Standardized outputs ensure data integrity

import { Lead } from './types';

/**
 * Escape a CSV field value
 * Handles quotes, commas, and newlines according to RFC 4180
 */
function escapeCSVField(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if the field needs to be quoted
  const needsQuoting = stringValue.includes(',') ||
                       stringValue.includes('"') ||
                       stringValue.includes('\n') ||
                       stringValue.includes('\r');

  if (needsQuoting) {
    // Escape double quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

/**
 * Convert leads array to CSV string
 */
export function leadsToCSV(leads: Lead[]): string {
  if (leads.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'Name',
    'Headline',
    'Category',
    'Confidence',
    'Profile URL',
    'Snippet',
    'Source Query',
    'Scraped At',
  ];

  // Create header row
  const headerRow = headers.map(escapeCSVField).join(',');

  // Create data rows
  const dataRows = leads.map(lead => {
    const row = [
      lead.name,
      lead.headline,
      lead.category,
      lead.confidence,
      lead.profileUrl,
      lead.snippet,
      lead.source,
      lead.scrapedAt,
    ];
    return row.map(escapeCSVField).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix: string = 'lachow-leads'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}-${dateStr}-${timeStr}.csv`;
}

/**
 * Trigger download of CSV file in browser
 */
export function downloadCSV(leads: Lead[], filename?: string): void {
  const csvContent = leadsToCSV(leads);
  const finalFilename = filename || generateCSVFilename();

  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);
}

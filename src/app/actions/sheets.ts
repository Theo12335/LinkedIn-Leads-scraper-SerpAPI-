'use server';

// Google Sheets Export Server Action
// Uses Google Apps Script Web App as bridge to append leads

import { Lead } from '@/lib/types';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCRPZPP_gZAgZe8K62oTgSvsX30l9hfuAvE34cKZ6gxdlmLSH3yVukdc9bhEqtYwvaeA/exec';

interface SheetExportResult {
  success: boolean;
  message: string;
  rowsAdded?: number;
}

/**
 * Generate a personalized connection note based on lead category
 */
function generateConnectionNote(lead: Lead): string {
  const firstName = lead.name.split(' ')[0];
  const headline = lead.headline || 'the food industry';

  const templates: Record<string, string> = {
    'Kitchen Tenant': `Hi ${firstName}, I noticed your work in ${headline}. The LaChow offers shared commercial kitchen space in Baltimore - would love to connect and share how we support food entrepreneurs like yourself.`,
    'Office Tenant': `Hi ${firstName}, I came across your profile and was impressed by your background in ${headline}. The LaChow provides flexible office space for food industry professionals in Baltimore - let's connect!`,
    'Event Client': `Hi ${firstName}, I saw your experience in ${headline}. The LaChow has beautiful event venues in Baltimore perfect for your clients - would love to discuss potential collaboration.`,
    'Uncategorized': `Hi ${firstName}, I came across your profile and thought we might have synergies. The LaChow is Baltimore's premier shared kitchen and event space - let's connect!`,
  };

  return templates[lead.category] || templates['Uncategorized'];
}

/**
 * Format date for Google Sheets
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Export leads to Google Sheets via Apps Script Web App
 */
export async function exportToGoogleSheets(leads: Lead[]): Promise<SheetExportResult> {
  if (leads.length === 0) {
    return {
      success: false,
      message: 'No leads to export',
    };
  }

  // Format leads for the sheet columns: Date, Name, Job Title, Profile Link, Connection Note, Status
  const rows = leads.map(lead => [
    formatDate(lead.scrapedAt),           // Date
    lead.name,                             // Name
    lead.headline || lead.category,        // Job Title
    lead.profileUrl,                       // Profile Link
    generateConnectionNote(lead),          // Connection Note
    'New',                                 // Status
  ]);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rows }),
      redirect: 'follow',
    });

    // Apps Script returns a redirect, so we need to follow it
    if (!response.ok && response.status !== 302) {
      return {
        success: false,
        message: `Export failed: ${response.statusText}`,
      };
    }

    // Try to parse the response
    const text = await response.text();

    try {
      const result = JSON.parse(text);
      if (result.success) {
        return {
          success: true,
          message: `Successfully exported ${leads.length} leads to Google Sheets`,
          rowsAdded: leads.length,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Export failed',
        };
      }
    } catch {
      // If we can't parse JSON but got a 200, assume success
      if (response.ok) {
        return {
          success: true,
          message: `Successfully exported ${leads.length} leads to Google Sheets`,
          rowsAdded: leads.length,
        };
      }
      return {
        success: false,
        message: 'Unexpected response from Google Sheets',
      };
    }

  } catch (error) {
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

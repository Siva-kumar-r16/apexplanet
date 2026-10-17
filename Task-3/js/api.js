// TVMaze API Integration Module
// Docs: https://www.tvmaze.com/api

const BASE_URL = 'https://api.tvmaze.com';

async function getJSON(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${path}`);
  return response.json();
}

/** Fetch show details by name (best match). */
export async function fetchShow(showName) {
  try {
    return await getJSON(`/singlesearch/shows?q=${encodeURIComponent(showName)}`);
  } catch (error) {
    console.error('API Error (fetchShow):', error);
    return null;
  }
}

/** Fetch all episodes for a given show ID. */
export async function fetchEpisodes(showId) {
  try {
    return await getJSON(`/shows/${showId}/episodes`);
  } catch (error) {
    console.error('API Error (fetchEpisodes):', error);
    return [];
  }
}

/**
 * Fetch the cast for a show. Each entry pairs an actor ("person") with the
 * character they play, including the character's own image — so pictures
 * always match the character shown.
 */
export async function fetchCast(showId) {
  try {
    return await getJSON(`/shows/${showId}/cast`);
  } catch (error) {
    console.error('API Error (fetchCast):', error);
    return [];
  }
}

/** Turn API HTML (e.g. summaries) into plain text. */
export function sanitizeHTML(html) {
  if (!html) return 'No description available.';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/** Escape text before placing it inside an HTML template string. */
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
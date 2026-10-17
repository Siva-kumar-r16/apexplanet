import { fetchShow, fetchEpisodes, fetchCast, sanitizeHTML, escapeHTML } from './api.js';
import { getBio } from './characters.js';
import { quizData, characterDescriptions, quizCharacterMap } from './quiz.js';

// --- Constants ---
const SHOWS = [
  { key: 'TBBT', name: 'The Big Bang Theory', label: 'The Big Bang Theory' },
  { key: 'YS', name: 'Young Sheldon', label: 'Young Sheldon' }
];
const SHOW_LABEL = Object.fromEntries(SHOWS.map(s => [s.key, s.label]));
const CAST_LIMIT = 12;
const TILE_COLORS = ['#e63946', '#ff8c1a', '#ffd60a', '#2ecc71', '#1e90ff'];

// --- DOM Elements ---
const navHamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

const charGrid = document.getElementById('character-grid');
const charSearch = document.getElementById('char-search');
const charFilter = document.getElementById('char-filter');
const charStatus = document.getElementById('char-status');

const showBtns = document.querySelectorAll('.show-btn');
const showInfoCard = document.getElementById('show-info');
const epGrid = document.getElementById('episode-grid');
const epControls = document.getElementById('episode-controls');
const epSearch = document.getElementById('ep-search');
const seasonFilter = document.getElementById('season-filter');
const apiStatus = document.getElementById('api-status');

const favGrid = document.getElementById('favorites-grid');

// --- State ---
let allCharacters = [];
let currentEpisodes = [];
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('sheldonverse_favs'));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('sheldonverse_favs', JSON.stringify(favorites));
  } catch { /* storage unavailable — favorites last for this visit only */ }
}

// --- Helpers ---
function placeholderImage(letter) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#141414"/><rect x="20" y="20" width="260" height="360" fill="none" stroke="#ff8c1a" stroke-width="4"/><text x="150" y="245" font-size="150" text-anchor="middle" fill="#ffd60a" font-family="Arial, sans-serif" font-weight="700">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function attachImageFallback(img, letter) {
  img.addEventListener('error', () => {
    img.onerror = null;
    img.src = placeholderImage(letter);
  }, { once: true });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  renderTitleTiles();
  setupNavigation();
  setupCharacterFilters();
  loadCharacters();
  loadApiData(SHOWS[0].name);
  setupApiControls();
  initQuiz();
  renderFavorites();
});

// --- Title tiles (periodic-table style heading) ---
function renderTitleTiles() {
  const target = document.getElementById('title-tiles');
  if (!target) return;
  let index = 0;
  const words = [['THE'], ['SHELDON', 'VERSE']];
  words.forEach((line, i) => {
    const row = document.createElement('div');
    row.className = `tile-row${i === 0 ? ' tile-row-small' : ''}`;
    line.forEach(word => {
      const group = document.createElement('div');
      group.className = 'tile-word';
      [...word].forEach(letter => {
        const tile = document.createElement('span');
        tile.className = 'tile';
        tile.style.setProperty('--c', TILE_COLORS[index % TILE_COLORS.length]);
        tile.innerHTML = `<small>${index + 1}</small><b>${letter}</b>`;
        group.appendChild(tile);
        index++;
      });
      row.appendChild(group);
    });
    target.appendChild(row);
  });
}

// --- Navigation ---
function setupNavigation() {
  navHamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    navHamburger.setAttribute('aria-expanded', String(open));
  });
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') navLinks.classList.remove('active');
  });
}

// --- Character Explorer (live cast data from TVMaze) ---
async function loadCharacters() {
  charStatus.textContent = 'Loading cast from TVMaze...';
  charStatus.classList.remove('hidden');
  charStatus.classList.remove('error');

  const results = await Promise.all(SHOWS.map(async (show) => {
    const info = await fetchShow(show.name);
    if (!info) return [];
    const cast = await fetchCast(info.id);
    const seen = new Set();
    return cast
      .filter(entry => entry.character && !seen.has(entry.character.id) && seen.add(entry.character.id))
      .slice(0, CAST_LIMIT)
      .map(entry => ({
        id: `${show.key}-${entry.character.id}`,
        name: entry.character.name,
        show: show.key,
        actor: entry.person?.name || '',
        description: getBio(show.key, entry.character.name),
        image: entry.character.image?.medium || entry.character.image?.original || ''
      }));
  }));

  allCharacters = results.flat();

  if (allCharacters.length === 0) {
    charStatus.textContent = 'Could not load the cast right now. Please check your connection and refresh.';
    charStatus.classList.add('error');
    charGrid.innerHTML = '';
    return;
  }

  charStatus.classList.add('hidden');
  applyCharacterFilters();
}

function buildCharacterCard(char, { showDescription, onFavorite }) {
  const isFav = favorites.some(f => f.id === char.id);
  const card = document.createElement('article');
  card.className = 'glass-card char-card';
  const letter = (char.name || '?').charAt(0).toUpperCase();

  card.innerHTML = `
    <div class="card-media">
      <img src="${escapeHTML(char.image) || placeholderImage(letter)}" alt="${escapeHTML(char.name)}" class="card-img" loading="lazy">
      <button class="fav-btn ${isFav ? 'active' : ''}" aria-label="${isFav ? 'Remove from' : 'Add to'} favorites" aria-pressed="${isFav}">★</button>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHTML(char.name)}</h3>
      <p class="card-subtitle">${escapeHTML(SHOW_LABEL[char.show] || '')}${char.actor ? ` · played by ${escapeHTML(char.actor)}` : ''}</p>
      ${showDescription && char.description ? `<p class="card-text">${escapeHTML(char.description)}</p>` : ''}
    </div>
  `;

  attachImageFallback(card.querySelector('.card-img'), letter);
  card.querySelector('.fav-btn').addEventListener('click', () => onFavorite(char));
  return card;
}

function renderCharacters(data) {
  charGrid.innerHTML = '';
  if (data.length === 0) {
    charGrid.innerHTML = '<p class="empty-note">No characters found.</p>';
    return;
  }
  data.forEach(char => {
    charGrid.appendChild(buildCharacterCard(char, { showDescription: true, onFavorite: toggleFavorite }));
  });
}

function applyCharacterFilters() {
  const term = charSearch.value.trim().toLowerCase();
  const show = charFilter.value;
  renderCharacters(allCharacters.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(term) || c.actor.toLowerCase().includes(term);
    const matchShow = show === 'all' || c.show === show;
    return matchSearch && matchShow;
  }));
}

function setupCharacterFilters() {
  charSearch.addEventListener('input', applyCharacterFilters);
  charFilter.addEventListener('change', applyCharacterFilters);
}

// --- API Integration (Episodes) ---
let episodeRequestId = 0;

async function loadApiData(showName) {
  const requestId = ++episodeRequestId;
  apiStatus.textContent = 'Fetching show data from TVMaze...';
  apiStatus.classList.remove('hidden', 'error');
  showInfoCard.classList.add('hidden');
  epControls.classList.add('hidden');
  epGrid.innerHTML = '';

  const show = await fetchShow(showName);
  if (requestId !== episodeRequestId) return; // a newer request replaced this one

  if (!show) {
    apiStatus.textContent = 'Failed to load show data. Please try again later.';
    apiStatus.classList.add('error');
    return;
  }

  const poster = show.image?.medium || '';
  showInfoCard.innerHTML = `
    ${poster ? `<img src="${escapeHTML(poster)}" alt="${escapeHTML(show.name)} poster" class="show-poster">` : ''}
    <div class="show-info-text">
      <h3>${escapeHTML(show.name)}</h3>
      <p class="meta"><strong>Premiered:</strong> ${escapeHTML(show.premiered || 'Unknown')} &nbsp;|&nbsp; <strong>Status:</strong> ${escapeHTML(show.status || 'Unknown')}${show.rating?.average ? ` &nbsp;|&nbsp; <strong>Rating:</strong> ${escapeHTML(show.rating.average)}` : ''}</p>
      <p class="meta"><strong>Genres:</strong> ${escapeHTML((show.genres || []).join(', ') || 'N/A')}</p>
      <p>${escapeHTML(sanitizeHTML(show.summary))}</p>
      ${show.officialSite ? `<a href="${escapeHTML(show.officialSite)}" target="_blank" rel="noopener" class="btn btn-secondary mt-2">Official Site</a>` : ''}
    </div>
  `;
  showInfoCard.classList.remove('hidden');

  apiStatus.textContent = 'Fetching episodes...';
  const episodes = await fetchEpisodes(show.id);
  if (requestId !== episodeRequestId) return;

  currentEpisodes = episodes;
  populateSeasonFilter(episodes);
  renderEpisodes(episodes);

  apiStatus.classList.add('hidden');
  epControls.classList.remove('hidden');
}

function populateSeasonFilter(episodes) {
  const seasons = [...new Set(episodes.map(ep => ep.season))];
  seasonFilter.innerHTML = '<option value="all">All Seasons</option>' +
    seasons.map(s => `<option value="${s}">Season ${s}</option>`).join('');
}

function renderEpisodes(data) {
  epGrid.innerHTML = '';
  if (data.length === 0) {
    epGrid.innerHTML = '<p class="empty-note">No episodes found matching criteria.</p>';
    return;
  }

  const limit = 24; // keep the DOM light
  data.slice(0, limit).forEach(ep => {
    const card = document.createElement('article');
    card.className = 'glass-card ep-card';
    const imgSrc = ep.image?.medium || placeholderImage('?');
    const summary = sanitizeHTML(ep.summary);
    const code = ep.number != null ? `S${ep.season}E${ep.number}` : `S${ep.season} Special`;

    card.innerHTML = `
      <div class="card-media ep-media">
        <img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(ep.name)}" class="card-img ep-img" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(code)}: ${escapeHTML(ep.name)}</h3>
        <p class="card-subtitle">Aired: ${escapeHTML(ep.airdate || 'Unknown')}</p>
        <p class="card-text">${escapeHTML(summary.length > 120 ? summary.substring(0, 120) + '…' : summary)}</p>
      </div>
    `;
    attachImageFallback(card.querySelector('.card-img'), '?');
    epGrid.appendChild(card);
  });

  if (data.length > limit) {
    const note = document.createElement('p');
    note.className = 'empty-note grid-note';
    note.textContent = `Showing ${limit} of ${data.length} episodes. Use search or filters to narrow down.`;
    epGrid.appendChild(note);
  }
}

function setupApiControls() {
  showBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.classList.toggle('btn-primary', active);
        b.classList.toggle('btn-secondary', !active);
      });
      epSearch.value = '';
      loadApiData(btn.dataset.show);
    });
  });

  const filterEpisodes = () => {
    const term = epSearch.value.trim().toLowerCase();
    const season = seasonFilter.value;
    renderEpisodes(currentEpisodes.filter(ep => {
      const matchSearch = ep.name.toLowerCase().includes(term);
      const matchSeason = season === 'all' || String(ep.season) === season;
      return matchSearch && matchSeason;
    }));
  };

  epSearch.addEventListener('input', filterEpisodes);
  seasonFilter.addEventListener('change', filterEpisodes);
}

// --- Quiz Logic ---
let currentQuestionIndex = 0;
let scores = {};
let selectedAnswer = null;

function initQuiz() {
  currentQuestionIndex = 0;
  scores = {};
  document.getElementById('quiz-container').classList.remove('hidden');
  document.getElementById('quiz-result').classList.add('hidden');

  document.getElementById('restart-btn').onclick = initQuiz;

  const nextBtn = document.getElementById('next-btn');
  nextBtn.onclick = () => {
    if (selectedAnswer) {
      for (const [char, points] of Object.entries(selectedAnswer.points)) {
        scores[char] = (scores[char] || 0) + points;
      }
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
      renderQuestion();
    } else {
      showQuizResult();
    }
  };

  renderQuestion();
}

function renderQuestion() {
  const q = quizData[currentQuestionIndex];
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('quiz-step').textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;

  const progress = (currentQuestionIndex / quizData.length) * 100;
  document.getElementById('quiz-progress').style.width = `${progress}%`;

  const optionsContainer = document.getElementById('answer-options');
  optionsContainer.innerHTML = '';
  selectedAnswer = null;

  const nextBtn = document.getElementById('next-btn');
  nextBtn.classList.remove('hidden');
  nextBtn.disabled = true;
  nextBtn.textContent = currentQuestionIndex === quizData.length - 1 ? 'See My Result' : 'Next';

  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAnswer = opt;
      nextBtn.disabled = false;
    };
    optionsContainer.appendChild(btn);
  });
}

function showQuizResult() {
  document.getElementById('quiz-container').classList.add('hidden');

  let winner = 'Sheldon';
  let maxScore = 0;
  for (const [char, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      winner = char;
    }
  }

  document.getElementById('result-name').textContent = winner;
  document.getElementById('result-desc').textContent = characterDescriptions[winner];

  // Show the winner's picture from the live cast data, when available
  const resultImg = document.getElementById('result-img');
  const map = quizCharacterMap[winner];
  const match = map && allCharacters.find(c => c.show === map.show && c.name.toLowerCase().includes(map.match));
  if (match && match.image) {
    resultImg.src = match.image;
    resultImg.alt = match.name;
    attachImageFallback(resultImg, match.name.charAt(0).toUpperCase());
    resultImg.classList.remove('hidden');
  } else {
    resultImg.classList.add('hidden');
  }

  document.getElementById('quiz-result').classList.remove('hidden');
}

// --- Favorites Feature (LocalStorage) ---
function toggleFavorite(charData) {
  const index = favorites.findIndex(f => f.id === charData.id);
  if (index === -1) {
    favorites.push(charData);
  } else {
    favorites.splice(index, 1);
  }
  saveFavorites();
  renderFavorites();
  applyCharacterFilters(); // refresh star state in the directory
}

function renderFavorites() {
  favGrid.innerHTML = '';
  if (favorites.length === 0) {
    favGrid.innerHTML = '<p class="empty-note">You have no saved characters yet. Click the star on a character to save them!</p>';
    return;
  }
  favorites.forEach(char => {
    favGrid.appendChild(buildCharacterCard(char, { showDescription: false, onFavorite: toggleFavorite }));
  });
}
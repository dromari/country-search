import { createSearchManager, type SearchState } from '../core/searchManager.js';
import type { Country } from '../core/mapCountryResponse.js';

function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
}

function renderCountryModal(country: Country): void {
  const overlay = createEl('div', 'modal-overlay');
  const modal = createEl('div', 'modal-content');

  const closeBtn = createEl('button', 'modal-close', '✕');
  closeBtn.type = 'button';
  closeBtn.ariaLabel = 'Close details';

  const closeModal = (): void => overlay.remove();
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  const flagImg = createEl('img', 'modal-flag');
  flagImg.src = country.flag;
  flagImg.alt = country.flagAlt;

  const title = createEl('h2', '', country.name);
  const subtitle = createEl('p', 'card-info', country.officialName);

  const list = createEl('ul', 'modal-list');
  const details: [string, string][] = [
    ['Capital', country.capital],
    ['Region', country.region],
    ['Population', country.population.toLocaleString()],
    ['Area', `${country.area.toLocaleString()} km²`],
    ['Languages', country.languages.length > 0 ? country.languages.join(', ') : 'None'],
    ['Currencies', country.currencies.length > 0 ? country.currencies.join(', ') : 'None'],
    ['Borders', country.borders.length > 0 ? country.borders.join(', ') : 'None'],
    ['Flag description', country.flagAlt],
  ];

  for (const [label, value] of details) {
    const item = createEl('li');
    const strong = createEl('strong', '', `${label}: `);
    item.append(strong, document.createTextNode(value));
    list.append(item);
  }

  modal.append(closeBtn, flagImg, title, subtitle, list);
  overlay.append(modal);
  document.body.append(overlay);
}

function createCountryCard(country: Country): HTMLElement {
  const card = createEl('article', 'card');
  card.addEventListener('click', () => renderCountryModal(country));

  const img = createEl('img', 'card-flag');
  img.src = country.flag;
  img.alt = country.flagAlt;
  img.loading = 'lazy';

  const body = createEl('div', 'card-body');
  const title = createEl('h2', 'card-title', country.name);
  const capital = createEl('p', 'card-info', `Capital: ${country.capital}`);
  const region = createEl('p', 'card-info', `Region: ${country.region}`);
  const population = createEl(
    'p',
    'card-info',
    `Population: ${country.population.toLocaleString()}`
  );
  const languages = createEl(
    'p',
    'card-info',
    `Languages: ${country.languages.length > 0 ? country.languages.join(', ') : 'N/A'}`
  );

  body.append(title, capital, region, population, languages);
  card.append(img, body);
  return card;
}

export function initApp(): void {
  const container = createEl('main', 'container');
  const header = createEl('header', 'header');
  const heading = createEl('h1', '', 'Country Search');

  const input = createEl('input', 'search-input');
  input.type = 'search';
  input.placeholder = 'Enter country name (e.g. Spain, Japan)...';
  input.ariaLabel = 'Search country by name';

  const contentArea = createEl('section');

  header.append(heading, input);
  container.append(header, contentArea);
  document.body.append(container);

  const renderState = (state: SearchState): void => {
    contentArea.replaceChildren();

    if (state.status === 'idle') {
      return;
    }

    if (state.status === 'loading') {
      contentArea.append(createEl('div', 'status-box', 'Searching countries...'));
      return;
    }

    if (state.status === 'empty') {
      contentArea.append(
        createEl('div', 'status-box', 'No countries found matching your search. Try another name!')
      );
      return;
    }

    if (state.status === 'error') {
      const errorBox = createEl('div', 'error-box');
      const errorMsg = createEl('p', '', state.error ?? 'Something went wrong.');
      const retryBtn = createEl('button', 'retry-btn', 'Retry');
      retryBtn.type = 'button';
      retryBtn.addEventListener('click', () => searchManager.retry());

      errorBox.append(errorMsg, retryBtn);
      contentArea.append(errorBox);
      return;
    }

    const grid = createEl('div', 'grid');
    for (const country of state.countries) {
      grid.append(createCountryCard(country));
    }
    contentArea.append(grid);
  };

  const searchManager = createSearchManager(renderState);

  input.addEventListener('input', () => {
    searchManager.handleInput(input.value);
  });
}

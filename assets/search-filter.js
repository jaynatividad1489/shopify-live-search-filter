/**
 * Search & Filter — Dawn Edition
 * Compatible with: Shopify Dawn Theme (v14+)
 * Author: John Venedick Natividad
 * GitHub: https://github.com/jaynatividad1489
 *
 * Features:
 * - PredictiveSearch Web Component (Shopify Predictive Search API)
 * - FacetFilters Web Component (AJAX collection filtering)
 * - FilterDrawer Web Component (mobile drawer)
 * - PriceRange Web Component (dual-handle slider)
 * - URL sync via pushState / popstate
 * - Debounced search + filter inputs
 * - Keyboard navigation (↑ ↓ Enter Escape)
 * - Recent searches (localStorage)
 * - Loading skeleton states
 * - Screen reader live announcements
 * - Dawn cart:refresh event dispatch
 */

/* ─────────────────────────────────────────────
   1. PredictiveSearch Web Component
───────────────────────────────────────────── */
class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.input        = this.querySelector('.search-bar__input');
    this.results      = this.querySelector('.search-bar__results');
    this.spinner      = this.querySelector('.search-bar__spinner');
    this.clearBtn     = this.querySelector('.search-bar__clear');
    this.announcer    = this.querySelector('[aria-live]');
    this.limit        = parseInt(this.dataset.resultsLimit) || 6;
    this.debounceTimer = null;
    this.activeIndex  = -1;
    this.cachedResults = {};
    this.isOpen       = false;

    this.init();
  }

  init() {
    if (!this.input) return;

    // Input handler
    this.input.addEventListener('input', () => {
      this.toggleClearBtn();
      this.debounce(() => this.fetchResults(this.input.value.trim()), 300);
    });

    // Keyboard navigation
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));

    // Clear button
    this.clearBtn?.addEventListener('click', () => {
      this.input.value = '';
      this.input.focus();
      this.closeResults();
      this.toggleClearBtn();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) this.closeResults();
    });

    // Escape closes
    this.input.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') this.closeResults();
    });

    // Show recent searches on focus if empty
    this.input.addEventListener('focus', () => {
      if (!this.input.value.trim()) this.showRecentSearches();
    });

    // Update ARIA
    this.setAttribute('aria-expanded', 'false');
  }

  debounce(fn, delay) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(fn, delay);
  }

  toggleClearBtn() {
    const hasValue = this.input.value.trim().length > 0;
    this.clearBtn?.classList.toggle('hidden', !hasValue);
  }

  async fetchResults(query) {
    if (query.length < 2) {
      this.closeResults();
      return;
    }

    // Return cached results if available
    if (this.cachedResults[query]) {
      this.renderResults(this.cachedResults[query], query);
      return;
    }

    this.setLoading(true);

    try {
      const url = `${window.Shopify.routes.root}search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${this.limit}&resources[options][fields]=title,product_type,variants.title,vendor`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error('Search request failed');
      const json = await res.json();

      this.cachedResults[query] = json;
      this.renderResults(json, query);

      // Save to recent searches
      this.saveRecentSearch(query);

    } catch (err) {
      this.renderError();
      console.error('Predictive search error:', err);
    } finally {
      this.setLoading(false);
    }
  }

  renderResults(data, query) {
    const products = data?.resources?.results?.products || [];

    if (products.length === 0) {
      this.results.innerHTML = this.renderNoResults(query);
      this.openResults();
      this.announce(`No results for ${query}`);
      return;
    }

    const html = `
      <div class="search-bar__results-inner">
        <p class="search-bar__results-heading caption-with-letter-spacing">
          Products
        </p>
        <ul class="search-bar__results-list" role="listbox" aria-label="Search results">
          ${products.map((product, i) => this.renderProduct(product, i)).join('')}
        </ul>
        <a
          href="${window.Shopify.routes.root}search?q=${encodeURIComponent(query)}&type=product"
          class="search-bar__view-all button button--tertiary"
        >
          View all results for "${query}"
        </a>
      </div>
    `;

    this.results.innerHTML = html;
    this.openResults();
    this.announce(`${products.length} results for ${query}`);
    this.activeIndex = -1;
  }

  renderProduct(product, index) {
    const price = product.price ? `${window.Shopify.currency.active} ${(product.price / 100).toFixed(2)}` : '';
    const image = product.featured_image?.url
      ? `<img src="${product.featured_image.url}&width=80" alt="${product.title}" loading="lazy" width="40" height="40">`
      : `<div class="search-bar__result-placeholder"></div>`;

    return `
      <li
        class="search-bar__result-item"
        role="option"
        id="SearchResult-${index}"
        aria-selected="false"
      >
        <a href="${product.url}" class="search-bar__result-link">
          <div class="search-bar__result-image media media--square">
            ${image}
          </div>
          <div class="search-bar__result-info">
            <span class="search-bar__result-title">${product.title}</span>
            ${product.vendor ? `<span class="search-bar__result-vendor caption">${product.vendor}</span>` : ''}
            <span class="search-bar__result-price">${price}</span>
          </div>
        </a>
      </li>
    `;
  }

  renderNoResults(query) {
    return `
      <div class="search-bar__no-results">
        <p>No results for "<strong>${query}</strong>"</p>
        <p class="caption">Try a different search term or check for typos.</p>
      </div>
    `;
  }

  renderError() {
    this.results.innerHTML = `
      <div class="search-bar__no-results">
        <p>Something went wrong. Please try again.</p>
      </div>
    `;
    this.openResults();
  }

  handleKeydown(e) {
    const items = this.results.querySelectorAll('.search-bar__result-item');
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
        this.setActiveItem(items);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        this.setActiveItem(items);
        break;
      case 'Enter':
        if (this.activeIndex >= 0) {
          e.preventDefault();
          items[this.activeIndex]?.querySelector('a')?.click();
        }
        break;
      case 'Escape':
        this.closeResults();
        this.input.focus();
        break;
    }
  }

  setActiveItem(items) {
    items.forEach((item, i) => {
      const active = i === this.activeIndex;
      item.setAttribute('aria-selected', active);
      item.classList.toggle('is-active', active);
      if (active) {
        this.input.setAttribute('aria-activedescendant', item.id);
        item.scrollIntoView({ block: 'nearest' });
      }
    });

    if (this.activeIndex === -1) {
      this.input.removeAttribute('aria-activedescendant');
    }
  }

  openResults() {
    this.isOpen = true;
    this.results.classList.add('is-visible');
    this.setAttribute('aria-expanded', 'true');
  }

  closeResults() {
    this.isOpen = false;
    this.results.classList.remove('is-visible');
    this.setAttribute('aria-expanded', 'false');
    this.activeIndex = -1;
  }

  setLoading(loading) {
    this.spinner?.classList.toggle('hidden', !loading);
    this.input.setAttribute('aria-busy', loading);
  }

  announce(message) {
    if (!this.announcer) return;
    this.announcer.textContent = '';
    requestAnimationFrame(() => { this.announcer.textContent = message; });
  }

  /* Recent Searches (localStorage) */
  saveRecentSearch(query) {
    try {
      const recent = JSON.parse(localStorage.getItem('sf_recent_searches') || '[]');
      const updated = [query, ...recent.filter(q => q !== query)].slice(0, 5);
      localStorage.setItem('sf_recent_searches', JSON.stringify(updated));
    } catch {}
  }

  showRecentSearches() {
    try {
      const recent = JSON.parse(localStorage.getItem('sf_recent_searches') || '[]');
      if (!recent.length) return;

      this.results.innerHTML = `
        <div class="search-bar__results-inner">
          <p class="search-bar__results-heading caption-with-letter-spacing">Recent searches</p>
          <ul class="search-bar__recent-list" role="list">
            ${recent.map(q => `
              <li class="search-bar__recent-item">
                <a href="${window.Shopify.routes.root}search?q=${encodeURIComponent(q)}&type=product" class="search-bar__recent-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  ${q}
                </a>
                <button class="search-bar__recent-remove link" type="button" data-query="${q}" aria-label="Remove ${q} from recent searches">✕</button>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

      this.openResults();

      // Remove individual recent search
      this.results.querySelectorAll('.search-bar__recent-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const query = btn.dataset.query;
          try {
            const recent = JSON.parse(localStorage.getItem('sf_recent_searches') || '[]');
            localStorage.setItem('sf_recent_searches', JSON.stringify(recent.filter(q => q !== query)));
          } catch {}
          btn.closest('.search-bar__recent-item')?.remove();
          if (!this.results.querySelectorAll('.search-bar__recent-item').length) {
            this.closeResults();
          }
        });
      });
    } catch {}
  }
}

customElements.define('predictive-search', PredictiveSearch);


/* ─────────────────────────────────────────────
   2. FacetFilters Web Component
───────────────────────────────────────────── */
class FacetFilters extends HTMLElement {
  constructor() {
    super();
    this.form          = this.querySelector('#FacetFiltersForm');
    this.sortSelect    = document.querySelector('#SortBy');
    this.productGrid   = document.querySelector('#SearchFilterGrid');
    this.productCount  = document.querySelector('#SearchFilterCount');
    this.activeTagsCon = document.querySelector('#ActiveFilterTags');
    this.pagination    = document.querySelector('#SearchFilterPagination');
    this.debounceTimer = null;
    this.currentUrl    = new URL(window.location.href);

    this.init();
  }

  init() {
    if (!this.form) return;

    // Checkbox filters
    this.form.querySelectorAll('.facets__checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.onFilterChange());
    });

    // Sort select
    this.sortSelect?.addEventListener('change', () => {
      this.currentUrl.searchParams.set('sort_by', this.sortSelect.value);
      this.fetchFilteredProducts(this.currentUrl.toString());
    });

    // Active tag removes
    document.addEventListener('click', (e) => {
      const tag = e.target.closest('[data-filter-url]');
      if (!tag) return;
      e.preventDefault();
      this.fetchFilteredProducts(tag.dataset.filterUrl);
    });

    // Pagination links (AJAX)
    document.addEventListener('click', (e) => {
      const paginationLink = e.target.closest('.search-filter__pagination a');
      if (!paginationLink) return;
      e.preventDefault();
      this.fetchFilteredProducts(paginationLink.href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state?.searchFilterUrl) {
        this.fetchFilteredProducts(e.state.searchFilterUrl, false);
      }
    });
  }

  onFilterChange() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const formData = new FormData(this.form);
      const params   = new URLSearchParams(formData);

      // Keep sort_by if set
      const sortBy = this.currentUrl.searchParams.get('sort_by');
      if (sortBy) params.set('sort_by', sortBy);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      this.fetchFilteredProducts(newUrl);
    }, 200);
  }

  async fetchFilteredProducts(url, pushState = true) {
    this.setLoading(true);

    try {
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}sections=search-filter`;
      const res      = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Filter request failed');

      const data    = await res.json();
      const parser  = new DOMParser();
      const doc     = parser.parseFromString(data['search-filter'] || '', 'text/html');

      // Update product grid
      const newGrid = doc.querySelector('#SearchFilterGrid');
      if (newGrid && this.productGrid) {
        this.productGrid.innerHTML = newGrid.innerHTML;
      }

      // Update product count
      const newCount = doc.querySelector('#SearchFilterCount');
      if (newCount && this.productCount) {
        this.productCount.textContent = newCount.textContent;
      }

      // Update active filter tags
      const newTags = doc.querySelector('#ActiveFilterTags');
      if (newTags && this.activeTagsCon) {
        this.activeTagsCon.innerHTML = newTags.innerHTML;
      }

      // Update facets
      const newFacets = doc.querySelector('#FacetFiltersForm');
      const curFacets = document.querySelector('#FacetFiltersForm');
      if (newFacets && curFacets) {
        curFacets.innerHTML = newFacets.innerHTML;
        this.rebindFacets();
      }

      // Update URL
      if (pushState) {
        history.pushState({ searchFilterUrl: url }, '', url);
      }

      // Announce to screen readers
      const countText = this.productCount?.textContent;
      if (countText) {
        document.querySelector('#a11y-refresh-page-message')?.setAttribute('aria-label', countText);
      }

      // Update mobile drawer count
      const drawerEl = document.querySelector('filter-drawer');
      drawerEl?.updateCount();

    } catch (err) {
      console.error('Filter fetch error:', err);
    } finally {
      this.setLoading(false);
    }
  }

  rebindFacets() {
    // Re-attach checkbox listeners after DOM update
    this.form?.querySelectorAll('.facets__checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.onFilterChange());
    });

    // Re-init price range if present
    document.querySelectorAll('.facets__price-range').forEach(el => {
      new PriceRange(el);
    });

    // Re-init show more buttons
    initShowMore();
  }

  setLoading(loading) {
    if (!this.productGrid) return;
    this.productGrid.setAttribute('aria-busy', loading);
    this.productGrid.classList.toggle('is-loading', loading);
  }
}

customElements.define('facet-filters', FacetFilters);


/* ─────────────────────────────────────────────
   3. FilterDrawer Web Component
───────────────────────────────────────────── */
class FilterDrawer extends HTMLElement {
  constructor() {
    super();
    this.drawer  = document.querySelector('#FilterDrawer');
    this.panel   = document.querySelector('#FilterDrawerPanel');
    this.overlay = document.querySelector('#FilterDrawerOverlay');
    this.toggle  = document.querySelector('#FilterDrawerToggle');
    this.close   = this.querySelector('.filter-drawer__close');
    this.applyBtn = this.querySelector('.filter-drawer__apply');
    this.clearBtn = this.querySelector('.filter-drawer__clear');
    this.isOpen  = false;

    this.init();
  }

  init() {
    this.toggle?.addEventListener('click', () => this.open());
    this.close?.addEventListener('click', () => this.close_());
    this.overlay?.addEventListener('click', () => this.close_());
    this.applyBtn?.addEventListener('click', () => this.close_());
    this.clearBtn?.addEventListener('click', () => {
      const url = this.clearBtn.dataset.filterUrl;
      if (url) {
        document.querySelector('facet-filters')?.fetchFilteredProducts(url);
        this.close_();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close_();
    });
  }

  open() {
    this.isOpen = true;
    this.drawer?.setAttribute('aria-hidden', 'false');
    this.panel?.classList.add('is-open');
    this.overlay?.classList.add('is-visible');
    document.body.classList.add('filter-drawer-open');
    this.toggle?.setAttribute('aria-expanded', 'true');
    this.panel?.focus();
  }

  close_() {
    this.isOpen = false;
    this.drawer?.setAttribute('aria-hidden', 'true');
    this.panel?.classList.remove('is-open');
    this.overlay?.classList.remove('is-visible');
    document.body.classList.remove('filter-drawer-open');
    this.toggle?.setAttribute('aria-expanded', 'false');
    this.toggle?.focus();
  }

  updateCount() {
    const countEl = document.querySelector('#FilterDrawerCount');
    const badges  = document.querySelectorAll('.search-filter__tag');
    if (countEl) {
      countEl.textContent = badges.length > 0 ? `(${badges.length})` : '';
    }
  }
}

customElements.define('filter-drawer', FilterDrawer);


/* ─────────────────────────────────────────────
   4. PriceRange — dual handle slider
───────────────────────────────────────────── */
class PriceRange {
  constructor(container) {
    this.container = container;
    this.minThumb  = container.querySelector('.facets__price-thumb--min');
    this.maxThumb  = container.querySelector('.facets__price-thumb--max');
    this.fill      = container.querySelector('.facets__price-fill');
    this.minInput  = container.querySelector('#PriceMinInput-' + container.closest('[data-section-id]')?.dataset.sectionId);
    this.maxInput  = container.querySelector('#PriceMaxInput-' + container.closest('[data-section-id]')?.dataset.sectionId);
    this.rangeMin  = parseFloat(container.dataset.min) / 100;
    this.rangeMax  = parseFloat(container.dataset.max) / 100;
    this.debounceTimer = null;

    this.init();
  }

  init() {
    if (!this.minThumb || !this.maxThumb) return;
    this.updateFill();

    this.minThumb.addEventListener('input', () => {
      const min = parseFloat(this.minThumb.value);
      const max = parseFloat(this.maxThumb.value);
      if (min >= max) this.minThumb.value = max - 1;
      if (this.minInput) this.minInput.value = Math.ceil(parseFloat(this.minThumb.value));
      this.updateFill();
      this.debounceFilter();
    });

    this.maxThumb.addEventListener('input', () => {
      const min = parseFloat(this.minThumb.value);
      const max = parseFloat(this.maxThumb.value);
      if (max <= min) this.maxThumb.value = min + 1;
      if (this.maxInput) this.maxInput.value = Math.ceil(parseFloat(this.maxThumb.value));
      this.updateFill();
      this.debounceFilter();
    });

    // Number inputs → update slider
    this.minInput?.addEventListener('change', () => {
      const val = parseFloat(this.minInput.value);
      if (!isNaN(val) && val >= this.rangeMin && val < parseFloat(this.maxThumb.value)) {
        this.minThumb.value = val;
        this.updateFill();
        this.debounceFilter();
      }
    });

    this.maxInput?.addEventListener('change', () => {
      const val = parseFloat(this.maxInput.value);
      if (!isNaN(val) && val <= this.rangeMax && val > parseFloat(this.minThumb.value)) {
        this.maxThumb.value = val;
        this.updateFill();
        this.debounceFilter();
      }
    });
  }

  updateFill() {
    if (!this.fill || !this.minThumb || !this.maxThumb) return;
    const range = this.rangeMax - this.rangeMin;
    const min   = (parseFloat(this.minThumb.value) - this.rangeMin) / range * 100;
    const max   = (parseFloat(this.maxThumb.value) - this.rangeMin) / range * 100;
    this.fill.style.left  = `${min}%`;
    this.fill.style.width = `${max - min}%`;
  }

  debounceFilter() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      document.querySelector('facet-filters')?.onFilterChange();
    }, 500);
  }
}


/* ─────────────────────────────────────────────
   5. Show More / Show Less for facet values
───────────────────────────────────────────── */
function initShowMore() {
  document.querySelectorAll('.facets__show-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const moreList = document.getElementById(btn.getAttribute('aria-controls'));
      const showLess = btn.closest('.facets__item--show-more')?.querySelector('.facets__show-less');
      if (!moreList) return;

      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      moreList.classList.toggle('hidden', isExpanded);
      btn.setAttribute('aria-expanded', !isExpanded);
      btn.classList.toggle('hidden', !isExpanded);
      showLess?.classList.toggle('hidden', isExpanded);
    });
  });

  document.querySelectorAll('.facets__show-less').forEach(btn => {
    btn.addEventListener('click', () => {
      const showMore = btn.closest('.facets__item--show-more')?.querySelector('.facets__show-more');
      const moreList = document.getElementById(showMore?.getAttribute('aria-controls'));
      if (!moreList) return;

      moreList.classList.add('hidden');
      showMore?.setAttribute('aria-expanded', 'false');
      showMore?.classList.remove('hidden');
      btn.classList.add('hidden');
    });
  });
}


/* ─────────────────────────────────────────────
   6. Init on DOMContentLoaded
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Init price range sliders
  document.querySelectorAll('.facets__price-range').forEach(el => new PriceRange(el));

  // Init show more
  initShowMore();

  // Wrap facets form in Web Component if not already
  const facetForm = document.querySelector('#FacetFiltersForm');
  if (facetForm && !document.querySelector('facet-filters')) {
    const wrapper = document.createElement('facet-filters');
    facetForm.parentNode.insertBefore(wrapper, facetForm);
    wrapper.appendChild(facetForm);
  }

  // Wrap filter drawer in Web Component if not already
  const filterDrawer = document.querySelector('#FilterDrawer');
  if (filterDrawer && !document.querySelector('filter-drawer')) {
    const wrapper = document.createElement('filter-drawer');
    filterDrawer.parentNode.insertBefore(wrapper, filterDrawer);
    wrapper.appendChild(filterDrawer);
  }
});

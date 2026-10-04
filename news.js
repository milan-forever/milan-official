// ── DOM references ──────────────────────────────────────────────────────────

const newsList        = document.querySelector('.news-list');
const articleView     = document.querySelector('[data-view="article"]');
const articleTitleEl  = document.getElementById('article-title');
const articleDateEl   = articleView?.querySelector('.article-date-tag');
const articleImageEl  = articleView?.querySelector('.article-image');
const articleBodyEl   = articleView?.querySelector('.article-body');
const articleShareBtn = articleView?.querySelector('.article-share-btn');

// ── State ────────────────────────────────────────────────────────────────────

let newsData = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function copyToClipboard(text, btn) {
  const finish = () => {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 1800);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(finish).catch(() => fallbackCopy(text, finish));
  } else {
    fallbackCopy(text, finish);
  }
}

function fallbackCopy(text, callback) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  ta.remove();
  callback?.();
}

// ── News list ─────────────────────────────────────────────────────────────────

function createNewsCard(post) {
  const article = document.createElement('article');
  article.className = 'news-card';

  if (post.image) {
    const img = document.createElement('img');
    img.className = 'news-card-image';
    img.src = post.image;
    img.alt = post.title;
    img.loading = 'lazy';
    article.append(img);
  }

  const body = document.createElement('div');
  body.className = 'news-card-body';

  const time = document.createElement('time');
  time.className = 'news-card-date';
  time.dateTime = post.date;
  time.textContent = formatDate(post.date);

  // Title is an <a> that also stretches over the whole card via ::after
  const title = document.createElement('h2');
  title.className = 'news-card-title';

  const titleLink = document.createElement('a');
  titleLink.href = `#/news/${post.id}`;
  titleLink.textContent = post.title;
  title.append(titleLink);

  const paragraphs = post.body.split('\n\n').map((text) => {
    const p = document.createElement('p');
    p.className = 'news-card-text';
    p.textContent = text;
    return p;
  });

  body.append(time, title, ...paragraphs);

  // ── Share button footer ──
  const footer = document.createElement('div');
  footer.className = 'news-card-footer';

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'news-share-btn';
  shareBtn.setAttribute('aria-label', 'Copy link to this post');
  shareBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
    <span class="share-label">Share</span>
    <span class="share-tooltip" aria-live="polite">Copied!</span>
  `;

  shareBtn.addEventListener('click', () => {
    const url = `${location.origin}${location.pathname}#/news/${post.id}`;
    copyToClipboard(url, shareBtn);
  });

  footer.append(shareBtn);
  article.append(body, footer);
  return article;
}

function renderNews(news) {
  if (!newsList) return;
  if (news.length === 0) {
    newsList.innerHTML = '<div class="simple-card"><p>Новостей пока нет. Заходите позже.</p></div>';
    return;
  }
  // Newest first
  newsList.replaceChildren(...news.slice().reverse().map(createNewsCard));
}

// ── Article page ──────────────────────────────────────────────────────────────

function renderArticlePage(id) {
  if (!articleView) return;

  const post = newsData.find((p) => p.id === id);

  if (!post) {
    if (articleTitleEl) articleTitleEl.textContent = 'Пост не найден';
    if (articleDateEl)  articleDateEl.textContent  = '';
    if (articleImageEl) articleImageEl.hidden       = true;
    if (articleBodyEl)  articleBodyEl.innerHTML     = '<p class="article-paragraph">Этот пост не найден.</p>';
    document.title = 'News | Milan official';
    return;
  }

  if (articleTitleEl) articleTitleEl.textContent = post.title;
  if (articleDateEl)  articleDateEl.textContent  = formatDate(post.date);

  if (articleImageEl) {
    if (post.image) {
      articleImageEl.src    = post.image;
      articleImageEl.alt    = post.title;
      articleImageEl.hidden = false;
    } else {
      articleImageEl.hidden = true;
    }
  }

  if (articleBodyEl) {
    articleBodyEl.replaceChildren(
      ...post.body.split('\n\n').map((text) => {
        const p = document.createElement('p');
        p.className = 'article-paragraph';
        p.textContent = text;
        return p;
      })
    );
  }

  // Wire up the share button in the article view
  if (articleShareBtn) {
    // Remove any previous listener by cloning
    const freshBtn = articleShareBtn.cloneNode(true);
    articleShareBtn.replaceWith(freshBtn);
    freshBtn.addEventListener('click', () => {
      const url = `${location.origin}${location.pathname}#/news/${post.id}`;
      copyToClipboard(url, freshBtn);
    });
  }

  document.title = `${post.title} | Milan official`;
  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Routing ───────────────────────────────────────────────────────────────────

function handleRouting() {
  const hash = window.location.hash.slice(2); // strip '#/'
  if (hash.startsWith('news/')) {
    const id = hash.slice(5); // strip 'news/'
    renderArticlePage(id);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

fetch('./news.json')
  .then((r) => r.json())
  .then((news) => {
    newsData = news;
    renderNews(news);
    // If we landed directly on an article URL, render it now that data is ready
    handleRouting();
  })
  .catch((err) => {
    console.error('Failed to load news:', err);
    if (newsList) newsList.innerHTML = '<div class="simple-card"><p>Не удалось загрузить новости.</p></div>';
  });

// Re-render article on every hash change (data is already loaded by this point)
window.addEventListener('hashchange', handleRouting);

// ── Rendering ──────────────────────────────────────────────────────────────

const newsList = document.querySelector('.news-list');

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function createNewsCard(post) {
  const article = document.createElement('article');
  article.className = 'news-card';
  article.id = `news-${post.id}`;

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

  const title = document.createElement('h2');
  title.className = 'news-card-title';
  title.textContent = post.title;

  const paragraphs = post.body.split('\n\n').map((text) => {
    const p = document.createElement('p');
    p.className = 'news-card-text';
    p.textContent = text;
    return p;
  });

  body.append(time, title, ...paragraphs);
  article.append(body);
  return article;
}

function renderNews(news) {
  if (!newsList) return;

  if (news.length === 0) {
    newsList.innerHTML = '<div class="simple-card"><p>Новостей пока нет. Заходите позже.</p></div>';
    return;
  }

  // Display newest first
  newsList.replaceChildren(...news.slice().reverse().map(createNewsCard));
}

fetch('./news.json')
  .then((r) => r.json())
  .then(renderNews)
  .catch((err) => {
    console.error('Failed to load news:', err);
    if (newsList) newsList.innerHTML = '<div class="simple-card"><p>Не удалось загрузить новости.</p></div>';
  });

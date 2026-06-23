import { articles, articleMap, sections, articlesBySection, allTags, t } from './data';
import type { Article, Lang, SectionKey, Section } from './data';

type PageRenderer = () => HTMLElement;

// --- Language state ---
let currentLang: Lang = 'zh';

function setLang(lang: Lang): void {
  currentLang = lang;
  try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  navigate();
}

function el(tag: 'a', className?: string, text?: string): HTMLAnchorElement;
function el(tag: 'img', className?: string, text?: string): HTMLImageElement;
function el(tag: string, className?: string, text?: string): HTMLElement;
function el(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function createLangToggle(): HTMLElement {
  const toggle = el('div', 'lang-toggle');
  const zh = el('a', currentLang === 'zh' ? 'lang-active' : undefined, '中');
  zh.href = 'javascript:void(0)';
  zh.addEventListener('click', (e: Event) => {
    e.preventDefault();
    if (currentLang !== 'zh') setLang('zh');
  });
  const sep = el('span', 'lang-sep', '/');
  const en = el('a', currentLang === 'en' ? 'lang-active' : undefined, 'EN');
  en.href = 'javascript:void(0)';
  en.addEventListener('click', (e: Event) => {
    e.preventDefault();
    if (currentLang !== 'en') setLang('en');
  });
  toggle.appendChild(zh);
  toggle.appendChild(sep);
  toggle.appendChild(en);
  return toggle;
}

function createNav(active?: string): HTMLElement {
  const nav = el('nav', 'site-nav');
  const name = el('a', 'site-name', t('siteName', currentLang));
  name.href = '#/';
  const links = el('div', 'nav-links');
  const navItems = [
    { key: 'navWriting' as const, route: '#/writing' },
  ];
  for (const item of navItems) {
    const a = el('a', active === item.route ? 'active' : undefined, t(item.key, currentLang));
    a.href = item.route;
    links.appendChild(a);
  }
  nav.appendChild(name);
  nav.appendChild(links);
  nav.appendChild(createLangToggle());
  return nav;
}

function createFooter(): HTMLElement {
  const footer = el('footer', 'site-footer');
  footer.innerHTML = `&copy; 2025 &middot; ${t('footerText', currentLang)}`;
  return footer;
}

function articleTitle(a: Article): string {
  return currentLang === 'en' ? (a.en?.title ?? a.title) : a.title;
}

function articleContent(a: Article): string {
  if (currentLang === 'en' && a.en?.content) return a.en.content;
  return a.content ?? '';
}

function articleDate(a: Article): string {
  if (currentLang === 'en') {
    const d = new Date(a.date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return a.date;
}

function createArticleItem(article: Article): HTMLElement {
  const item = el('a', 'article-item');
  item.href = `#/article/${article.id}`;
  const title = el('span', 'article-title', articleTitle(article));
  const date = el('span', 'article-date', articleDate(article));
  item.appendChild(title);
  item.appendChild(date);
  return item;
}

function createArticleList(items: Article[]): HTMLElement {
  const list = el('div', 'article-list');
  if (items.length === 0) {
    const empty = el('div', 'article-empty', t('articleEmpty', currentLang));
    list.appendChild(empty);
    return list;
  }
  for (const a of items) {
    list.appendChild(createArticleItem(a));
  }
  return list;
}

function createBackLink(label: string, route: string): HTMLElement {
  const back = el('a', 'page-back');
  back.href = route;
  back.innerHTML = `<span class="page-back-arrow">\u2190</span> ${label}`;
  return back;
}

function sectionName(s: Section): string {
  return currentLang === 'en' ? s.en.name : s.name;
}
function sectionSubtitle(s: Section): string {
  return currentLang === 'en' ? s.en.subtitle : s.subtitle;
}
function sectionDesc(s: Section): string {
  return currentLang === 'en' ? s.en.desc : s.desc;
}

// --- Homepage: theme blocks ---

function createThemeBlock(sectionKey: SectionKey): HTMLElement {
  const section = sections[sectionKey];
  const sectionArticles = articlesBySection(sectionKey);

  const block = el('div', 'theme-block');

  // Title row: deep green title + short dash
  const titleRow = el('div', 'theme-title-row');
  const title = el('a', 'theme-title', sectionName(section));
  title.href = `#/section/${sectionKey}`;
  titleRow.appendChild(title);
  const dash = el('span', 'theme-dash');
  titleRow.appendChild(dash);
  block.appendChild(titleRow);

  // Subtitle
  block.appendChild(el('p', 'theme-subtitle', sectionSubtitle(section)));

  // Description
  const desc = el('p', 'theme-desc', sectionDesc(section));
  block.appendChild(desc);

  // Recent 3 articles in this section
  if (sectionArticles.length > 0) {
    content_createArticleList(block, sectionArticles.slice(0, 3));
    if (sectionArticles.length > 3) {
      const more = el('a', 'theme-more', `${t('viewAllN', currentLang)}${sectionArticles.length}${t('articles', currentLang)}`);
      more.href = `#/section/${sectionKey}`;
      block.appendChild(more);
    }
  } else {
    block.appendChild(el('div', 'article-empty', t('articleEmpty', currentLang)));
  }

  return block;
}

// Helper: append article items directly into a container
function content_createArticleList(container: HTMLElement, items: Article[]): void {
  const list = el('div', 'article-list');
  for (const a of items) {
    list.appendChild(createArticleItem(a));
  }
  container.appendChild(list);
}

function renderHome(): HTMLElement {
  const main = el('div');
  main.appendChild(createNav());

  const content = el('main', 'site-main page-enter');

  // Hero
  const hero = el('div', 'hero');
  const avatar = el('img', 'hero-avatar');
  avatar.src = '/avatar.jpg';
  avatar.alt = t('siteName', currentLang);
  hero.appendChild(avatar);
  const tagline = el('h1', 'hero-tagline', t('siteName', currentLang));
  const sub = el('p', 'hero-sub', t('siteSub', currentLang));
  hero.appendChild(tagline);
  hero.appendChild(sub);
  content.appendChild(hero);

  // Theme blocks
  const sectionKeys: SectionKey[] = ['arch-ai', 'reading', 'road', 'invest'];
  for (const key of sectionKeys) {
    content.appendChild(el('hr', 'divider'));
    content.appendChild(createThemeBlock(key));
  }

  main.appendChild(content);
  main.appendChild(createFooter());
  return main;
}

// --- Section detail ---

function renderSection(sectionKey: string): HTMLElement {
  const section = sections[sectionKey as SectionKey];
  const main = el('div');
  main.appendChild(createNav());

  const content = el('main', 'site-main page-enter');
  content.appendChild(createBackLink(t('backHome', currentLang), '#/'));

  if (!section) {
    content.appendChild(el('h1', 'page-title', t('articleNotFound', currentLang)));
    main.appendChild(content);
    main.appendChild(createFooter());
    return main;
  }

  const sectionArticles = articlesBySection(sectionKey as SectionKey);
  const h1 = el('h1', 'page-title', sectionName(section));
  const desc = el('p', 'page-desc', sectionDesc(section));
  content.appendChild(h1);
  content.appendChild(desc);
  content.appendChild(el('hr', 'divider'));
  content.appendChild(createArticleList(sectionArticles));

  main.appendChild(content);
  main.appendChild(createFooter());
  return main;
}

// --- Writing (all articles) ---

function renderWriting(): HTMLElement {
  const main = el('div');
  main.appendChild(createNav('#/writing'));

  const content = el('main', 'site-main page-enter');
  content.appendChild(createBackLink(t('backHome', currentLang), '#/'));
  const h1 = el('h1', 'page-title', t('writingTitle', currentLang));
  const desc = el('p', 'page-desc', t('writingDesc', currentLang));
  content.appendChild(h1);
  content.appendChild(desc);
  content.appendChild(el('hr', 'divider'));

  // Tags filter
  if (allTags.length > 0) {
    const tagBar = el('div', 'tag-bar');
    const allTag = el('a', 'tag-chip tag-chip-active', t('tagAll', currentLang));
    allTag.href = '#/writing';
    tagBar.appendChild(allTag);
    for (const tag of allTags) {
      const tagEl = el('a', 'tag-chip', tag);
      tagEl.href = `#/writing/tag/${encodeURIComponent(tag)}`;
      tagBar.appendChild(tagEl);
    }
    content.appendChild(tagBar);
    content.appendChild(el('hr', 'divider'));
  }

  content.appendChild(createArticleList(articles));

  main.appendChild(content);
  main.appendChild(createFooter());
  return main;
}

// --- Writing by tag ---

function renderWritingByTag(tag: string): HTMLElement {
  const main = el('div');
  main.appendChild(createNav('#/writing'));

  const content = el('main', 'site-main page-enter');
  content.appendChild(createBackLink(t('navWriting', currentLang), '#/writing'));
  const h1 = el('h1', 'page-title', `#${tag}`);
  const desc = el('p', 'page-desc', `${t('tagDesc', currentLang)}「${tag}」`);
  content.appendChild(h1);
  content.appendChild(desc);
  content.appendChild(el('hr', 'divider'));

  const tagBar = el('div', 'tag-bar');
  const allTag = el('a', 'tag-chip', t('tagAll', currentLang));
  allTag.href = '#/writing';
  tagBar.appendChild(allTag);
  for (const tagEl2 of allTags) {
    const isActive = tagEl2 === tag;
    const tagEl = el('a', isActive ? 'tag-chip tag-chip-active' : 'tag-chip', tagEl2);
    tagEl.href = `#/writing/tag/${encodeURIComponent(tagEl2)}`;
    tagBar.appendChild(tagEl);
  }
  content.appendChild(tagBar);
  content.appendChild(el('hr', 'divider'));

  const filtered = articles.filter((a) => a.tags?.includes(tag));
  content.appendChild(createArticleList(filtered));

  main.appendChild(content);
  main.appendChild(createFooter());
  return main;
}

// --- Article detail ---

function renderArticle(articleId: string): HTMLElement {
  const article = articleMap.get(articleId);
  const main = el('div');

  let backLabel = t('backHome', currentLang);
  let backRoute = '#/';
  if (article?.section) {
    const section = sections[article.section];
    if (section) {
      backLabel = sectionName(section);
      backRoute = `#/section/${article.section}`;
    }
  }

  main.appendChild(createNav());

  const content = el('main', 'site-main page-enter');
  content.appendChild(createBackLink(backLabel, backRoute));

  if (!article) {
    content.appendChild(el('h1', 'page-title', t('articleNotFound', currentLang)));
    content.appendChild(el('p', 'page-desc', t('articleNotFoundDesc', currentLang)));
    main.appendChild(content);
    main.appendChild(createFooter());
    return main;
  }

  const header = el('div', 'article-detail-header');
  const date = el('div', 'article-detail-date', articleDate(article));
  const h1 = el('h1', 'article-detail-title', articleTitle(article));
  header.appendChild(date);
  header.appendChild(h1);

  if (article.tags && article.tags.length > 0) {
    const tagRow = el('div', 'tag-row');
    for (const tag of article.tags) {
      const tagEl = el('a', 'tag-chip-sm', `#${tag}`);
      tagEl.href = `#/writing/tag/${encodeURIComponent(tag)}`;
      tagRow.appendChild(tagEl);
    }
    header.appendChild(tagRow);
  }

  content.appendChild(header);
  content.appendChild(el('hr', 'divider'));

  const bodyContent = articleContent(article);
  if (bodyContent) {
    const body = el('div', 'article-body');
    const paragraphs = bodyContent.split('\n\n');
    for (const p of paragraphs) {
      const para = el('p', 'article-paragraph', p.trim());
      body.appendChild(para);
    }
    content.appendChild(body);
  } else {
    content.appendChild(el('div', 'article-empty', t('articleBodyEmpty', currentLang)));
  }

  main.appendChild(content);
  main.appendChild(createFooter());
  return main;
}

// --- Router ---

const routes: Record<string, PageRenderer> = {
  '/': renderHome,
  '/writing': renderWriting,
};

function getRoute(): string {
  return window.location.hash.replace('#', '') || '/';
}

function navigate(): void {
  const route = getRoute();
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '';

  // Article detail: /article/:id
  const articleMatch = route.match(/^\/article\/(.+)$/);
  if (articleMatch) {
    app.appendChild(renderArticle(decodeURIComponent(articleMatch[1])));
    window.scrollTo(0, 0);
    return;
  }

  // Section detail: /section/:key
  const sectionMatch = route.match(/^\/section\/(.+)$/);
  if (sectionMatch) {
    app.appendChild(renderSection(decodeURIComponent(sectionMatch[1])));
    window.scrollTo(0, 0);
    return;
  }

  // Writing by tag: /writing/tag/:tag
  const tagMatch = route.match(/^\/writing\/tag\/(.+)$/);
  if (tagMatch) {
    app.appendChild(renderWritingByTag(decodeURIComponent(tagMatch[1])));
    window.scrollTo(0, 0);
    return;
  }

  const renderer = routes[route] || renderHome;
  app.appendChild(renderer());
  window.scrollTo(0, 0);
}

export function initApp(): void {
  // Restore language preference
  try {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'zh' || saved === 'en') currentLang = saved;
  } catch { /* ignore */ }
  navigate();
  window.addEventListener('hashchange', navigate);
}

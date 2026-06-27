(function () {
  'use strict';

  const S = window.AsteroidStore;
  const DISCORD_INVITE = 'https://discord.gg/ju5YCandvB';
  const TYPE_LABEL = {
    notice: '공지사항',
    update: '업데이트',
    event: '이벤트'
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function readQuery() {
    return new URLSearchParams(window.location.search);
  }

  function getDiscordUrl() {
    return S.getData().settings.discordInviteUrl || DISCORD_INVITE;
  }

  function postUrl(post) {
    const map = { notice: 'notice.html', update: 'updates.html', event: 'events.html' };
    return `${map[post.type] || 'notice.html'}?id=${encodeURIComponent(post.id)}`;
  }

  function badge(text) {
    if (!text) return '';
    return `<span class="badge">${S.escapeHtml(text)}</span>`;
  }

  function tagList(tags) {
    if (!tags || !tags.length) return '';
    return `<div class="tag-row">${tags.map(tag => `<span>${S.escapeHtml(tag)}</span>`).join('')}</div>`;
  }

  function emptyState(title, text) {
    return `
      <section class="empty-state">
        <div class="planet-icon">소</div>
        <h3>${S.escapeHtml(title)}</h3>
        <p>${S.escapeHtml(text)}</p>
      </section>
    `;
  }

  function navItem(href, label, active) {
    return `<a class="${active ? 'active' : ''}" href="${href}">${label}</a>`;
  }

  function renderShell() {
    const data = S.getData();
    const settings = data.settings;
    const page = document.body.dataset.page || 'home';
    const header = $('#site-header');
    const footer = $('#site-footer');
    const discordUrl = S.escapeHtml(getDiscordUrl());

    if (header) {
      header.innerHTML = `
        <a class="brand" href="index.html" aria-label="메인으로 이동">
          <span class="brand-mark"><img src="assets/icon-192.png" alt="" aria-hidden="true"></span>
          <span><strong>${S.escapeHtml(settings.siteName)}</strong><small>${S.escapeHtml(settings.tagline)}</small></span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">메뉴</button>
        <nav id="main-nav" class="main-nav" aria-label="주 메뉴">
          ${navItem('notice.html', '공지사항', page === 'notice')}
          ${navItem('updates.html', '업데이트', page === 'updates')}
          ${navItem('about.html', '가이드', page === 'about')}
          ${navItem('shop.html', '상점', page === 'shop')}
        </nav>
        <div class="header-actions">
          <a class="button primary small" href="${discordUrl}" target="_blank" rel="noopener">디스코드</a>
        </div>
      `;

      const toggle = $('.nav-toggle', header);
      const nav = $('#main-nav', header);
      if (toggle && nav) {
        toggle.addEventListener('click', () => {
          const opened = nav.classList.toggle('is-open');
          toggle.setAttribute('aria-expanded', String(opened));
        });
      }
    }

    if (footer) {
      footer.innerHTML = `
        <div>
          <strong>${S.escapeHtml(settings.siteName)}</strong>
          <p>${S.escapeHtml(settings.tagline)}</p>
        </div>
        <div class="footer-links">
          <a href="admin.html">관리자 로그인</a>
        </div>
      `;
    }
  }

  function postCard(post, compact = false) {
    const eventMeta = post.type === 'event' && (post.eventStart || post.eventEnd)
      ? `<span>기간 ${S.escapeHtml(post.eventStart || '?')} ~ ${S.escapeHtml(post.eventEnd || '?')}</span>`
      : '';

    return `
      <article class="post-card ${compact ? 'compact' : ''}">
        <div class="post-topline">
          ${badge(TYPE_LABEL[post.type])}
          ${post.pinned ? badge('고정') : ''}
          <time>${S.formatDate(post.createdAt)}</time>
        </div>
        <h3><a href="${postUrl(post)}">${S.escapeHtml(post.title)}</a></h3>
        <p>${S.escapeHtml(post.summary || post.content.slice(0, 120))}</p>
        <div class="post-meta">${eventMeta}${tagList(post.tags)}</div>
      </article>
    `;
  }

  function heroNewsStrip(posts) {
    const latestPost = posts.slice().sort(S.sortByRecent)[0];
    if (!latestPost) return '';

    return `
      <a class="hero-news-strip" href="${postUrl(latestPost)}" aria-label="최신 글 보기">
        <span>NEW</span>
        ${S.escapeHtml(latestPost.title)}
        <strong>자세히 보기</strong>
      </a>
    `;
  }

  function renderHome() {
    const data = S.getData();
    const root = $('#home-root');
    if (!root) return;

    const posts = S.published(data.posts).sort(S.sortByPinnedRecent);
    const latestByType = type => posts.filter(post => post.type === type).slice(0, 3);
    const discordUrl = S.escapeHtml(getDiscordUrl());

    root.innerHTML = `
      <section class="home-hero">
        <div class="hero-content">
          <div class="hero-kicker">${S.escapeHtml(data.settings.tagline)}</div>
          <h1>${S.escapeHtml(data.settings.heroTitle).replace(/\n/g, '<br>')}</h1>
          <p>${S.escapeHtml(data.settings.heroSubtitle)}</p>
          <div class="button-row hero-buttons single">
            <a class="button primary hero-cta" href="${discordUrl}" target="_blank" rel="noopener">
              <span class="button-icon">S</span>
              소행성 디스코드 참여하기
            </a>
          </div>
        </div>
        ${heroNewsStrip(posts)}
      </section>
      <section class="section-head home-section-head">
        <span class="eyebrow">RECENT SIGNALS</span>
        <h2>최신 소식</h2>
        <p>공지사항, 업데이트, 이벤트가 최근순과 고정순으로 정리됩니다.</p>
      </section>
      <div class="dashboard-grid home-dashboard">
        ${latestPanel('notice', latestByType('notice'))}
        ${latestPanel('update', latestByType('update'))}
        ${latestPanel('event', latestByType('event'))}
      </div>
    `;
  }

  function latestPanel(type, list) {
    const more = type === 'notice' ? 'notice.html' : type === 'update' ? 'updates.html' : 'events.html';
    return `
      <section class="latest-panel">
        <div class="panel-title">
          <h3>${TYPE_LABEL[type]}</h3>
          <a href="${more}">전체보기</a>
        </div>
        ${list.length ? list.map(post => postCard(post, true)).join('') : emptyState('신호 없음', `${TYPE_LABEL[type]} 게시글이 없습니다.`)}
      </section>
    `;
  }

  function renderBoard() {
    const root = $('#board-root');
    if (!root) return;

    const type = document.body.dataset.board || 'notice';
    const query = readQuery();
    const id = query.get('id');
    const data = S.getData();
    const posts = S.published(data.posts).filter(post => post.type === type).sort(S.sortByPinnedRecent);
    const label = TYPE_LABEL[type];
    const heroClass = type === 'update' ? 'update-hero' : type === 'event' ? 'event-hero' : 'notice-hero';

    if (id) {
      const post = posts.find(item => item.id === id);
      root.innerHTML = post ? renderPostDetail(post, label) : emptyState('게시글을 찾을 수 없습니다', '삭제되었거나 비공개로 전환된 게시글입니다.');
      return;
    }

    root.innerHTML = `
      <section class="page-hero art-hero ${heroClass}">
        <span class="eyebrow">${S.escapeHtml(type.toUpperCase())}</span>
        <h1>${label}</h1>
        <p>${label} 게시글은 관리자 화면에서 작성, 수정, 공개/비공개 전환할 수 있습니다.</p>
      </section>
      <section class="toolbar glass-card">
        <input id="board-search" type="search" placeholder="제목, 내용, 태그 검색" aria-label="게시글 검색">
        <span>${posts.length}개 신호 수신</span>
      </section>
      <section id="board-list" class="post-grid"></section>
    `;

    const listRoot = $('#board-list');
    const input = $('#board-search');
    const draw = () => {
      const keyword = input.value.trim().toLowerCase();
      const filtered = posts.filter(post => {
        const haystack = [post.title, post.summary, post.content, (post.tags || []).join(' ')].join(' ').toLowerCase();
        return haystack.includes(keyword);
      });
      listRoot.innerHTML = filtered.length ? filtered.map(post => postCard(post)).join('') : emptyState('검색 결과 없음', '다른 키워드로 검색해 보세요.');
    };
    input.addEventListener('input', draw);
    draw();
  }

  function renderPostDetail(post, label) {
    const eventBox = post.type === 'event' && (post.eventStart || post.eventEnd)
      ? `<div class="notice-box"><strong>이벤트 기간</strong><br>${S.escapeHtml(post.eventStart || '?')} ~ ${S.escapeHtml(post.eventEnd || '?')}</div>`
      : '';

    return `
      <article class="article-view">
        <a class="text-link" href="${post.type === 'notice' ? 'notice.html' : post.type === 'update' ? 'updates.html' : 'events.html'}">목록으로</a>
        <div class="post-topline">${badge(label)}${post.pinned ? badge('고정') : ''}<time>${S.formatDate(post.createdAt)}</time></div>
        <h1>${S.escapeHtml(post.title)}</h1>
        <p class="lead">${S.escapeHtml(post.summary)}</p>
        ${eventBox}
        <div class="article-body">${S.richText(post.content)}</div>
        ${tagList(post.tags)}
      </article>
    `;
  }

  function renderAbout() {
    const root = $('#about-root');
    if (!root) return;

    const data = S.getData();
    const categories = S.published(data.guideCategories).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const guides = S.published(data.guides).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    root.innerHTML = `
      <section class="page-hero art-hero guide-hero">
        <span class="eyebrow">GUIDE</span>
        <h1>가이드</h1>
        <p>${S.escapeHtml(data.settings.guideIntro)}</p>
      </section>
      <section class="guide-route">
        <article>
          <span>01</span>
          <strong>J 키</strong>
          <p>가이드북을 열고 산소 규칙부터 확인합니다.</p>
        </article>
        <article>
          <span>02</span>
          <strong>X 키</strong>
          <p>도감 보상으로 첫 장비 비용을 마련합니다.</p>
        </article>
        <article>
          <span>03</span>
          <strong>데니</strong>
          <p>지맥 안정화 코어와 산소 장비를 준비합니다.</p>
        </article>
        <article>
          <span>04</span>
          <strong>F8</strong>
          <p>성간 이동 전 산소와 귀환 동선을 확인합니다.</p>
        </article>
      </section>
      <section class="guide-layout">
        <aside class="guide-sidebar" id="guide-sidebar"></aside>
        <div class="guide-content" id="guide-content"></div>
      </section>
    `;

    const side = $('#guide-sidebar');
    const content = $('#guide-content');
    if (!categories.length) {
      content.innerHTML = emptyState('가이드가 없습니다', '관리자 화면에서 가이드 카테고리와 문서를 추가하세요.');
      return;
    }

    side.innerHTML = categories.map((cat, index) => `
      <button type="button" class="guide-tab ${index === 0 ? 'active' : ''}" data-cat="${S.escapeHtml(cat.id)}">
        <strong>${S.escapeHtml(cat.title)}</strong>
        <small>${S.escapeHtml(cat.description)}</small>
      </button>
    `).join('');

    const draw = categoryId => {
      $all('.guide-tab', side).forEach(tab => tab.classList.toggle('active', tab.dataset.cat === categoryId));
      const category = categories.find(cat => cat.id === categoryId);
      const docs = guides.filter(guide => guide.categoryId === categoryId);
      content.innerHTML = `
        <div class="section-head left">
          <span class="eyebrow">${S.escapeHtml(category.title)}</span>
          <h2>${S.escapeHtml(category.description || category.title)}</h2>
        </div>
        ${docs.length ? docs.map(guideArticle).join('') : emptyState('문서가 없습니다', '이 카테고리에 공개된 가이드가 없습니다.')}
      `;
    };

    side.addEventListener('click', event => {
      const button = event.target.closest('.guide-tab');
      if (button) draw(button.dataset.cat);
    });
    draw(categories[0].id);
  }

  function guideArticle(guide) {
    const meta = [
      guide.badge,
      guide.location,
      guide.keyHint
    ].filter(Boolean);

    return `
      <article class="guide-article">
        ${meta.length ? `<div class="guide-meta">${meta.map(item => `<span>${S.escapeHtml(item)}</span>`).join('')}</div>` : ''}
        <h3>${S.escapeHtml(guide.title)}</h3>
        <p class="muted">${S.escapeHtml(guide.summary)}</p>
        <div class="article-body">${S.richText(guide.content)}</div>
      </article>
    `;
  }

  function renderShop() {
    const root = $('#shop-root');
    if (!root) return;

    const data = S.getData();
    const products = S.published(data.products).sort((a, b) => Number(b.featured) - Number(a.featured) || S.sortByRecent(a, b));

    root.innerHTML = `
      <section class="page-hero art-hero shop-hero">
        <span class="eyebrow">SHOP</span>
        <h1>상점</h1>
        <p>${S.escapeHtml(data.settings.shopIntro)}</p>
      </section>
      ${products.length ? `
        <section id="shop-list" class="shop-grid">${products.map(productCard).join('')}</section>
      ` : emptyState('등록된 상품이 없습니다', '관리자 화면에서 상점 상품을 직접 추가하면 이곳에 표시됩니다.')}
    `;
  }

  function productCard(product) {
    const image = product.imageUrl
      ? `<img src="${S.escapeHtml(product.imageUrl)}" alt="${S.escapeHtml(product.name)}">`
      : `<div class="product-placeholder" aria-hidden="true"><span>IMG</span></div>`;

    return `
      <article class="product-card">
        <div class="product-image">${image}</div>
        <div class="product-body">
          <div class="post-topline">${badge(product.category)}${product.featured ? badge('추천') : ''}<span>${S.escapeHtml(product.stock || '')}</span></div>
          <h3>${S.escapeHtml(product.name)}</h3>
          <p>${S.escapeHtml(product.summary)}</p>
          <strong class="price">${S.escapeHtml(product.price)}</strong>
          ${tagList(product.tags)}
        </div>
      </article>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderShell();
    renderHome();
    renderBoard();
    renderAbout();
    renderShop();
  });
})();

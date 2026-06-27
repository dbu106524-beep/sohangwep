(function () {
  'use strict';

  const S = window.AsteroidStore;
  const TYPE_LABEL = { notice: '공지사항', update: '업데이트', event: '이벤트' };
  const TABS = [
    ['posts', '게시글 관리'],
    ['guides', '소개/가이드'],
    ['shop', '상점 상품'],
    ['settings', '사이트 설정'],
    ['data', '백업/복원']
  ];
  let activeTab = 'posts';

  function $(selector, root = document) { return root.querySelector(selector); }
  function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
  function esc(value) { return S.escapeHtml(value ?? ''); }
  function tags(value) { return Array.isArray(value) ? value.join(', ') : ''; }

  function field(form, name) { return form.elements.namedItem(name); }
  function getValue(form, name) { const el = field(form, name); return el ? el.value : ''; }
  function setValue(form, name, value) { const el = field(form, name); if (el) el.value = value ?? ''; }
  function isChecked(form, name) { const el = field(form, name); return Boolean(el && el.checked); }
  function setChecked(form, name, value) { const el = field(form, name); if (el) el.checked = Boolean(value); }

  function setStatus(message, isError = false) {
    const line = $('#admin-status');
    if (!line) return;
    line.textContent = message;
    line.classList.toggle('error', Boolean(isError));
  }

  function option(value, label, selected) {
    return `<option value="${esc(value)}" ${selected ? 'selected' : ''}>${esc(label)}</option>`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('이미지 파일을 읽지 못했습니다.'));
      reader.readAsDataURL(file);
    });
  }

  function resizeImageDataUrl(dataUrl, mimeType) {
    if (mimeType === 'image/svg+xml') return Promise.resolve(dataUrl);
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 1200;
        const scale = Math.min(1, maxSide / image.width, maxSide / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#151936';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  async function productImageFromFile(file) {
    if (!file) return '';
    if (!file.type || !file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드할 수 있습니다.');
    }
    const dataUrl = await readFileAsDataUrl(file);
    return resizeImageDataUrl(dataUrl, file.type);
  }

  function setProductPreview(form, src, label) {
    const preview = $('[data-product-preview]', form);
    if (!preview) return;
    if (!src) {
      preview.innerHTML = '<span>이미지를 선택하면 여기에 미리보기가 표시됩니다.</span>';
      return;
    }
    preview.innerHTML = `<img src="${esc(src)}" alt="${esc(label || '상품 이미지 미리보기')}">`;
  }

  function updateProductPreview(form) {
    setProductPreview(form, getValue(form, 'imageUrl'), getValue(form, 'name') || '상품 이미지');
  }

  function render() {
    const root = $('#admin-root');
    if (!root) return;
    const adminConfig = S.getAdminConfig();
    if (!adminConfig) return renderSetup(root);
    if (!S.isLoggedIn()) return renderLogin(root, adminConfig);
    return renderDashboard(root, adminConfig);
  }

  function renderSetup(root) {
    root.innerHTML = `
      <section class="admin-card">
        <span class="eyebrow">FIRST SETUP</span>
        <h1>관리자 계정 설정</h1>
        <p class="muted">처음 한 번만 관리자 ID와 비밀번호를 등록합니다. 비밀번호는 원문으로 저장하지 않고 브라우저 로컬 저장소에 해시로 저장합니다.</p>
        <div class="admin-warning">중요: 이 방식은 로컬 프로토타입입니다. 실제 공개 운영에서는 Supabase Auth, RLS, 서버 API 권한 검사를 연결하세요.</div>
        <form id="setup-form">
          <div class="admin-field">
            <label for="setup-username">관리자 ID</label>
            <input class="admin-input" id="setup-username" name="username" autocomplete="username" required placeholder="예: assohang">
          </div>
          <div class="admin-field">
            <label for="setup-password">비밀번호</label>
            <input class="admin-input" id="setup-password" name="password" type="password" autocomplete="new-password" required minlength="8">
          </div>
          <div class="admin-field">
            <label for="setup-password2">비밀번호 확인</label>
            <input class="admin-input" id="setup-password2" name="password2" type="password" autocomplete="new-password" required minlength="8">
          </div>
          <div class="admin-actions">
            <button class="button primary" type="submit">관리자 생성</button>
          </div>
          <p id="admin-status" class="status-line"></p>
        </form>
      </section>
    `;

    $('#setup-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const username = getValue(form, 'username').trim();
      const password = getValue(form, 'password');
      const password2 = getValue(form, 'password2');
      if (password !== password2) return setStatus('비밀번호 확인이 일치하지 않습니다.', true);
      try {
        setStatus('계정을 생성하는 중입니다...');
        await S.createAdmin(username, password);
        await S.verifyAdmin(username, password);
        render();
      } catch (error) {
        setStatus(error.message || '관리자 생성에 실패했습니다.', true);
      }
    });
  }

  function renderLogin(root, adminConfig) {
    root.innerHTML = `
      <section class="admin-card">
        <span class="eyebrow">ADMIN ACCESS</span>
        <h1>관리자 로그인</h1>
        <p class="muted">등록한 관리자 ID로 로그인하면 로컬 데이터를 수정할 수 있습니다.</p>
        <div class="admin-warning">이 화면은 UI 프로토타입입니다. 실제 배포 보안은 서버 권한 구조로 처리하세요.</div>
        <form id="login-form">
          <div class="admin-field">
            <label for="login-username">관리자 ID</label>
            <input class="admin-input" id="login-username" name="username" autocomplete="username" value="${esc(adminConfig.username)}" required>
          </div>
          <div class="admin-field">
            <label for="login-password">비밀번호</label>
            <input class="admin-input" id="login-password" name="password" type="password" autocomplete="current-password" required>
          </div>
          <div class="admin-actions">
            <button class="button primary" type="submit">접속</button>
            <button class="button danger" id="clear-admin" type="button">로컬 관리자 초기화</button>
          </div>
          <p id="admin-status" class="status-line"></p>
        </form>
      </section>
    `;

    $('#login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      setStatus('확인 중입니다...');
      const ok = await S.verifyAdmin(getValue(form, 'username'), getValue(form, 'password'));
      if (!ok) return setStatus('ID 또는 비밀번호가 맞지 않습니다.', true);
      render();
    });

    $('#clear-admin').addEventListener('click', () => {
      if (!confirm('이 브라우저에 저장된 관리자 계정을 초기화할까요? 게시글 데이터는 유지됩니다.')) return;
      S.clearAdmin();
      render();
    });
  }

  function renderDashboard(root, adminConfig) {
    const tabs = TABS.map(([id, label]) => `<button class="admin-tab ${activeTab === id ? 'active' : ''}" data-tab="${id}" type="button">${label}</button>`).join('');
    root.innerHTML = `
      <section class="page-hero">
        <span class="eyebrow">MISSION CONTROL</span>
        <h1>관리자 화면</h1>
        <p>공지사항, 업데이트, 이벤트, 소개/가이드, 상점 상품을 로컬에서 관리하는 프로토타입입니다.</p>
      </section>
      <section class="admin-shell">
        <aside class="admin-sidebar">
          <h2>관리 메뉴</h2>
          <p>접속 계정: <strong>${esc(adminConfig.username)}</strong></p>
          <div class="admin-tabs">${tabs}</div>
          <div class="admin-actions">
            <a class="button ghost small" href="index.html">사이트 화면</a>
            <button id="logout" class="button danger small" type="button">로그아웃</button>
          </div>
        </aside>
        <div id="admin-panel" class="admin-panel"></div>
      </section>
    `;

    $all('.admin-tab').forEach(button => {
      button.addEventListener('click', () => {
        activeTab = button.dataset.tab;
        renderDashboard(root, adminConfig);
      });
    });
    $('#logout').addEventListener('click', () => { S.logout(); render(); });
    renderPanel();
  }

  function renderPanel() {
    const panel = $('#admin-panel');
    if (!panel) return;
    if (activeTab === 'posts') return renderPostsPanel(panel);
    if (activeTab === 'guides') return renderGuidesPanel(panel);
    if (activeTab === 'shop') return renderShopPanel(panel);
    if (activeTab === 'settings') return renderSettingsPanel(panel);
    if (activeTab === 'data') return renderDataPanel(panel);
  }

  function renderPostsPanel(panel) {
    const data = S.getData();
    const posts = data.posts.slice().sort(S.sortByPinnedRecent);
    panel.innerHTML = `
      <h2>게시글 관리</h2>
      <p class="muted">공지사항, 업데이트, 이벤트 글을 작성하고 공개 상태를 제어합니다.</p>
      <form id="post-form">
        <input type="hidden" name="id">
        <div class="admin-grid">
          <div class="admin-field">
            <label>게시판</label>
            <select class="admin-select" name="type">
              ${option('notice', '공지사항', false)}
              ${option('update', '업데이트', false)}
              ${option('event', '이벤트', false)}
            </select>
          </div>
          <div class="admin-field">
            <label>상태</label>
            <select class="admin-select" name="status">
              ${option('published', '공개', true)}
              ${option('draft', '비공개 초안', false)}
            </select>
          </div>
        </div>
        <div class="admin-field"><label>제목</label><input class="admin-input" name="title" required></div>
        <div class="admin-field"><label>요약</label><input class="admin-input" name="summary"></div>
        <div class="admin-field"><label>본문</label><textarea class="admin-textarea" name="content" required></textarea></div>
        <div class="admin-grid">
          <div class="admin-field"><label>태그, 쉼표로 구분</label><input class="admin-input" name="tags" placeholder="예: 이벤트, 보상"></div>
          <label class="checkbox-row"><input type="checkbox" name="pinned"> 상단 고정</label>
        </div>
        <div class="admin-grid">
          <div class="admin-field"><label>이벤트 시작일</label><input class="admin-input" name="eventStart" type="date"></div>
          <div class="admin-field"><label>이벤트 종료일</label><input class="admin-input" name="eventEnd" type="date"></div>
        </div>
        <div class="admin-actions">
          <button class="button primary" type="submit">저장</button>
          <button class="button ghost" type="reset" id="post-reset">새 글 작성</button>
        </div>
        <p id="admin-status" class="status-line"></p>
      </form>
      <div class="admin-list" id="post-list">
        ${posts.length ? posts.map(postRow).join('') : '<p class="muted">게시글이 없습니다.</p>'}
      </div>
    `;

    const form = $('#post-form', panel);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const existing = S.getData().posts.find(post => post.id === getValue(form, 'id'));
      S.upsertPost({
        id: getValue(form, 'id'),
        createdAt: existing && existing.createdAt,
        type: getValue(form, 'type'),
        status: getValue(form, 'status'),
        title: getValue(form, 'title'),
        summary: getValue(form, 'summary'),
        content: getValue(form, 'content'),
        tags: getValue(form, 'tags'),
        pinned: isChecked(form, 'pinned'),
        eventStart: getValue(form, 'eventStart'),
        eventEnd: getValue(form, 'eventEnd')
      });
      setStatus('게시글을 저장했습니다.');
      renderPostsPanel(panel);
    });

    $('#post-reset', panel).addEventListener('click', () => { setValue(form, 'id', ''); setStatus('새 글을 작성합니다.'); });
    $('#post-list', panel).addEventListener('click', event => {
      const edit = event.target.closest('[data-edit-post]');
      const del = event.target.closest('[data-delete-post]');
      if (edit) {
        const post = S.getData().posts.find(item => item.id === edit.dataset.editPost);
        if (!post) return;
        setValue(form, 'id', post.id);
        setValue(form, 'type', post.type);
        setValue(form, 'status', post.status);
        setValue(form, 'title', post.title);
        setValue(form, 'summary', post.summary || '');
        setValue(form, 'content', post.content || '');
        setValue(form, 'tags', tags(post.tags));
        setChecked(form, 'pinned', Boolean(post.pinned));
        setValue(form, 'eventStart', post.eventStart || '');
        setValue(form, 'eventEnd', post.eventEnd || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStatus('수정할 게시글을 불러왔습니다.');
      }
      if (del) {
        if (!confirm('게시글을 삭제할까요?')) return;
        S.deletePost(del.dataset.deletePost);
        renderPostsPanel(panel);
      }
    });
  }

  function postRow(post) {
    const page = post.type === 'notice' ? 'notice.html' : post.type === 'update' ? 'updates.html' : 'events.html';
    return `
      <div class="admin-row">
        <div>
          <strong>${esc(post.title)}</strong>
          <small>${esc(TYPE_LABEL[post.type])} · ${post.status === 'published' ? '공개' : '비공개'} · ${post.pinned ? '고정 · ' : ''}${S.formatDate(post.updatedAt || post.createdAt)}</small>
        </div>
        <div class="admin-row-actions">
          <a class="button ghost small" href="${page}?id=${encodeURIComponent(post.id)}">보기</a>
          <button class="button small" type="button" data-edit-post="${esc(post.id)}">수정</button>
          <button class="button danger small" type="button" data-delete-post="${esc(post.id)}">삭제</button>
        </div>
      </div>
    `;
  }

  function renderGuidesPanel(panel) {
    const data = S.getData();
    const categories = data.guideCategories.slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const guides = data.guides.slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    panel.innerHTML = `
      <h2>소개 · 가이드 관리</h2>
      <p class="muted">소개 페이지에 표시할 카테고리와 가이드 문서를 만듭니다.</p>
      <section class="glass-card">
        <h3>카테고리</h3>
        <form id="cat-form">
          <input type="hidden" name="id">
          <div class="admin-grid">
            <div class="admin-field"><label>카테고리명</label><input class="admin-input" name="title" required></div>
            <div class="admin-field"><label>순서</label><input class="admin-input" name="order" type="number" value="1"></div>
          </div>
          <div class="admin-field"><label>설명</label><input class="admin-input" name="description"></div>
          <div class="admin-field"><label>상태</label><select class="admin-select" name="status">${option('published', '공개', true)}${option('draft', '비공개', false)}</select></div>
          <div class="admin-actions">
            <button class="button primary" type="submit">카테고리 저장</button>
            <button class="button ghost" type="reset" id="cat-reset">새 카테고리</button>
          </div>
        </form>
        <div class="admin-list" id="cat-list">${categories.map(categoryRow).join('')}</div>
      </section>
      <section class="glass-card admin-subsection">
        <h3>가이드 문서</h3>
        <form id="guide-form">
          <input type="hidden" name="id">
          <div class="admin-grid">
            <div class="admin-field"><label>카테고리</label><select class="admin-select" name="categoryId">${option('', '카테고리 선택', false)}${categories.map(cat => option(cat.id, cat.title, false)).join('')}</select></div>
            <div class="admin-field"><label>상태</label><select class="admin-select" name="status">${option('published', '공개', true)}${option('draft', '비공개', false)}</select></div>
          </div>
          <div class="admin-grid">
            <div class="admin-field"><label>제목</label><input class="admin-input" name="title" required></div>
            <div class="admin-field"><label>순서</label><input class="admin-input" name="order" type="number" value="1"></div>
          </div>
          <div class="admin-field"><label>요약</label><input class="admin-input" name="summary"></div>
          <div class="admin-field"><label>본문</label><textarea class="admin-textarea" name="content" required></textarea></div>
          <div class="admin-actions">
            <button class="button primary" type="submit">가이드 저장</button>
            <button class="button ghost" type="reset" id="guide-reset">새 가이드</button>
          </div>
          <p id="admin-status" class="status-line"></p>
        </form>
        <div class="admin-list" id="guide-list">${guides.length ? guides.map(guideRow).join('') : '<p class="muted">가이드가 없습니다.</p>'}</div>
      </section>
    `;

    const catForm = $('#cat-form', panel);
    const guideForm = $('#guide-form', panel);
    catForm.addEventListener('submit', event => {
      event.preventDefault();
      S.upsertGuideCategory({ id: getValue(catForm, 'id'), title: getValue(catForm, 'title'), description: getValue(catForm, 'description'), order: getValue(catForm, 'order'), status: getValue(catForm, 'status') });
      renderGuidesPanel(panel);
    });
    $('#cat-reset', panel).addEventListener('click', () => { setValue(catForm, 'id', ''); });
    $('#cat-list', panel).addEventListener('click', event => {
      const edit = event.target.closest('[data-edit-cat]');
      const del = event.target.closest('[data-delete-cat]');
      if (edit) {
        const cat = S.getData().guideCategories.find(item => item.id === edit.dataset.editCat);
        if (!cat) return;
        setValue(catForm, 'id', cat.id);
        setValue(catForm, 'title', cat.title);
        setValue(catForm, 'description', cat.description || '');
        setValue(catForm, 'order', cat.order || 0);
        setValue(catForm, 'status', cat.status || 'published');
      }
      if (del) {
        if (!confirm('카테고리를 삭제할까요? 이 카테고리의 가이드는 미분류로 이동합니다.')) return;
        S.deleteGuideCategory(del.dataset.deleteCat);
        renderGuidesPanel(panel);
      }
    });

    guideForm.addEventListener('submit', event => {
      event.preventDefault();
      const existing = S.getData().guides.find(guide => guide.id === getValue(guideForm, 'id'));
      S.upsertGuide({
        id: getValue(guideForm, 'id'),
        createdAt: existing && existing.createdAt,
        categoryId: getValue(guideForm, 'categoryId'),
        title: getValue(guideForm, 'title'),
        summary: getValue(guideForm, 'summary'),
        content: getValue(guideForm, 'content'),
        status: getValue(guideForm, 'status'),
        order: getValue(guideForm, 'order')
      });
      setStatus('가이드를 저장했습니다.');
      renderGuidesPanel(panel);
    });
    $('#guide-reset', panel).addEventListener('click', () => { setValue(guideForm, 'id', ''); });
    $('#guide-list', panel).addEventListener('click', event => {
      const edit = event.target.closest('[data-edit-guide]');
      const del = event.target.closest('[data-delete-guide]');
      if (edit) {
        const guide = S.getData().guides.find(item => item.id === edit.dataset.editGuide);
        if (!guide) return;
        setValue(guideForm, 'id', guide.id);
        setValue(guideForm, 'categoryId', guide.categoryId || '');
        setValue(guideForm, 'status', guide.status || 'draft');
        setValue(guideForm, 'title', guide.title);
        setValue(guideForm, 'order', guide.order || 0);
        setValue(guideForm, 'summary', guide.summary || '');
        setValue(guideForm, 'content', guide.content || '');
        setStatus('수정할 가이드를 불러왔습니다.');
      }
      if (del) {
        if (!confirm('가이드를 삭제할까요?')) return;
        S.deleteGuide(del.dataset.deleteGuide);
        renderGuidesPanel(panel);
      }
    });
  }

  function categoryRow(cat) {
    return `
      <div class="admin-row">
        <div><strong>${esc(cat.title)}</strong><small>${cat.status === 'published' ? '공개' : '비공개'} · 순서 ${esc(cat.order)} · ${esc(cat.description)}</small></div>
        <div class="admin-row-actions">
          <button class="button small" type="button" data-edit-cat="${esc(cat.id)}">수정</button>
          <button class="button danger small" type="button" data-delete-cat="${esc(cat.id)}">삭제</button>
        </div>
      </div>
    `;
  }

  function guideRow(guide) {
    const data = S.getData();
    const cat = data.guideCategories.find(item => item.id === guide.categoryId);
    return `
      <div class="admin-row">
        <div><strong>${esc(guide.title)}</strong><small>${esc(cat ? cat.title : '미분류')} · ${guide.status === 'published' ? '공개' : '비공개'} · 순서 ${esc(guide.order)}</small></div>
        <div class="admin-row-actions">
          <a class="button ghost small" href="about.html">보기</a>
          <button class="button small" type="button" data-edit-guide="${esc(guide.id)}">수정</button>
          <button class="button danger small" type="button" data-delete-guide="${esc(guide.id)}">삭제</button>
        </div>
      </div>
    `;
  }

  function renderShopPanel(panel) {
    const data = S.getData();
    const products = data.products.slice().sort((a, b) => Number(b.featured) - Number(a.featured) || S.sortByRecent(a, b));
    panel.innerHTML = `
      <h2>상점 상품 관리</h2>
      <p class="muted">상품명, 가격, 설명, 업로드 이미지를 등록합니다. 업로드 이미지는 이 브라우저의 localStorage에 저장됩니다.</p>
      <form id="product-form">
        <input type="hidden" name="id">
        <input type="hidden" name="imageUrl">
        <div class="admin-grid">
          <div class="admin-field"><label>상품명</label><input class="admin-input" name="name" required></div>
          <div class="admin-field"><label>가격</label><input class="admin-input" name="price" placeholder="예: 10,000원 / 무료 / 준비중"></div>
        </div>
        <div class="admin-grid">
          <div class="admin-field"><label>카테고리</label><input class="admin-input" name="category" placeholder="패키지, 코스메틱, 장비"></div>
          <div class="admin-field"><label>상태</label><select class="admin-select" name="status">${option('published', '공개', true)}${option('draft', '비공개', false)}</select></div>
        </div>
        <div class="admin-field"><label>요약</label><input class="admin-input" name="summary"></div>
        <div class="admin-field"><label>상세 설명</label><textarea class="admin-textarea" name="description"></textarea></div>
        <div class="admin-grid image-upload-grid">
          <div class="admin-field">
            <label>상품 이미지 업로드</label>
            <input class="file-input" name="imageFile" type="file" accept="image/*">
            <small class="field-help">큰 이미지는 자동으로 축소해 저장합니다. 실제 운영에서는 Supabase Storage 연결을 추천합니다.</small>
          </div>
          <div class="image-preview" data-product-preview><span>이미지를 선택하면 여기에 미리보기가 표시됩니다.</span></div>
        </div>
        <div class="admin-grid">
          <div class="admin-field"><label>재고/상태 문구</label><input class="admin-input" name="stock" placeholder="상시, 한정, 준비중"></div>
          <div class="admin-field"><label>태그, 쉼표로 구분</label><input class="admin-input" name="tags"></div>
        </div>
        <label class="checkbox-row"><input type="checkbox" name="featured"> 추천 상품</label>
        <div class="admin-actions">
          <button class="button primary" type="submit">상품 저장</button>
          <button class="button ghost" type="reset" id="product-reset">새 상품</button>
        </div>
        <p id="admin-status" class="status-line"></p>
      </form>
      <div class="admin-list" id="product-list">${products.length ? products.map(productRow).join('') : '<p class="muted">상품이 없습니다.</p>'}</div>
    `;

    const form = $('#product-form', panel);
    const fileInput = field(form, 'imageFile');
    updateProductPreview(form);

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return updateProductPreview(form);
      const url = URL.createObjectURL(file);
      setProductPreview(form, url, file.name);
      setStatus('선택한 이미지는 상품 저장을 눌러야 반영됩니다.');
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('button[type="submit"]', form);
      const existing = S.getData().products.find(product => product.id === getValue(form, 'id'));
      let imageUrl = getValue(form, 'imageUrl');
      try {
        button.disabled = true;
        const file = fileInput.files && fileInput.files[0];
        if (file) {
          setStatus('이미지를 정리해 저장하는 중입니다...');
          imageUrl = await productImageFromFile(file);
        }
        S.upsertProduct({
          id: getValue(form, 'id'),
          createdAt: existing && existing.createdAt,
          name: getValue(form, 'name'),
          price: getValue(form, 'price'),
          category: getValue(form, 'category'),
          status: getValue(form, 'status'),
          summary: getValue(form, 'summary'),
          description: getValue(form, 'description'),
          imageUrl,
          stock: getValue(form, 'stock'),
          tags: getValue(form, 'tags'),
          featured: isChecked(form, 'featured')
        });
        setStatus('상품을 저장했습니다.');
        renderShopPanel(panel);
      } catch (error) {
        setStatus(error.message || '상품 저장에 실패했습니다.', true);
      } finally {
        button.disabled = false;
      }
    });

    $('#product-reset', panel).addEventListener('click', () => {
      setValue(form, 'id', '');
      setValue(form, 'imageUrl', '');
      setTimeout(() => updateProductPreview(form), 0);
      setStatus('새 상품을 작성합니다.');
    });

    $('#product-list', panel).addEventListener('click', event => {
      const edit = event.target.closest('[data-edit-product]');
      const del = event.target.closest('[data-delete-product]');
      if (edit) {
        const product = S.getData().products.find(item => item.id === edit.dataset.editProduct);
        if (!product) return;
        setValue(form, 'id', product.id);
        setValue(form, 'name', product.name);
        setValue(form, 'price', product.price || '');
        setValue(form, 'category', product.category || '');
        setValue(form, 'status', product.status || 'draft');
        setValue(form, 'summary', product.summary || '');
        setValue(form, 'description', product.description || '');
        setValue(form, 'imageUrl', product.imageUrl || '');
        setValue(form, 'stock', product.stock || '');
        setValue(form, 'tags', tags(product.tags));
        setChecked(form, 'featured', Boolean(product.featured));
        if (fileInput) fileInput.value = '';
        updateProductPreview(form);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStatus('수정할 상품을 불러왔습니다. 이미지를 바꾸려면 새 파일을 선택하세요.');
      }
      if (del) {
        if (!confirm('상품을 삭제할까요?')) return;
        S.deleteProduct(del.dataset.deleteProduct);
        renderShopPanel(panel);
      }
    });
  }

  function productRow(product) {
    const thumb = product.imageUrl
      ? `<img class="admin-thumb" src="${esc(product.imageUrl)}" alt="${esc(product.name)}">`
      : '<span class="admin-thumb placeholder">IMG</span>';
    return `
      <div class="admin-row product-admin-row">
        <div class="admin-row-main">
          ${thumb}
          <div><strong>${esc(product.name)}</strong><small>${esc(product.category)} · ${product.status === 'published' ? '공개' : '비공개'} · ${product.featured ? '추천 · ' : ''}${esc(product.price)}</small></div>
        </div>
        <div class="admin-row-actions">
          <a class="button ghost small" href="shop.html">보기</a>
          <button class="button small" type="button" data-edit-product="${esc(product.id)}">수정</button>
          <button class="button danger small" type="button" data-delete-product="${esc(product.id)}">삭제</button>
        </div>
      </div>
    `;
  }

  function renderSettingsPanel(panel) {
    const data = S.getData();
    const settings = data.settings;
    panel.innerHTML = `
      <h2>사이트 설정</h2>
      <p class="muted">사이트 문구, Discord 초대 링크, 소개 문구를 수정합니다.</p>
      <form id="settings-form">
        <div class="admin-grid">
          <div class="admin-field"><label>사이트명</label><input class="admin-input" name="siteName" value="${esc(settings.siteName)}"></div>
          <div class="admin-field"><label>한 줄 설명</label><input class="admin-input" name="tagline" value="${esc(settings.tagline)}"></div>
        </div>
        <div class="admin-grid">
          <div class="admin-field"><label>히어로 제목</label><input class="admin-input" name="heroTitle" value="${esc(settings.heroTitle)}"></div>
          <div class="admin-field"><label>히어로 부제목</label><input class="admin-input" name="heroSubtitle" value="${esc(settings.heroSubtitle)}"></div>
        </div>
        <div class="admin-field"><label>개요 본문</label><textarea class="admin-textarea" name="overviewText">${esc(settings.overviewText)}</textarea></div>
        <div class="admin-field"><label>가이드 소개 문구</label><textarea class="admin-textarea" name="guideIntro">${esc(settings.guideIntro)}</textarea></div>
        <div class="admin-field"><label>상점 소개 문구</label><textarea class="admin-textarea" name="shopIntro">${esc(settings.shopIntro)}</textarea></div>
        <div class="admin-field"><label>Discord 초대 링크</label><input class="admin-input" name="discordInviteUrl" value="${esc(settings.discordInviteUrl)}" placeholder="https://discord.gg/ju5YCandvB"></div>
        <div class="admin-actions"><button class="button primary" type="submit">설정 저장</button></div>
        <p id="admin-status" class="status-line"></p>
      </form>
      <section class="glass-card admin-subsection">
        <h3>관리자 비밀번호 변경</h3>
        <form id="password-form">
          <div class="admin-field"><label>현재 비밀번호</label><input class="admin-input" name="currentPassword" type="password" required></div>
          <div class="admin-field"><label>새 비밀번호</label><input class="admin-input" name="newPassword" type="password" required minlength="8"></div>
          <div class="admin-actions"><button class="button primary" type="submit">비밀번호 변경</button></div>
        </form>
      </section>
    `;

    $('#settings-form', panel).addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      S.updateSettings({
        siteName: getValue(form, 'siteName'),
        tagline: getValue(form, 'tagline'),
        heroTitle: getValue(form, 'heroTitle'),
        heroSubtitle: getValue(form, 'heroSubtitle'),
        overviewText: getValue(form, 'overviewText'),
        guideIntro: getValue(form, 'guideIntro'),
        shopIntro: getValue(form, 'shopIntro'),
        discordInviteUrl: getValue(form, 'discordInviteUrl')
      });
      setStatus('사이트 설정을 저장했습니다. 새로고침하면 헤더와 푸터까지 반영됩니다.');
    });

    $('#password-form', panel).addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      try {
        setStatus('비밀번호를 변경하는 중입니다...');
        await S.changeAdminPassword(getValue(form, 'currentPassword'), getValue(form, 'newPassword'));
        setStatus('비밀번호를 변경했습니다. 다시 로그인해 주세요.');
        S.logout();
        setTimeout(render, 600);
      } catch (error) {
        setStatus(error.message || '비밀번호 변경에 실패했습니다.', true);
      }
    });
  }

  function renderDataPanel(panel) {
    panel.innerHTML = `
      <h2>백업 · 복원</h2>
      <p class="muted">현재 브라우저에 저장된 사이트 데이터를 JSON으로 백업하거나 복원합니다.</p>
      <section class="glass-card">
        <h3>백업</h3>
        <p class="muted">운영 전에는 데이터를 Supabase 같은 DB로 옮기는 것을 권장합니다.</p>
        <div class="admin-actions">
          <button class="button primary" id="export-data" type="button">JSON 백업 다운로드</button>
          <button class="button ghost" id="reset-demo" type="button">샘플 데이터로 초기화</button>
        </div>
      </section>
      <section class="glass-card admin-subsection">
        <h3>복원</h3>
        <p class="muted">이 프로토타입에서 내보낸 JSON 파일을 선택하세요.</p>
        <input class="file-input" id="import-file" type="file" accept="application/json">
        <div class="admin-actions"><button class="button primary" id="import-data" type="button">선택한 JSON 복원</button></div>
        <p id="admin-status" class="status-line"></p>
      </section>
      <section class="glass-card admin-subsection">
        <h3>보안 체크</h3>
        <div class="admin-warning">정적 HTML/JS/CSS는 모두 공개됩니다. 관리자 비밀번호, Discord Client Secret, Azure Secret, 결제 키는 넣지 마세요.</div>
      </section>
    `;

    $('#export-data', panel).addEventListener('click', () => {
      S.downloadJson(`asteroid-site-backup-${new Date().toISOString().slice(0, 10)}.json`, S.getData());
    });
    $('#reset-demo', panel).addEventListener('click', () => {
      if (!confirm('게시글, 가이드, 상품을 샘플 데이터로 되돌릴까요?')) return;
      S.resetData();
      setStatus('샘플 데이터로 초기화했습니다.');
    });
    $('#import-data', panel).addEventListener('click', () => {
      const file = $('#import-file', panel).files[0];
      if (!file) return setStatus('복원할 JSON 파일을 선택하세요.', true);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          S.saveData(data);
          setStatus('데이터를 복원했습니다.');
        } catch (error) {
          setStatus('JSON 파일을 읽을 수 없습니다.', true);
        }
      };
      reader.readAsText(file);
    });
  }

  document.addEventListener('DOMContentLoaded', render);
})();

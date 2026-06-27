(function () {
  'use strict';

  const DATA_KEY = 'asteroid_expedition_content_v1';
  const ADMIN_KEY = 'asteroid_expedition_admin_v1';
  const SESSION_KEY = 'asteroid_expedition_admin_session_v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${Date.now().toString(36)}-${rand}`;
  }

  function getSeed() {
    return clone(window.ASTH_SEED || { version: 1, settings: {}, posts: [], guideCategories: [], guides: [], products: [] });
  }

  function mergeBySeed(storedList, seedList, oldVersion, mergeItem) {
    const stored = Array.isArray(storedList) ? storedList : [];
    const seed = Array.isArray(seedList) ? seedList : [];
    if (oldVersion && seed.length === 0) return [];

    const seedIds = new Set(seed.map(item => item.id));
    if (oldVersion) {
      const customItems = stored.filter(item => item && item.id && !seedIds.has(item.id));
      return seed.concat(customItems);
    }

    return stored.map(item => {
      const seedItem = seed.find(candidate => candidate.id === item.id);
      return seedItem ? mergeItem(item, seedItem) : item;
    });
  }

  function normalizeData(data) {
    const seed = getSeed();
    const source = data && typeof data === 'object' ? data : {};
    const oldVersion = Number(source.version || 0) < Number(seed.version || 1);
    const settings = oldVersion
      ? clone(seed.settings || {})
      : Object.assign({}, seed.settings || {}, source.settings || {});

    return {
      version: seed.version || source.version || 1,
      settings,
      posts: mergeBySeed(source.posts, seed.posts, oldVersion, item => item),
      guideCategories: mergeBySeed(source.guideCategories, seed.guideCategories, oldVersion, item => item),
      guides: mergeBySeed(source.guides, seed.guides, oldVersion, item => item),
      products: mergeBySeed(source.products, seed.products, oldVersion, (item, seedItem) => {
        const merged = Object.assign({}, item);
        if (!merged.imageUrl && seedItem.imageUrl) merged.imageUrl = seedItem.imageUrl;
        return merged;
      })
    };
  }

  function getData() {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) {
      const seed = getSeed();
      localStorage.setItem(DATA_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.warn('Stored data is invalid. Falling back to seed data.', error);
      return getSeed();
    }
  }

  function saveData(data) {
    const normalized = normalizeData(data);
    localStorage.setItem(DATA_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('asteroid:data-changed', { detail: normalized }));
    return normalized;
  }

  function resetData() {
    const seed = getSeed();
    localStorage.setItem(DATA_KEY, JSON.stringify(seed));
    return seed;
  }

  function escapeHtml(input) {
    return String(input ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function richText(input) {
    const safe = escapeHtml(input || '').trim();
    if (!safe) return '<p class="muted">아직 내용이 등록되지 않았습니다.</p>';

    return safe
      .split(/\n{2,}/)
      .map(block => {
        const lines = block.split('\n');
        if (lines.every(line => /^\s*(-|\d+\.)\s+/.test(line))) {
          return `<ul>${lines.map(line => `<li>${line.replace(/^\s*(-|\d+\.)\s+/, '')}</li>`).join('')}</ul>`;
        }
        return `<p>${lines.join('<br>')}</p>`;
      })
      .join('');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
  }

  function sortByRecent(a, b) {
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  }

  function sortByPinnedRecent(a, b) {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return sortByRecent(a, b);
  }

  function published(list) {
    return list.filter(item => item.status === 'published');
  }

  function parseTags(value) {
    if (Array.isArray(value)) return value.map(String).map(tag => tag.trim()).filter(Boolean);
    return String(value || '').split(',').map(tag => tag.trim()).filter(Boolean);
  }

  function upsertPost(input) {
    const data = getData();
    const date = nowIso();
    const payload = {
      id: input.id || uid('post'),
      type: input.type || 'notice',
      title: input.title || '제목 없음',
      summary: input.summary || '',
      content: input.content || '',
      status: input.status || 'draft',
      pinned: Boolean(input.pinned),
      tags: parseTags(input.tags),
      createdAt: input.createdAt || date,
      updatedAt: date,
      eventStart: input.eventStart || '',
      eventEnd: input.eventEnd || ''
    };
    const index = data.posts.findIndex(item => item.id === payload.id);
    if (index >= 0) data.posts[index] = Object.assign({}, data.posts[index], payload, { createdAt: data.posts[index].createdAt || payload.createdAt });
    else data.posts.unshift(payload);
    saveData(data);
    return payload;
  }

  function deletePost(id) {
    const data = getData();
    data.posts = data.posts.filter(item => item.id !== id);
    saveData(data);
  }

  function upsertGuideCategory(input) {
    const data = getData();
    const payload = {
      id: input.id || uid('cat'),
      title: input.title || '새 카테고리',
      description: input.description || '',
      order: Number(input.order || 0),
      status: input.status || 'published'
    };
    const index = data.guideCategories.findIndex(item => item.id === payload.id);
    if (index >= 0) data.guideCategories[index] = Object.assign({}, data.guideCategories[index], payload);
    else data.guideCategories.push(payload);
    saveData(data);
    return payload;
  }

  function deleteGuideCategory(id) {
    const data = getData();
    data.guideCategories = data.guideCategories.filter(item => item.id !== id);
    data.guides = data.guides.map(guide => guide.categoryId === id ? Object.assign({}, guide, { categoryId: '' }) : guide);
    saveData(data);
  }

  function upsertGuide(input) {
    const data = getData();
    const date = nowIso();
    const payload = {
      id: input.id || uid('guide'),
      categoryId: input.categoryId || '',
      title: input.title || '새 가이드',
      summary: input.summary || '',
      content: input.content || '',
      status: input.status || 'draft',
      order: Number(input.order || 0),
      createdAt: input.createdAt || date,
      updatedAt: date
    };
    const index = data.guides.findIndex(item => item.id === payload.id);
    if (index >= 0) data.guides[index] = Object.assign({}, data.guides[index], payload, { createdAt: data.guides[index].createdAt || payload.createdAt });
    else data.guides.push(payload);
    saveData(data);
    return payload;
  }

  function deleteGuide(id) {
    const data = getData();
    data.guides = data.guides.filter(item => item.id !== id);
    saveData(data);
  }

  function upsertProduct(input) {
    const data = getData();
    const date = nowIso();
    const payload = {
      id: input.id || uid('product'),
      name: input.name || '새 상품',
      category: input.category || '기타',
      price: input.price || '',
      summary: input.summary || '',
      description: input.description || '',
      imageUrl: input.imageUrl || '',
      tags: parseTags(input.tags),
      status: input.status || 'draft',
      featured: Boolean(input.featured),
      stock: input.stock || '',
      createdAt: input.createdAt || date,
      updatedAt: date
    };
    const index = data.products.findIndex(item => item.id === payload.id);
    if (index >= 0) data.products[index] = Object.assign({}, data.products[index], payload, { createdAt: data.products[index].createdAt || payload.createdAt });
    else data.products.unshift(payload);
    saveData(data);
    return payload;
  }

  function deleteProduct(id) {
    const data = getData();
    data.products = data.products.filter(item => item.id !== id);
    saveData(data);
  }

  function updateSettings(settings) {
    const data = getData();
    data.settings = Object.assign({}, data.settings, settings);
    saveData(data);
    return data.settings;
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
  }

  async function pbkdf2(username, password, saltBase64, iterations) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(`${String(username || '').trim().toLowerCase()}:${password}`),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: base64ToBytes(saltBase64), iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function getAdminConfig() {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  async function createAdmin(username, password) {
    const trimmed = String(username || '').trim();
    if (!trimmed || !password || String(password).length < 8) {
      throw new Error('관리자 ID와 8자 이상의 비밀번호가 필요합니다.');
    }
    const salt = randomSalt();
    const iterations = 180000;
    const hash = await pbkdf2(trimmed, password, salt, iterations);
    const config = { username: trimmed, salt, iterations, hash, createdAt: nowIso() };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(config));
    return config;
  }

  async function verifyAdmin(username, password) {
    const config = getAdminConfig();
    if (!config) return false;
    if (String(username || '').trim().toLowerCase() !== String(config.username).trim().toLowerCase()) return false;
    const hash = await pbkdf2(username, password, config.salt, config.iterations || 180000);
    const ok = hash === config.hash;
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: config.username, loggedInAt: nowIso() }));
    }
    return ok;
  }

  function isLoggedIn() {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function changeAdminPassword(currentPassword, newPassword) {
    const config = getAdminConfig();
    if (!config) throw new Error('관리자 계정이 아직 설정되지 않았습니다.');
    const ok = await verifyAdmin(config.username, currentPassword);
    if (!ok) throw new Error('현재 비밀번호가 맞지 않습니다.');
    return createAdmin(config.username, newPassword);
  }

  function clearAdmin() {
    localStorage.removeItem(ADMIN_KEY);
    logout();
  }

  window.AsteroidStore = {
    DATA_KEY,
    ADMIN_KEY,
    SESSION_KEY,
    getData,
    saveData,
    resetData,
    uid,
    nowIso,
    escapeHtml,
    richText,
    formatDate,
    sortByRecent,
    sortByPinnedRecent,
    published,
    parseTags,
    upsertPost,
    deletePost,
    upsertGuideCategory,
    deleteGuideCategory,
    upsertGuide,
    deleteGuide,
    upsertProduct,
    deleteProduct,
    updateSettings,
    downloadJson,
    getAdminConfig,
    createAdmin,
    verifyAdmin,
    isLoggedIn,
    logout,
    changeAdminPassword,
    clearAdmin
  };
})();

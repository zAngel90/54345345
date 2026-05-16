// Version: 1.2.0 - Final Trade Redesign
const API_BASE_URL = 'https://api.vitria.cc/api';
const SERVER_URL = 'https://api.vitria.cc';

let CURRENCY_RATES = {
  'USD': { symbol: '$', rate: 1, flag: 'us' },
  'PEN': { symbol: 'S/', rate: 3.75, flag: 'pe' },
  'COP': { symbol: '$', rate: 4000, flag: 'co' }
};
let currentCurrency = 'PEN';

async function fetchCurrencies() {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/currencies-config`);
    const data = await res.json();
    if (data.success && data.data) {
      const activeCurrencies = data.data.filter(c => c.active);
      CURRENCY_RATES = {};
      activeCurrencies.forEach(c => {
        CURRENCY_RATES[c.code] = {
          symbol: c.code === 'PEN' ? 'S/' : (c.symbol || '$'),
          rate: c.rate,
          flag: c.flag
        };
      });
      if (CURRENCY_RATES['PEN']) {
        currentCurrency = 'PEN';
      } else {
        currentCurrency = Object.keys(CURRENCY_RATES)[0] || 'USD';
      }
      state.currency = currentCurrency;
      renderCurrencies();
      renderCatalog();
    }
  } catch (err) {
    console.error('Error fetching currencies:', err);
    renderCurrencies();
  }
}

// ===== STATE =====
let GAMES = [];
let ALL_PRODUCTS = [];
let PRODUCTS = [];
let GAME_CATEGORIES = {};
let state = {
  currency: 'PEN',
  sort: 'popular',
  activeGame: null,
  search: '',
  cart: [],
  gameSearch: '',
  user: null,
  notifications: [],
  activeNotifTab: 'all',
  categoryIcons: {} // Mapeo de Categoría -> Icono Imagen
};
let lastAddedId = null;
let selectedUser = null;
let searchTimeout = null;
let currentTradeStep = 1;
let tradeSelectedUser = null;
let tradeInventoryItems = [];
let tradeSelectedInventoryItem = null;
let tradeTargetProduct = null;

async function initApp() {
  try {
    // 0. Cargar juegos agregados y configuración de avisos
    loadAddedGames();

    // 1. Cargar mapeo de iconos de categorías primero
    try {
      console.log('📡 Cargando iconos de categorías...');
      const iconsRes = await fetch(`${API_BASE_URL}/admin/category-icons-config`);
      const iconsData = await iconsRes.json();
      if (iconsData.success) {
        state.categoryIcons = iconsData.data;
        console.log('✅ Iconos cargados:', state.categoryIcons);
      }
    } catch (e) { console.warn('❌ Error cargando iconos:', e); }

    // 1. Iniciar todas las peticiones en paralelo para máxima velocidad
    const [gamesRes, prodsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/games-config`),
      fetch(`${API_BASE_URL}/products`),
      fetchCurrencies() // Esta corre de fondo
    ]);

    const gamesData = await gamesRes.json();
    if (gamesData.success) {
      GAMES = gamesData.data.map(g => ({
        id: g.id,
        label: g.name,
        image: g.image ? (g.image.startsWith('http') ? g.image : `${SERVER_URL}${g.image}`) : '',
        hidden: !!g.hidden,
        categories: g.categories || null,
        count: 0
      }));
    }

    const prodsData = await prodsRes.json();
    ALL_PRODUCTS = prodsData.map(p => ({
      ...p,
      purchases: Math.floor(Math.random() * 1000) + 100,
      img: p.image ? (p.image.startsWith('http') ? p.image : `${SERVER_URL}${p.image}`) : ''
    }));
    // Asegurar que PRODUCTS tenga datos antes de construir categorías
    PRODUCTS = [...ALL_PRODUCTS];

    // 3. Construir categorías dinámicas
    GAME_CATEGORIES = {};
    PRODUCTS.forEach(p => {
      if (!GAME_CATEGORIES[p.game]) {
        GAME_CATEGORIES[p.game] = ['Más Vendidos'];
      }
      const cat = p.category || 'Otros';
      if (!GAME_CATEGORIES[p.game].includes(cat)) {
        GAME_CATEGORIES[p.game].push(cat);
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    const addFlag = urlParams.get('add_game');

    if (addFlag === '1' && gameId) {
      if (!state.addedGames) state.addedGames = [];
      if (!state.addedGames.includes(gameId)) {
        state.addedGames.push(gameId);
        saveAddedGames();
      }
    }

    state.limitedMode = (gameId === 'limiteds');
    state.mm2Mode = (gameId === 'mm2' || gameId === 'murder-mystery-2');

    if (state.limitedMode) {
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('catalogContent').classList.add('limited-grid');
      const limRes = await fetch(`${API_BASE_URL}/admin/limiteds-config`);
      const limData = await limRes.json();
      if (limData.success) {
        PRODUCTS = limData.data.map(p => ({
          ...p,
          game: 'limiteds',
          purchases: Math.floor(Math.random() * 500) + 50,
          img: p.image ? (p.image.startsWith('http') ? p.image : `${SERVER_URL}${p.image}`) : ''
        }));
        document.getElementById('limitedsBanner').classList.remove('hidden');
        document.getElementById('mm2Banner').classList.add('hidden');

        GAME_CATEGORIES['limiteds'] = ['Más Vendidos'];
        PRODUCTS.forEach(p => {
          const cat = p.category || 'General';
          if (!GAME_CATEGORIES['limiteds'].includes(cat)) GAME_CATEGORIES['limiteds'].push(cat);
        });
        state.activeGame = 'limiteds';
        document.getElementById('navGameName').textContent = 'Limiteds';
        document.getElementById('navGameCount').textContent = PRODUCTS.length + ' productos';

        // Inyectar el icono de la corona estático
        document.getElementById('navGameThumb').innerHTML = `
          <div class="w-full h-full flex items-center justify-center bg-white/10 border border-white/20 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
          </div>
        `;

        document.getElementById('navGameChip').style.display = 'flex';
        document.getElementById('categoryTabsWrap').style.display = 'block';

        renderTabs();
      }
    } else if (state.mm2Mode) {
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('catalogContent').classList.add('limited-grid');
      const mm2Res = await fetch(`${API_BASE_URL}/admin/mm2-config`);
      const mm2Data = await mm2Res.json();
      if (mm2Data.success) {
        PRODUCTS = mm2Data.data.map(p => ({
          ...p,
          game: 'murder-mystery-2',
          purchases: Math.floor(Math.random() * 300) + 20,
          img: p.image ? (p.image.startsWith('http') ? p.image : `${SERVER_URL}${p.image}`) : ''
        }));
        document.getElementById('mm2Banner').classList.remove('hidden');
        document.getElementById('limitedsBanner').classList.add('hidden');

        GAME_CATEGORIES['murder-mystery-2'] = ['Más Vendidos'];
        PRODUCTS.forEach(p => {
          const cat = p.category || 'Skins';
          if (!GAME_CATEGORIES['murder-mystery-2'].includes(cat)) GAME_CATEGORIES['murder-mystery-2'].push(cat);
        });

        state.activeGame = 'murder-mystery-2';
        document.getElementById('navGameName').textContent = 'Murder Mystery 2';
        document.getElementById('navGameCount').textContent = PRODUCTS.length + ' productos';

        // Inyectar el icono de la espada estático
        document.getElementById('navGameThumb').innerHTML = `
          <div class="w-full h-full flex items-center justify-center bg-white/10 border border-white/20 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/></svg>
          </div>
        `;

        document.getElementById('navGameChip').style.display = 'flex';
        document.getElementById('categoryTabsWrap').style.display = 'block';
        renderTabs();

        renderCatalog(); // Forzar renderizado inmediato tras cargar productos
      }
    } else {
      document.getElementById('limitedsBanner').classList.add('hidden');
      document.getElementById('mm2Banner').classList.add('hidden');

      // Update real counts and ensure PRODUCTS only contains items for listed games
      const validGameIds = GAMES.map(g => g.id);
      PRODUCTS = ALL_PRODUCTS.filter(p => validGameIds.includes(p.game));

      GAMES.forEach(g => {
        g.count = PRODUCTS.filter(p => p.game === g.id).length;
      });

      renderSidebar();
      // Selección de juego estricta por ID o Slug
      const foundGame = gameId ? GAMES.find(g =>
        (g.id && String(g.id).toLowerCase() === String(gameId).toLowerCase()) ||
        (g.slug && String(g.slug).toLowerCase() === String(gameId).toLowerCase())
      ) : null;

      if (foundGame) {
        selectGame(foundGame.id);
      } else if (!gameId && GAMES.length > 0) {
        // Solo cargamos el primero si NO se especificó ninguno en la URL
        selectGame(GAMES[0].id);
      } else if (gameId) {
        console.warn('⚠️ Juego no encontrado:', gameId);
        // Opcional: mostrar un estado de "Juego no encontrado" o simplemente no cargar nada
      }
    }

    initRecentUsers();

    // Log de depuración para ver qué juego se está intentando cargar realmente
    const activeG = GAMES.find(g => String(g.id) === String(state.activeGame));
    console.log(`🚀 Pixel Store | Juego Activo: ${activeG ? activeG.label : 'No encontrado'} | ID: ${state.activeGame}`);


    // Si no estamos en modo especial, la selección de juego ya dispara renderCatalog/renderTabs
    if (!state.limitedMode && !state.mm2Mode) {
      // Ya se llamó a selectGame arriba
    } else {
      renderCatalog();
    }

    // Avisar al padre que estamos listos para recibir el usuario
    window.parent.postMessage({ action: 'ready' }, '*');
  } catch (err) {
    console.error('Error initializing app:', err);
  }
}

// ===== RECENT USERS LOGIC =====
function initRecentUsers() {
  const inputs = [
    { id: 'robloxUserInput', dropdown: 'checkout-recent-users' },
    { id: 'tradeRobloxInput', dropdown: 'trade-recent-users' }
  ];

  inputs.forEach(({ id, dropdown }) => {
    const input = document.getElementById(id);
    const box = document.getElementById(dropdown);
    if (!input || !box) return;

    input.addEventListener('focus', () => renderRecentList(id, dropdown));
    input.addEventListener('click', (e) => {
      e.stopPropagation();
      renderRecentList(id, dropdown);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      setTimeout(() => {
        if (!input.contains(e.target) && !box.contains(e.target)) {
          box.style.display = 'none';
        }
      }, 100);
    });
  });
}

function saveRecentUser(user) {
  if (!user || !user.name || !user.id) return;
  let recents = JSON.parse(localStorage.getItem('recent_roblox_users') || '[]');
  // Remove if exists to re-add at top
  recents = recents.filter(u => u.name.toLowerCase() !== user.name.toLowerCase());
  recents.unshift({ name: user.name, id: user.id, avatar: user.avatar });
  // Keep last 5
  if (recents.length > 5) recents.pop();
  localStorage.setItem('recent_roblox_users', JSON.stringify(recents));
}

function renderRecentList(inputId, dropdownId) {
  const box = document.getElementById(dropdownId);
  const list = box.querySelector('.recent-list');
  const recents = JSON.parse(localStorage.getItem('recent_roblox_users') || '[]');

  if (recents.length === 0) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'block';
  list.innerHTML = recents.map(u => `
    <div class="recent-user-item" onclick="selectRecentUser('${inputId}', '${dropdownId}', '${u.name}', '${u.id}')">
      <img src="${u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`}" class="recent-user-avatar" />
      <div class="flex-1 min-w-0">
        <p class="text-[13px] font-bold text-white truncate">${u.name}</p>
        <p class="text-[10px] text-white/30 truncate">ID: ${u.id}</p>
      </div>
    </div>
  `).join('');
}

function selectRecentUser(inputId, dropdownId, name, id) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  input.value = name;
  dropdown.style.display = 'none';

  // Directly select the user since we already have the data
  if (inputId === 'robloxUserInput') {
    if (typeof window.selectRobloxUser === 'function') {
      window.selectRobloxUser(id, name, name);
    }
  } else if (inputId === 'tradeRobloxInput') {
    if (typeof window.selectTradeUser === 'function') {
      window.selectTradeUser(id, name, name);
    }
  }
}

function renderSeoInfo() {
  const container = document.getElementById('seoInfoSection');
  const content = document.getElementById('seoInfoContent');
  if (!container || !content) return;

  console.log('Rendering SEO Info - Mode:', { mm2: state.mm2Mode, limited: state.limitedMode });

  if (state.mm2Mode) {
    container.style.display = 'block';
    container.classList.remove('hidden');
    content.innerHTML = `
      <!-- Murder Mystery 2 SEO -->
      <div class="space-y-6">
        <h1 class="text-3xl font-black text-white uppercase tracking-tight">Comprar Armas y Items de MM2 — Murder Mystery 2</h1>
        <p class="text-white/50 leading-relaxed">
          Compra las mejores armas y items de Murder Mystery 2 en <span class="text-blue-400 font-bold">PIXEL STORE</span>. Encuentra cuchillos Godly, pistolas Legendary, mascotas y collectibles de MM2 al mejor precio. Entrega segura directa a tu cuenta de Roblox con soporte 24/7.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-12">
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-white uppercase">Por qué comprar items de MM2 en PIXEL</h3>
          <ul class="space-y-4">
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Armas Godly y Legendary verificadas</strong>
                <p class="text-white/40 text-xs mt-1">Todas nuestras armas de Murder Mystery 2 son verificadas antes de la venta. Cuchillos, pistolas y mascotas Godly, Legendary, Vintage y más al mejor precio del mercado.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Entrega directa a tu cuenta</strong>
                <p class="text-white/40 text-xs mt-1">Recibes tus items de MM2 directamente en tu inventario de Roblox. El proceso es rápido y seguro, sin riesgo para tu cuenta.</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-white uppercase invisible">.</h3>
          <ul class="space-y-4">
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Catálogo actualizado diariamente</strong>
                <p class="text-white/40 text-xs mt-1">Actualizamos nuestro inventario de Murder Mystery 2 todos los días con los items más buscados. Si no encuentras lo que buscas, contáctanos.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Precios justos de mercado</strong>
                <p class="text-white/40 text-xs mt-1">Nuestros precios de armas MM2 se basan en los valores actuales del mercado. Sin sobreprecios, sin sorpresas.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="space-y-8">
        <h3 class="text-xl font-bold text-white uppercase text-center">Categorías de items MM2</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Cuchillos</span>
            <p class="text-white/30 text-[10px] uppercase">Godly, Legendary, Vintage</p>
          </div>
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Pistolas</span>
            <p class="text-white/30 text-[10px] uppercase">Exclusivas MM2</p>
          </div>
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Mascotas</span>
            <p class="text-white/30 text-[10px] uppercase">Coleccionables</p>
          </div>
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Sets</span>
            <p class="text-white/30 text-[10px] uppercase">Bundles Godly</p>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <h3 class="text-xl font-bold text-white uppercase">Preguntas frecuentes sobre items de MM2</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Cómo recibo mis items de Murder Mystery 2?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Después de tu compra, nos unimos a un servidor de MM2 contigo y te entregamos los items directamente en el juego a través del sistema de intercambio de Roblox.</p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Los items de MM2 son permanentes?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Sí, todos los items que compras son permanentes y se quedan en tu inventario de Roblox para siempre. No hay expiración ni restricciones.</p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Es seguro comprar items de Murder Mystery 2?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Completamente seguro. Utilizamos el sistema de intercambio oficial de Roblox. Tu cuenta no corre ningún riesgo y todos los items son legítimos.</p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Qué hago si no encuentro el item que busco?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Contáctanos por Discord y te ayudamos a conseguir cualquier item de MM2. Tenemos acceso a un amplio inventario que no siempre está en la web.</p>
          </div>
        </div>
      </div>

      <div class="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-white font-black uppercase text-sm">También te puede interesar</div>
        <div class="flex gap-4">
          <button onclick="window.parent.postMessage({ action: 'navigateTo', url: '/catalog/robux' }, '*')" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer">Comprar Robux →</button>
          <a href="?game=limiteds" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Roblox Limiteds →</a>
          <button onclick="window.parent.postMessage({ action: 'navigateTo', url: '/catalog' }, '*')" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer">Items In-Game →</button>
        </div>
      </div>
    `;
  } else if (state.limitedMode) {
    container.style.display = 'block';
    container.classList.remove('hidden');
    content.innerHTML = `
      <!-- Limiteds SEO -->
      <div class="space-y-6">
        <h1 class="text-3xl font-black text-white uppercase tracking-tight">Comprar Roblox Limiteds — Items Exclusivos al Mejor Precio</h1>
        <p class="text-white/50 leading-relaxed">
          Compra items Limitados de Roblox al mejor precio en <span class="text-blue-400 font-bold">PIXEL STORE</span>. Encuentra Faces, Hats, Accessories y más items exclusivos Limited y Limited U. Envío seguro directo a tu cuenta con soporte 24/7. Necesitas Roblox Premium para recibir Limiteds.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-12">
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-white uppercase">Por qué comprar Limiteds en PIXEL</h3>
          <ul class="space-y-4">
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Items verificados y legítimos</strong>
                <p class="text-white/40 text-xs mt-1">Todos nuestros Roblox Limiteds son verificados antes de la venta. Garantizamos autenticidad y valor de mercado correcto.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Envío seguro a tu cuenta</strong>
                <p class="text-white/40 text-xs mt-1">Los Limiteds se transfieren directamente a tu inventario de Roblox de forma segura. Necesitas Roblox Premium activo para recibir items.</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-white uppercase invisible">.</h3>
          <ul class="space-y-4">
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Precios competitivos actualizados</strong>
                <p class="text-white/40 text-xs mt-1">Nuestros precios de Roblox Limiteds se actualizan según el valor de mercado. Ofrecemos las mejores tarifas comparado con otras tiendas.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <div>
                <strong class="text-white block text-sm font-bold">Inventario diverso y actualizado</strong>
                <p class="text-white/40 text-xs mt-1">Desde Faces clásicos hasta Hats exclusivos, tenemos una selección amplia de items Limitados que se actualiza constantemente.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="space-y-8">
        <h3 class="text-xl font-bold text-white uppercase text-center">Tipos de Roblox Limiteds</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Faces</span>
            <p class="text-white/30 text-[10px] uppercase">Limitados y Exclusivos</p>
          </div>
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Hats</span>
            <p class="text-white/30 text-[10px] uppercase">Limited y Limited U</p>
          </div>
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Accessories</span>
            <p class="text-white/30 text-[10px] uppercase">Back, Neck, Shoulder</p>
          </div>
          <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
            <span class="text-white font-bold text-sm block mb-1">Bundles</span>
            <p class="text-white/30 text-[10px] uppercase">Paquetes Especiales</p>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <h3 class="text-xl font-bold text-white uppercase">Preguntas frecuentes sobre Roblox Limiteds</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Necesito Roblox Premium para comprar Limiteds?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Sí, necesitas tener Roblox Premium activo en tu cuenta para poder recibir items Limitados a través del sistema de intercambio de Roblox.</p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Cómo recibo mis Roblox Limiteds?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Después de tu compra, te enviamos los items a través del sistema de intercambio oficial de Roblox. Es rápido, seguro y los items aparecen directamente en tu inventario.</p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Los Limiteds mantienen su valor?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Los items Limitados de Roblox pueden subir o bajar de valor según la demanda del mercado. Algunos Limiteds clásicos han aumentado significativamente su valor con el tiempo.</p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white text-sm font-bold">¿Es seguro comprar Limiteds aquí?</h4>
            <p class="text-white/40 text-xs leading-relaxed">Totalmente. Usamos el sistema de intercambio oficial de Roblox. Tu cuenta no está en riesgo y todos los items son legítimos y verificados.</p>
          </div>
        </div>
      </div>

      <div class="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-white font-black uppercase text-sm">Explora más en PIXEL STORE</div>
        <div class="flex gap-4">
          <button onclick="window.parent.postMessage({ action: 'navigateTo', url: '/catalog/robux' }, '*')" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer">Comprar Robux →</button>
          <a href="?game=mm2" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Items de MM2 →</a>
          <button onclick="window.parent.postMessage({ action: 'navigateTo', url: '/catalog' }, '*')" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer">Items In-Game →</button>
        </div>
      </div>
    `;
  } else {
    container.style.display = 'none';
  }
}

// ===== HELPERS =====
function fmt(p) { 
  const c = CURRENCY_RATES[state.currency]; 
  const v = p * c.rate; 
  const val = v >= 1000 ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2);
  const sym = c.symbol.toLowerCase();
  return `<span class="price-symbol">${sym}</span><span class="price-val">${val}</span>`;
}
function fmtByCurr(p, curr) { const c = CURRENCY_RATES[curr] || CURRENCY_RATES['USD']; const v = p * c.rate; return c.symbol + (v >= 1000 ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2)); }
function formatPrice(p) { return p >= 1000 ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(2); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
function badgeClass(badge, rarity) { 
  const b = (badge || '').toLowerCase();
  if (b === 'hot' || b === 'fuego') return 'badge-hot'; 
  if (b === 'new' || b === 'nuevo') return 'badge-new'; 
  if (b === 'trending' || b === 'top') return 'badge-trending'; 
  if (rarity === 'Mythic') return 'badge-mythic'; 
  if (rarity === 'Legendary') return 'badge-legendary'; 
  if (rarity === 'Epic') return 'badge-epic'; 
  return 'badge-rare'; 
}
function badgeLabel(badge, rarity) { return (badge || rarity || 'ITEM').toUpperCase(); }
function sortProds(arr) {
  if (!arr || !arr.length) return [];
  const s = [...arr];
  const sortBy = state.sort || 'popular';

  if (sortBy === 'popular') {
    return s.sort((a, b) => Number(b.purchases || 0) - Number(a.purchases || 0));
  }
  if (sortBy === 'priceAsc') {
    return s.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }
  if (sortBy === 'priceDesc') {
    return s.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }
  if (sortBy === 'nameAsc') {
    return s.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  if (sortBy === 'nameDesc') {
    return s.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  }
  return s;
}

// ===== RENDER CARD =====
function getRarityColor(rarity) {
  if (!rarity) return '#ffffff';
  const r = rarity.toLowerCase();
  const colors = {
    'godly': '#8b5cf6',
    'ancient': '#ef4444',
    'unique': '#db2777',
    'vintage': '#78350f',
    'legendary': '#8b5cf6',
    'epic': '#d946ef',
    'rare': '#3b82f6',
    'uncommon': '#10b981',
    'common': '#9ca3af'
  };
  return colors[r] || '#ffffff';
}

function renderCard(p) {
  const c = CURRENCY_RATES[state.currency];
  const priceVal = (p.price * c.rate);
  const formattedPrice = priceVal >= 1000 ? priceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : priceVal.toFixed(2);
  let symbol = c.symbol;
  if (symbol === 's/') symbol = 'S/';

  const getBadgeIconHtml = (icon) => {
    if (!icon) return '';
    const icons = {
      'trending-up': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
      'flame': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.292 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
      'sparkles': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
      'star': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'zap': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      'crown': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z"/></svg>'
    };
    return icons[icon] || '';
  };

  const badgeHtml = (p.badge && String(p.badge).trim() !== '') 
    ? `<span class="card-badge-el ${badgeClass(p.badge, p.rarity)}">${getBadgeIconHtml(p.badgeIcon)} <span>${p.badge}</span></span>` 
    : '';

  if (p.badge) console.log('Badge detected for:', p.name, p.badge, p.badgeIcon);

  let themeColor = p.color || getRarityColor(p.rarity);

  // New Badges Logic
  let topBadgeHtml = '';
  const isOutOfStock = !p.onRequest && (p.stock === 0 || p.stock === '0');

  if (isOutOfStock) {
    topBadgeHtml = `<div class="card-top-badge badge-out-stock">Sin stock</div>`;
  } else if (p.onRequest) {
    topBadgeHtml = `<div class="card-top-badge badge-on-request">Bajo pedido</div>`;
  }
  // Se elimina el badge de "X uds" por petición del usuario, ya que basta con el indicador bajo el título.

  // Rarity Detection Ultra-Aggressive
  let rarityLabelHtml = '';
  let r = (p.itemType || p.rarity || p.type || p.badge || '').toUpperCase();

  // Si estamos en MM2 y no hay rareza clara, intentar deducirla o forzarla
  if (!r && p.game === 'murder-mystery-2') {
    r = 'GODLY'; // En MM2 la mayoría son Godly
  }

  // Lógica de temas y colores (Movida aquí arriba para que el badge use el color correcto)
  const isPremiumLimited = (r === 'UNIQUE' || r === 'GODLY' || r === 'LEGENDARY') && p.game === 'limiteds';
  const isInGameItem = p.game && p.game !== 'limiteds';
  let themeClass = '';

  if (isPremiumLimited) {
    if (r === 'UNIQUE') themeColor = '#db2777'; // Fuchsia
    else if (r === 'GODLY') themeColor = '#eab308'; // Oro/Godly
    else if (r === 'LEGENDARY') themeColor = '#eab308'; // Oro para Legendary Limiteds
    themeClass = r === 'UNIQUE' ? 'theme-unique' : 'theme-godly';
  } else if (isInGameItem) {
    themeColor = p.color || getRarityColor(p.rarity);
    if (themeColor.toLowerCase() === '#db2777') themeColor = '#3b82f6';
    themeClass = 'theme-ingame-premium';
  } else {
    themeColor = getRarityColor(p.rarity);
    themeClass = (r === 'GODLY' || r === 'UNIQUE') ? (r === 'UNIQUE' ? 'theme-unique' : 'theme-godly') : '';
  }

  // Helper to darken color for the 3D side
  const darkenColor = (hex, amount) => {
    try {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      let rValue = parseInt(h.slice(0, 2), 16);
      let gValue = parseInt(h.slice(2, 4), 16);
      let bValue = parseInt(h.slice(4, 6), 16);
      rValue = Math.max(0, Math.floor(rValue * (1 - amount)));
      gValue = Math.max(0, Math.floor(gValue * (1 - amount)));
      bValue = Math.max(0, Math.floor(bValue * (1 - amount)));
      return `#${rValue.toString(16).padStart(2, '0')}${gValue.toString(16).padStart(2, '0')}${bValue.toString(16).padStart(2, '0')}`;
    } catch (e) { return 'rgba(0,0,0,0.5)'; }
  };

  const badgeFaceColor = p.badgeColor || themeColor;
  const badgeSideColor = darkenColor(badgeFaceColor, 0.4);

  // Intelligent text color detection
  const getContrastColor = (hex, defaultLight = '#ffffff') => {
    if (p.badgeTextColor) return p.badgeTextColor; // Prioridad total al color manual
    try {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      let rValue = parseInt(h.slice(0, 2), 16);
      let gValue = parseInt(h.slice(2, 4), 16);
      let bValue = parseInt(h.slice(4, 6), 16);
      const brightness = (rValue * 299 + gValue * 587 + bValue * 114) / 1000;
      return brightness > 140 ? '#000000' : defaultLight;
    } catch (e) { return defaultLight; }
  };

  // MM2 & General Rarities (3D Premium Style)
  const create3DBadge = (label, preferredText = '#fff') => {
    const finalText = getContrastColor(badgeFaceColor, preferredText);
    return `<div class="rarity-3d" style="--face-bg: ${badgeFaceColor}; --side-bg: ${badgeSideColor}; --text-color: ${finalText};">
      <div class="rarity-3d-side"></div>
      <div class="rarity-3d-face">${label}</div>
    </div>`;
  };

  if (r === 'UNIQUE') {
    rarityLabelHtml = create3DBadge('UNIQUE');
  } else if (r === 'ANCIENT') {
    rarityLabelHtml = create3DBadge('ANCIENT', '#ffffff');
  } else if (r === 'VINTAGE') {
    rarityLabelHtml = create3DBadge('VINTAGE', '#fde68a');
  } else if (r === 'GODLY' || r.includes('GODLY')) {
    rarityLabelHtml = create3DBadge('GODLY', '#fef08a');
  } else if (r === 'LEGENDARY') {
    rarityLabelHtml = create3DBadge('LEGENDARY');
  } else if (r === 'EPIC') {
    rarityLabelHtml = create3DBadge('EPIC');
  } else if (r === 'RARE') {
    rarityLabelHtml = create3DBadge('RARE');
  } else if (r === 'UNCOMMON') {
    rarityLabelHtml = create3DBadge('UNCOMMON');
  } else if (r === 'COMMON') {
    rarityLabelHtml = create3DBadge('COMMON');
  }

  // Subtitle Logic
  let subtitleHtml = '';
  if (isOutOfStock) {
    subtitleHtml = `<p class="card-subtitle" style="color:#f97316 !important">Sin stock</p>`;
  } else if (p.onRequest) {
    subtitleHtml = `<p class="card-subtitle">Bajo pedido · Lo conseguimos tras tu compra</p>`;
  } else if (p.stock > 0) {
    subtitleHtml = `<p class="card-subtitle">${p.stock} en stock</p>`;
  }

  // High-end Glassmorphism Style - Separado para no afectar Limiteds
  const cardStyle = isPremiumLimited ? `
    --theme-color: ${themeColor};
    /* UNIQUE usa fondo vino (#11060c), Legendary/Godly usan fondo dorado profundo (#161004) */
    background: linear-gradient(165deg, ${r === 'UNIQUE' ? '#11060c' : '#161004'} 60%, ${themeColor}15 100%) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border: 1px solid ${themeColor}33 !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 0 0 35px ${themeColor}15 !important;
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
  ` : `
    --theme-color: ${themeColor};
    background: linear-gradient(165deg, #0a0d14 40%, ${themeColor}35 100%) !important;
    backdrop-filter: blur(20px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(200%) !important;
    border: 1px solid ${themeColor}50 !important;
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.5), 0 0 35px ${themeColor}20 !important;
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
  `;

  return `<div class="product-card ${themeClass}" data-id="${p.id}" onclick="addToCart('${p.id}',event)" style="${cardStyle}">
    ${topBadgeHtml}
    <div class="added-overlay" style="background: rgba(20, 32, 20, 0.4)">
      <div class="check-circle" style="background: #22c55e; box-shadow: 0 0 30px rgba(34, 197, 94, 0.3)">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </div>
    <div class="card-img-wrap" style="background: ${isPremiumLimited ? 
      `radial-gradient(circle at center, ${themeColor}35 0%, transparent 85%)` : 
      `radial-gradient(circle at center, ${themeColor}75 0%, ${themeColor}10 70%, transparent 100%)`}">
      ${isOutOfStock ? `<div class="out-of-stock-overlay"><div class="out-of-stock-label">SIN STOCK</div></div>` : ''}
      ${badgeHtml}
      <img src="${p.img}" alt="${p.name}" loading="lazy">
    </div>
    <div class="card-info" style="background: transparent">
      <div class="flex items-center mb-1">
        ${rarityLabelHtml}
        ${(p.game === 'limiteds' || p.game === 'murder-mystery-2') ? `<span class="card-year ml-auto">${p.year || '2026'}</span>` : ''}
      </div>
      <h3 class="card-title">${p.name}</h3>
      ${subtitleHtml}
      <div class="card-price-row" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-top: auto;">
          <div class="card-price-box">
            ${fmt(p.price)}
          </div>
        <button class="card-cart-btn ${isOutOfStock ? 'out-of-stock' : ''}" onclick="addToCart('${p.id}',event)">
          ${isOutOfStock ?
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>` :
      `<svg class="cart-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg><span class="plus-icon">+</span>`
    }
        </button>
      </div>
    </div>
  </div>`;
}

// ===== CATEGORY TABS =====
let activeTab = 'Más Vendidos';

function renderTabs() {
  const el = document.getElementById('categoryTabs');
  if (!el) return;
  if (!state.activeGame) { el.innerHTML = ''; return; }

  // 1. Buscar si el juego tiene categorías personalizadas en la data del servidor
  const currentGameObj = GAMES.find(g => g.id === state.activeGame);
  let tabs = [];
  
  if (currentGameObj && currentGameObj.categories && currentGameObj.categories.length > 0) {
    tabs = currentGameObj.categories;
    // Si no incluye un "Ver Todo", lo añadimos al principio para que no se oculte nada por defecto
    if (!tabs.some(t => t.toLowerCase() === 'ver todo' || t.toLowerCase() === 'más vendidos')) {
      tabs = ['Ver Todo', ...tabs];
    }
  } else {
    // 2. Fallback al mapeo estático
    tabs = GAME_CATEGORIES[state.activeGame] || ['Ver Todo', 'Productos'];
  }

  el.innerHTML = tabs.map(t => {
    return `
      <button class="category-tab ${t === activeTab ? 'active' : ''}" onclick="selectTab('${t}')">
        <span>${t}</span>
      </button>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}


window.selectTab = function (t) {
  activeTab = t;
  renderTabs();
  renderCatalog();
};

// ===== RENDER CATALOG =====
function getGameIcon(id, type = null) {
  const icons = {
    // Juegos
    'blox-fruits': 'sword',
    'mm2': 'knife',
    'murder-mystery-2': 'knife',
    'limiteds': 'gem',
    'Frutas': 'apple',
    'Fruits': 'apple',
    'Gamepasses': 'ticket',
    'Cajas': 'package',
    'Keys': 'key',
    'Ancient': 'swords',
    'Guns': 'crosshair',
    'Godlies': 'sparkles',
    'Pets': 'dog',
    'Faces': 'smile',
    'Accessories': 'shirt',
    'Bundles': 'layers',
    'Swords': 'sword',
    'Cuchillos': 'knife',
    'Pistolas': 'target',
    'Poderes': 'zap',
    'Tradables': 'refresh-cw',
    'Venta': 'tag'
  };


  const iconName = icons[type] || icons[id] || 'layout-grid';
  return `<i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>`;
}


function renderCatalog() {
  const cat = document.getElementById('catalogContent');
  const empty = document.getElementById('emptyState');

  cat.classList.remove('animate-fade-in');
  void cat.offsetWidth;
  cat.classList.add('animate-fade-in');

  let filtered = PRODUCTS.filter(p => {
    // Si estamos en un juego específico
    const gOk = state.activeGame ? p.game === state.activeGame : true;
    const sOk = state.search ? p.name.toLowerCase().includes(state.search.toLowerCase()) : true;
    // Filtrado por Pestaña/Categoría
    // Si la pestaña es "Más Vendidos" o "Ver Todo" (ignorando mayúsculas), mostramos todo.
    // De lo contrario, filtramos por la categoría exacta del producto.
    const isShowAllTab = activeTab.toLowerCase() === 'más vendidos' || activeTab.toLowerCase() === 'ver todo';
    const tOk = isShowAllTab ? true : (p.category === activeTab);

    // Excluir items que pertenecen explícitamente a MM2 o Limiteds de la vista normal
    const r = (p.rarity || p.badge || p.type || p.itemType || '').toUpperCase();
    const isSpecialRarity = (r === 'GODLY' || r === 'UNIQUE' || r === 'ANCIENT' || r.includes('GODLY'));
    const isSpecialItem = (p.game === 'mm2' || p.game === 'murder-mystery-2' || p.game === 'limiteds');

    const isSpecialMode = (state.activeGame === 'murder-mystery-2' || state.activeGame === 'limiteds' || state.mm2Mode || state.limitedMode);

    // Si NO estamos en modo especial, bloqueamos cualquier item especial o con rareza especial
    if (!isSpecialMode && (isSpecialItem || isSpecialRarity)) return false;

    return gOk && sOk && tOk;
  });

  // 1.5. Aplicar ordenamiento GLOBAL antes de agrupar
  filtered = sortProds(filtered);

  if (!filtered.length) {
    cat.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  // 2. Agrupación
  const grouped = {};
  filtered.forEach(p => {
    // Si no hay juego activo (vista general), agrupamos por JUEGO
    // Si hay juego activo, agrupamos por CATEGORIA (Admin) o TYPE
    const groupKey = !state.activeGame ? p.game : (p.category || p.type || 'Otros');
    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(p);
  });

  // 3. Renderizado
  let html = '';

  // Si estamos en vista general (sin juego activo), usamos los nombres de los juegos como títulos
  if (!state.activeGame) {
    GAMES.forEach(g => {
      const items = grouped[g.id] || [];
      if (!items.length) return;
      html += `
        <div class="space-y-6 mb-12">
          <div class="section-header">
            <div class="section-icon-wrap" style="background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.1);">
              ${g.image ? `<img src="${g.image}" style="width: 24px; height: 24px; object-fit: contain; border-radius: 6px;">` : `<i data-lucide="layout-grid" style="width: 20px; height: 20px; color: #3b82f6;"></i>`}
            </div>
            <div class="section-info">
              <h2 class="section-title-text">${g.label}</h2>
              <span class="section-count-badge">${items.length} productos</span>
            </div>
          </div>
          <div class="product-grid">${items.map(renderCard).join('')}</div>
        </div>`;
    });
  } else {
    // Vista de JUEGO (Categorías del admin o Type)
    const currentGame = GAMES.find(g => g.id === state.activeGame);
    const order = currentGame?.categories || [];
    
    // Ordenar las secciones según el orden del administrador
    const sortedSections = Object.keys(grouped).sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    sortedSections.forEach(section => {
      const items = grouped[section];
      const sectionIdx = sortedSections.indexOf(section);

      // Mapeo inteligente de iconos según el nombre de la categoría
      const s = section.toLowerCase();
      let iconName = 'layout-grid'; // Default

      if (s.includes('fruta')) iconName = 'apple';
      else if (s.includes('arma') || s.includes('sword') || s.includes('cuchillo') || s.includes('skin')) iconName = 'sword';
      else if (s.includes('pass') || s.includes('ticket')) iconName = 'ticket';
      else if (s.includes('gema') || s.includes('moneda') || s.includes('gem') || s.includes('currency')) iconName = 'gem';
      else if (s.includes('pet') || s.includes('mascota')) iconName = 'dog';
      else if (s.includes('item') || s.includes('objeto') || s.includes('box')) iconName = 'package';
      else if (s.includes('limited')) iconName = 'crown';

      let sectionColor = null;
      if (state.categoryIcons && state.categoryIcons[section]) {
        const mapping = state.categoryIcons[section];
        if (typeof mapping === 'string') {
          iconName = mapping;
        } else {
          iconName = mapping.icon || iconName;
          sectionColor = mapping.color;
        }
      }

      let headerIconStyle = '';
      if (sectionColor && sectionColor !== '') {
        headerIconStyle = `background: ${sectionColor}15; border-color: ${sectionColor}40; color: ${sectionColor}; box-shadow: 0 0 15px ${sectionColor}15;`;
      } else {
        const isFirstSection = sectionIdx === 0;
        headerIconStyle = isFirstSection 
          ? 'background: rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.3); color: #fb923c; box-shadow: 0 0 15px rgba(249, 115, 22, 0.1);'
          : 'background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.4);';
      }

      html += `
        <div id="section-${section.replace(/\s+/g, '-').toLowerCase()}" class="space-y-6 mb-12">
          <div class="section-header">
            <div class="section-icon-wrap" style="${headerIconStyle}">
              <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
            </div>
            <div class="section-info">
              <h2 class="section-title-text">${section}</h2>
              <span class="section-count-badge">${items.length} productos</span>
            </div>
          </div>
          <div class="product-grid">${items.map(renderCard).join('')}</div>
        </div>`;
    });
  }

    // Ejecutar Lucide para transformar los iconos nuevos
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 10);
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 100);
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 500);

  cat.innerHTML = html;
  renderSeoInfo();

  // Convertir los placeholders de i data-lucide en SVGs reales
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ===== RENDER SIDEBAR =====
function renderSidebar() {
  const list = document.getElementById('gameItemsContainer');
  const q = state.gameSearch.toLowerCase();

  // Si hay búsqueda, mostrar todos los que coincidan (incluyendo ocultos)
  // Si no hay búsqueda, mostrar los NO ocultos + los agregados manualmente
  const games = q
    ? GAMES.filter(g => g.label.toLowerCase().includes(q))
    : GAMES.filter(g => g.hidden !== true || (state.addedGames && state.addedGames.includes(g.id)));

  if (!games.length) {
    list.innerHTML = `<p class="text-white/40 text-xs text-center py-4">${q ? 'No se encontraron juegos' : 'No hay juegos listados'}</p>`;
    return;
  }

  list.innerHTML = games.map((g, idx) => {
    const activeClass = state.activeGame === g.id ? 'active' : '';
    const gid = String(g.id).toLowerCase();
    const gameIcon = (gid === 'murder-mystery-2' || gid === 'mm2') ? 'sword' : (gid === 'limiteds' ? 'crown' : 'gamepad-2');

    const isAdded = state.addedGames && state.addedGames.includes(g.id);

    return `
    <div id="game-item-${g.id}" class="game-list-item ${activeClass} group/game" 
         onclick="selectGame('${g.id}')">
      <div class="game-list-thumb">
        ${g.image ? `<img src="${g.image}" alt="${g.label}">` : `<div class="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-lg"><i data-lucide="${gameIcon}" style="width: 14px; height: 14px; color: #3b82f6;"></i></div>`}
      </div>
      <div class="flex-1 min-w-0">
        <p class="game-list-name truncate">${g.label}</p>
      </div>
      ${isAdded ? `
        <button onclick="removeGameFromSidebar(event, '${g.id}')" class="px-2 text-red-500 hover:text-red-400 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      ` : ''}
    </div>`;
  }).join('');



  setTimeout(updateSidebarIndicator, 50);
  if (window.lucide) lucide.createIcons();
}

// ===== SELECT GAME =====
function selectGame(id) {
  state.activeGame = state.activeGame === id ? null : id;
  const gid = String(id).toLowerCase();

  // Buscar juego de forma robusta
  const g = GAMES.find(x => String(x.id).toLowerCase() === gid);

  // Si es un juego oculto, mostrar aviso importante (solo una vez por sesión por juego)
  if (state.activeGame && g && g.hidden) {
    if (!state.shownImportantGames) state.shownImportantGames = [];
    if (!state.shownImportantGames.includes(id)) {
      document.getElementById('importantModal').classList.remove('hidden');
      state.shownImportantGames.push(id);
    }
  }

  const chip = document.getElementById('navGameChip');
  const tabsWrap = document.getElementById('categoryTabsWrap');

  document.querySelectorAll('.game-list-item').forEach(item => {
    item.classList.toggle('active', item.id === `game-item-${state.activeGame}`);
  });

  if (state.activeGame && g) {
    const realCount = ALL_PRODUCTS.filter(p => p.game === g.id || p.game === id).length;
    document.getElementById('navGameName').textContent = g.label;
    document.getElementById('navGameCount').textContent = realCount + ' productos';

    const thumb = document.getElementById('navGameThumb');
    const label = g.label.toLowerCase();

    if (g.image) {
      thumb.innerHTML = `<img src="${g.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;
    } else {
      let svgIcon = '';
      if (label.includes('murder') || gid.includes('mm2')) {
        svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/></svg>`;
      } else if (label.includes('limited')) {
        svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`;
      } else {
        svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><path d="M12 2a10 10 0 0 1 10 10c0 4.41-4 8-10 8s-10-3.59-10-8c0-4.41 3.59-6 10-10z"/><circle cx="12" cy="13" r="5"/></svg>`;
      }

      thumb.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-white/10 border border-white/20 rounded-lg">${svgIcon}</div>`;
    }

    chip.style.display = 'flex';
    tabsWrap.style.display = 'block';
    
    // Obtenemos las pestañas y aseguramos que "Ver Todo" sea la primera si hay categorías
    const customTabs = g.categories && g.categories.length > 0 ? g.categories : (GAME_CATEGORIES[id] || []);
    const finalTabs = customTabs.includes('Ver Todo') || customTabs.includes('Más Vendidos') 
      ? customTabs 
      : ['Ver Todo', ...customTabs];
    
    activeTab = finalTabs[0];

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  } else {
    chip.style.display = 'none';
    tabsWrap.style.display = 'none';
  }

  renderCatalog();
  renderTabs();
  updateSidebarIndicator();
}

function updateSidebarIndicator() {
  const indicator = document.getElementById('sidebar-indicator');
  const activeItem = document.querySelector('.game-list-item.active');

  if (activeItem && state.activeGame) {
    // Verificar si es un juego agregado para mover el punto
    const isAdded = state.addedGames && state.addedGames.includes(state.activeGame);
    indicator.classList.toggle('is-added-game', isAdded);

    indicator.style.opacity = '1';
    indicator.style.height = activeItem.offsetHeight + 'px';
    indicator.style.transform = `translateY(${activeItem.offsetTop}px)`;
  } else {
    indicator.style.opacity = '0';
  }
}

// ===== CART =====
function addToCart(id, e, bypassVerify = false) {
  if (e && e.stopPropagation) e.stopPropagation();

  // Buscar en la vista actual o en la lista global de productos
  let p = PRODUCTS.find(x => String(x.id) === String(id));
  if (!p) p = ALL_PRODUCTS.find(x => String(x.id) === String(id));
  if (!p) p = state.cart.find(x => String(x.id) === String(id));

  if (!p) {
    console.error('Product not found for ID:', id);
    return;
  }

  // Validación de Verificación para Juegos Ocultos
  const game = GAMES.find(g => g.id === p.game);
  const hideVerify = localStorage.getItem('pixel_store_hide_verify_modal') === 'true';

  if (game && game.hidden && !bypassVerify && !hideVerify) {
    pendingProductToAdd = { id };
    document.getElementById('verifyGameName').textContent = game.label;
    document.getElementById('verifyProductName').textContent = p.name;
    document.getElementById('verifyProductModal').classList.remove('hidden');
    return;
  }

  const existing = state.cart.find(x => String(x.id) === String(id));
  if (existing) {
    // Validar stock si no es "bajo pedido"
    if (!p.onRequest && p.stock !== undefined && p.stock !== null && existing.qty >= p.stock) {
      showToast('❌ Sin stock suficiente (' + p.stock + ' máx)');
      return;
    }
    existing.qty++;
  } else {
    // Si no existe, al menos validar que haya 1 de stock
    if (!p.onRequest && p.stock !== undefined && p.stock !== null && p.stock < 1) {
      showToast('❌ Producto agotado');
      return;
    }
    state.cart.push({ ...p, qty: 1 });
  }

  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if (card) {
    // Animación de rebote
    card.classList.remove('animate-bounce-pop'); // Por si ya la tenía de antes
    void card.offsetWidth; // Force reflow
    card.classList.add('animate-bounce-pop');
    setTimeout(() => card.classList.remove('animate-bounce-pop'), 300);

    card.classList.add('is-added');
    setTimeout(() => card.classList.remove('is-added'), 2000);
  }

  lastAddedId = id;
  updateCart();
  showToast('✓ ' + p.name + ' añadido al carrito');

  setTimeout(() => { lastAddedId = null; }, 500);
}

function decreaseQty(id, e) {
  if (e) e.stopPropagation();
  const item = state.cart.find(x => String(x.id) === String(id));
  if (!item) return;

  if (item.qty > 1) {
    item.qty--;
    updateCart();
  } else {
    removeFromCart(id, e);
  }
}

function removeFromCart(id, event) {
  if (event) event.stopPropagation();
  const targetEl = document.querySelector(`.cart-item-premium[data-id="${id}"]`);

  if (targetEl) {
    targetEl.classList.add('animate-slide-out');
    setTimeout(() => {
      state.cart = state.cart.filter(x => String(x.id) !== String(id));
      updateCart();
    }, 300);
  } else {
    state.cart = state.cart.filter(x => String(x.id) !== String(id));
    updateCart();
  }
}
function clearCart() { state.cart = []; updateCart(); }

function updateCart() {
  const cartList = document.getElementById('cartItemsList');
  const subtitle = document.getElementById('cartSubtitle');
  const empty = document.getElementById('cartEmpty');
  const footer = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartBadge = document.getElementById('cartBadge');

  const total = state.cart.reduce((s, x) => s + x.price * x.qty, 0);
  const count = state.cart.reduce((s, x) => s + x.qty, 0);

  if (cartBadge) cartBadge.textContent = count;
  if (subtitle) subtitle.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;

  if (!state.cart.length) {
    if (empty) empty.classList.remove('hidden');
    if (cartList) cartList.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  if (cartList) cartList.classList.remove('hidden');
  if (footer) footer.classList.remove('hidden');

  if (cartSubtotal) cartSubtotal.innerHTML = fmt(total);
  if (cartTotal) cartTotal.innerHTML = fmt(total);

  let html = `
    <div class="space-y-3">
      ${state.cart.map(item => {
    const pStr = fmt(item.price * item.qty);
    const animClass = (item.id === lastAddedId) ? 'animate-pop' : '';

    return `
        <div class="cart-item-premium ${animClass}" data-id="${item.id}">
          <div class="cart-item-img-wrap">
            <img src="${item.img}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="cart-item-title text-ellipsis overflow-hidden whitespace-nowrap" style="max-width:140px;">${item.name}</h4>
                <p class="cart-item-game">${item.game}</p>
              </div>
              <button onclick="removeFromCart('${item.id}', event)" class="remove-item-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div class="cart-item-footer mt-2">
              <span class="cart-item-price-total">${pStr}</span>
              <div class="cart-item-controls">
                <span class="text-[10px] text-white/20 mr-1 uppercase font-bold">Qty</span>
                <button onclick="decreaseQty('${item.id}', event)" class="control-btn minus">-</button>
                <span class="control-qty">${item.qty}</span>
                <button onclick="addToCart('${item.id}', event)" class="control-btn plus">+</button>
              </div>
            </div>
          </div>
        </div>`;
  }).join('')}
    </div>
  `;

  if (cartList) cartList.innerHTML = html;
}

function renderCurrencies() {
  const container = document.getElementById('currencyDropdown');
  if (!container) return;
  container.innerHTML = Object.keys(CURRENCY_RATES).map(code => {
    const config = CURRENCY_RATES[code];
    return `
      <button class="peek-dropdown-item ${code === currentCurrency ? 'active' : ''}" data-code="${code}">
        <img src="https://flagcdn.com/w80/${config.flag}.png" style="width:20px;height:14px;object-fit:cover;border-radius:2px;">
        <span>${code}</span>
      </button>
    `;
  }).join('');
  document.querySelectorAll('.peek-dropdown-item[data-code]').forEach(b => b.addEventListener('click', () => setCurrency(b.dataset.code)));
}

// ===== CURRENCY =====
function setCurrency(code) {
  state.currency = code;
  currentCurrency = code;
  document.getElementById('currencyLabel').textContent = code;
  const flagImg = document.getElementById('currencyFlagImg');
  if (flagImg) flagImg.src = `https://flagcdn.com/w80/${CURRENCY_RATES[code].flag}.png`;

  renderCurrencies();
  renderCatalog();
  updateCart();
  document.getElementById('currencyDropdown').classList.add('hidden');
}

// ===== DROPDOWNS =====
document.getElementById('notifBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('currencyDropdown').classList.add('hidden');
  document.getElementById('sortDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.toggle('hidden');
});
document.getElementById('currencyBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('sortDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.add('hidden');
  document.getElementById('currencyDropdown').classList.toggle('hidden');
});
document.getElementById('sortBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('currencyDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.add('hidden');
  document.getElementById('sortDropdown').classList.toggle('hidden');
});
// ===== MESSAGE LISTENER (From React Parent) =====
window.addEventListener('message', (event) => {
  if (event.data?.action === 'syncAuth') {
    state.user = event.data.user;
    state.notifications = event.data.notifications || [];
    renderUserUI();
    renderNotifications();
  }
});

function renderUserUI() {
  const avatarBtn = document.querySelector('.peek-avatar-btn');
  const nameLabel = document.getElementById('dropdownUserName');
  const emailLabel = document.getElementById('dropdownUserEmail');
  const avatarImg = document.getElementById('dropdownUserAvatar');

  if (!avatarBtn) return;

  if (state.user) {
    // Priority: use provided avatar URL
    let avatarUrl = state.user.avatar;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${SERVER_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
    }

    if (avatarUrl) {
      avatarBtn.innerHTML = `<img src="${avatarUrl}" class="w-full h-full object-cover">`;
      if (avatarImg) avatarImg.src = avatarUrl;
    } else {
      avatarBtn.innerHTML = `<span>${(state.user.username || 'U').charAt(0).toUpperCase()}</span>`;
      if (avatarImg) avatarImg.src = 'images/avatar.png';
    }

    avatarBtn.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)';
    avatarBtn.style.border = '2px solid rgba(255,255,255,0.1)';

    if (nameLabel) nameLabel.textContent = state.user.displayName || state.user.username;
    if (emailLabel) emailLabel.textContent = state.user.email || 'email@example.com';

    avatarBtn.onclick = (e) => {
      e.stopPropagation();
      document.getElementById('notifDropdown').classList.add('hidden');
      document.getElementById('currencyDropdown').classList.add('hidden');
      document.getElementById('sortDropdown').classList.add('hidden');
      document.getElementById('userDropdown').classList.toggle('hidden');
    };
  } else {
    avatarBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white/20"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    avatarBtn.style.background = 'rgba(255,255,255,0.03)';
    avatarBtn.style.border = '1px solid rgba(255,255,255,0.05)';
    avatarBtn.onclick = () => window.parent.postMessage({ action: 'login' }, '*');
  }
}

function renderNotifications() {
  const badge = document.querySelector('.peek-notif-badge');
  const container = document.querySelector('#notifDropdown .space-y-1');
  if (!badge || !container) return;

  badge.textContent = state.notifications.length;
  badge.style.display = state.notifications.length > 0 ? 'flex' : 'none';

  // Actualizar contadores de las pestañas
  const allBadge = document.querySelector('.notif-tab[data-tab="all"] .notif-tab-badge');
  const ordersBadge = document.querySelector('.notif-tab[data-tab="orders"] .notif-tab-badge');
  const chatsBadge = document.querySelector('.notif-tab[data-tab="chats"] .notif-tab-badge');

  if (allBadge) allBadge.textContent = state.notifications.length;
  if (ordersBadge) {
    const orderCount = state.notifications.filter(n => n.type === 'orders' || n.type === 'order').length;
    ordersBadge.textContent = orderCount;
    ordersBadge.style.display = orderCount > 0 ? 'flex' : 'none';
  }
  if (chatsBadge) {
    const chatCount = state.notifications.filter(n => n.type === 'chats' || n.type === 'chat').length;
    chatsBadge.textContent = chatCount;
    chatsBadge.style.display = chatCount > 0 ? 'flex' : 'none';
  }

  // Filtrar según pestaña activa
  const filtered = state.notifications.filter(n => {
    if (state.activeNotifTab === 'all') return true;
    if (state.activeNotifTab === 'orders') return (n.type === 'orders' || n.type === 'order');
    if (state.activeNotifTab === 'chats') return (n.type === 'chats' || n.type === 'chat');
    return n.type === state.activeNotifTab;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-white/20 text-[11px] text-center py-8">No hay notificaciones aquí</p>';
    return;
  }

  container.innerHTML = filtered.map(n => `
    <div class="notif-item group">
      <div class="notif-dot ${n.type === 'orders' || n.type === 'order' ? 'bg-emerald-400' : (n.type === 'chats' || n.type === 'chat' ? 'bg-blue-400' : 'bg-white/20')}"></div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start gap-2">
          <h4 class="notif-title group-hover:text-blue-400 transition-colors">${n.title}</h4>
          <span class="notif-time text-[9px] opacity-30 font-bold uppercase tracking-tight">${n.time}</span>
        </div>
        <p class="notif-desc text-white/40 group-hover:text-white/60 transition-colors">${n.desc}</p>
      </div>
    </div>
  `).join('');
}

// Logic to clear all notifications
document.getElementById('clearNotifsBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  state.notifications = [];
  renderNotifications();
  // Optional: Notify parent if needed
  window.parent.postMessage({ action: 'clearNotifications' }, '*');
});

document.addEventListener('click', () => {
  const drops = ['currencyDropdown', 'sortDropdown', 'notifDropdown', 'userDropdown'];
  drops.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
});
document.querySelectorAll('.peek-dropdown-item[data-sort]').forEach(b => b.addEventListener('click', (e) => {
  const sortValue = b.getAttribute('data-sort');
  if (!sortValue) return;

  state.sort = sortValue;
  document.getElementById('sortLabel').textContent = b.textContent;

  document.querySelectorAll('.peek-dropdown-item[data-sort]').forEach(x => x.classList.remove('active'));
  b.classList.add('active');

  document.getElementById('sortDropdown').classList.add('hidden');

  // Forzar re-renderizado
  setTimeout(() => renderCatalog(), 10);
}));

// Notification Tabs Logic
document.querySelectorAll('.notif-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeNotifTab = tab.dataset.tab;
    renderNotifications();
  });
});

// ===== SEARCH =====
document.getElementById('searchInput').addEventListener('input', e => { state.search = e.target.value; renderCatalog(); });
window.clearSearch = function () { state.search = ''; document.getElementById('searchInput').value = ''; renderCatalog(); };

// ===== GAME SEARCH =====
document.getElementById('gameSearch').addEventListener('input', e => { state.gameSearch = e.target.value; renderSidebar(); });

// Botón "Otro juego" - Búsqueda dinámica global
const otroJuegoBtn = document.getElementById('otroJuegoBtn');
const otroJuegoSearchWrap = document.getElementById('otroJuegoSearchWrap');
const otroJuegoInput = document.getElementById('otroJuegoInput');
const otroJuegoResults = document.getElementById('otroJuegoResults');

if (otroJuegoBtn) {
  otroJuegoBtn.addEventListener('click', () => {
    otroJuegoSearchWrap.classList.toggle('hidden');
    otroJuegoResults.classList.toggle('hidden');
    if (!otroJuegoSearchWrap.classList.contains('hidden')) {
      otroJuegoInput.focus();
    }
  });
}

if (otroJuegoInput) {
  otroJuegoInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) {
      otroJuegoResults.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-[11px] font-bold text-white/20 uppercase tracking-widest">Escribe para buscar</p>
        </div>
      `;
      return;
    }

    const filtered = GAMES.filter(g => g.hidden === true && g.label.toLowerCase().includes(q));

    if (filtered.length === 0) {
      otroJuegoResults.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-[11px] font-bold text-white/20 uppercase tracking-widest">No se encontraron resultados</p>
        </div>
      `;
      return;
    }

    otroJuegoResults.innerHTML = filtered.map((g, idx) => {
      const gid = String(g.id).toLowerCase();
      const gameIcon = (gid === 'murder-mystery-2' || gid === 'mm2') ? 'sword' : (gid === 'limiteds' ? 'crown' : 'gamepad-2');
      const gameImg = g.image ? (g.image.startsWith('http') ? g.image : `${SERVER_URL}${g.image}`) : '';

      return `
        <div class="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-all border-b border-white/[0.03] group jelly-item" 
             style="animation-delay: ${idx * 0.05}s"
             onclick="addGameToSidebar('${g.id}')">
          <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
            ${gameImg ? `<img src="${gameImg}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-white/20"><i data-lucide="${gameIcon}" style="width:16px;height:16px"></i></div>`}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-bold text-white truncate">${g.label}</p>
          </div>
          <div class="text-white/20 group-hover:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  });
}

function addGameToSidebar(gameId) {
  if (!state.addedGames) state.addedGames = [];
  if (!state.addedGames.includes(gameId)) {
    state.addedGames.push(gameId);
    saveAddedGames();
  }

  // Limpiar y ocultar buscador
  otroJuegoInput.value = '';
  otroJuegoSearchWrap.classList.add('hidden');
  otroJuegoResults.classList.add('hidden');
  otroJuegoResults.innerHTML = `
    <div class="p-4 text-center">
      <p class="text-[11px] font-bold text-white/20 uppercase tracking-widest">Escribe para buscar</p>
    </div>
  `;

  renderSidebar();
  selectGame(gameId);
}
window.addGameToSidebar = addGameToSidebar;

function removeGameFromSidebar(e, gameId) {
  if (e) e.stopPropagation();
  if (!state.addedGames) return;
  state.addedGames = state.addedGames.filter(id => id !== gameId);
  saveAddedGames();
  renderSidebar();

  // Si era el juego activo, ir al primero disponible
  if (state.activeGame === gameId) {
    const firstGame = GAMES.find(g => g.hidden !== true);
    if (firstGame) selectGame(firstGame.id);
  }
}
window.removeGameFromSidebar = removeGameFromSidebar;

function saveAddedGames() {
  localStorage.setItem('pixel_store_added_games', JSON.stringify(state.addedGames || []));
}

function loadAddedGames() {
  const saved = localStorage.getItem('pixel_store_added_games');
  if (saved) {
    state.addedGames = JSON.parse(saved);
  }
}

// Modales de Verificación
let pendingProductToAdd = null;

window.closeImportantModal = function () {
  document.getElementById('importantModal').classList.add('hidden');
};

window.closeVerifyProductModal = function (confirm) {
  const modal = document.getElementById('verifyProductModal');
  const dontShow = document.getElementById('dontShowVerifyAgain').checked;

  if (dontShow) {
    localStorage.setItem('pixel_store_hide_verify_modal', 'true');
  }

  modal.classList.add('hidden');

  if (confirm && pendingProductToAdd) {
    addToCart(pendingProductToAdd.id, pendingProductToAdd.variationId, true);
  }
  pendingProductToAdd = null;
};

// ===== CHECKOUT MODAL LOGIC =====
window.openCheckoutModal = function () {
  if (state.cart.length === 0) {
    showToast('❌ Tu carrito está vacío');
    return;
  }

  // Detectamos si hay items especiales para decidir si mandamos al checkout de React
  const hasMM2 = state.cart.some(item => String(item.game).toLowerCase().includes('mm2') || String(item.game).toLowerCase().includes('murder mystery'));
  const hasLimiteds = state.cart.some(item => String(item.game).toLowerCase().includes('limited'));

  // Siempre mandamos al checkout de React para usar el nuevo diseño
  const checkoutData = {
    action: 'checkout',
    user: selectedUser || { name: '', id: '' }, // Enviamos el usuario si ya lo seleccionó en la tienda
    cart: state.cart,
    total: state.cart.reduce((s, x) => s + (x.price * CURRENCY_RATES[state.currency].rate * x.qty), 0),
    currency: state.currency
  };

  window.parent.postMessage(checkoutData, '*');
};

window.closeCheckoutModal = function () {
  document.getElementById('checkoutModal').classList.add('hidden');
  selectedUser = null;
  updateConfirmButton();
  document.getElementById('userSearchResults').classList.add('hidden');
  document.getElementById('userSearchResults').innerHTML = '';
  document.getElementById('robloxUserInput').value = '';
  document.getElementById('userSearchStatus').textContent = 'Busca y selecciona tu usuario para continuar';
};

document.getElementById('robloxUserInput').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  const resultsDiv = document.getElementById('userSearchResults');
  const status = document.getElementById('userSearchStatus');

  clearTimeout(searchTimeout);

  if (q.length < 3) {
    resultsDiv.classList.add('hidden');
    status.textContent = 'Escribe al menos 3 caracteres...';
    return;
  }

  status.textContent = 'Buscando usuario...';

  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/users/search?username=${q}`);
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        resultsDiv.innerHTML = data.data.map(user => {
          // Usar el proxy de avatar del servidor para evitar fallos si no viene avatarUrl
          const avatar = `${SERVER_URL}/api/users/avatar/${user.id}`;
          return `
            <div class="user-result-item" onclick="selectRobloxUser('${user.id}', '${user.name}', '${user.displayName}')">
              <img src="${avatar}" class="user-result-avatar" alt="" onerror="this.src='https://ui-avatars.com/api/?name=${user.name}&background=random'">
              <div>
                <p class="text-sm font-bold text-white">${user.displayName}</p>
                <p class="text-[10px] text-white/30">@${user.name}</p>
              </div>
            </div>
          `;
        }).join('');
        resultsDiv.classList.remove('hidden');
        status.textContent = 'Selecciona tu usuario de la lista';
      } else {
        resultsDiv.classList.add('hidden');
        status.textContent = 'No se encontró ningún usuario';
      }
    } catch (err) {
      status.textContent = 'Error al buscar usuario';
    }
  }, 500);
});

window.selectRobloxUser = function (id, name, displayName) {
  selectedUser = { id, name, displayName };

  const resultsDiv = document.getElementById('userSearchResults');
  const avatarUrl = `${SERVER_URL}/api/users/avatar/${id}`;

  resultsDiv.innerHTML = `
    <div class="user-result-item selected">
      <img src="${avatarUrl}" class="user-result-avatar" alt="" onerror="this.src='https://ui-avatars.com/api/?name=${name}&background=random'">
      <div>
        <p class="text-sm font-bold text-white">${displayName}</p>
        <p class="text-[10px] text-white/30">@${name}</p>
      </div>
      <div class="ml-auto text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </div>
  `;

  document.getElementById('userSearchStatus').textContent = '¡Usuario seleccionado correctamente!';
  updateConfirmButton();

  // Save to recent
  saveRecentUser({
    name,
    id,
    avatar: avatarUrl
  });
};

function updateConfirmButton() {
  const btn = document.getElementById('confirmCheckoutBtn');
  if (selectedUser) {
    btn.disabled = false;
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Confirmar y Pagar
    `;
    btn.onclick = confirmCheckout;
  } else {
    btn.disabled = true;
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="m12 16 4-4-4-4"/></svg>
      Selecciona tu usuario
    `;
    btn.onclick = null;
  }
}

function confirmCheckout() {
  if (!selectedUser) return;

  const checkoutData = {
    action: 'checkout',
    user: selectedUser,
    cart: state.cart,
    total: state.cart.reduce((s, x) => s + (x.price * CURRENCY_RATES[state.currency].rate * x.qty), 0),
    currency: state.currency
  };

  window.parent.postMessage(checkoutData, '*');
}

// ===== TRADE MODAL LOGIC (REDESIGN COMPACT) =====
window.openTradeModal = function (productId) {
  tradeTargetProduct = PRODUCTS.find(p => String(p.id) === String(productId));

  currentTradeStep = 1;
  tradeSelectedUser = null;
  tradeSelectedInventoryItem = null;
  tradeInventoryItems = [];

  document.getElementById('tradeModal').classList.remove('hidden');
  updateTradeStepUI();

  // Reset Step 1
  document.getElementById('tradeRobloxInput').value = '';
  document.getElementById('tradeSearchResults').innerHTML = '';
  setTimeout(() => document.getElementById('tradeRobloxInput').focus(), 100);
};

window.closeTradeModal = function () {
  document.getElementById('tradeModal').classList.add('hidden');
};

function updateTradeStepUI() {
  const track = document.getElementById('step-track');
  const icons = [1, 2, 3].map(i => document.getElementById(`step-icon-${i}`));
  const title = document.getElementById('trade-modal-title');
  const desc = document.getElementById('trade-modal-desc');
  const nextBtnText = document.getElementById('trade-btn-text');
  const nextBtn = document.getElementById('trade-next-btn');
  const backBtn = document.getElementById('trade-back-btn');

  // Hide all steps
  document.getElementById('trade-step-1').classList.add('hidden');
  document.getElementById('trade-step-2').classList.add('hidden');
  document.getElementById('trade-step-3').classList.add('hidden');

  // Show active step
  document.getElementById(`trade-step-${currentTradeStep}`).classList.remove('hidden');

  icons.forEach((icon, idx) => {
    icon.classList.remove('active', 'completed');
    if (idx + 1 < currentTradeStep) icon.classList.add('completed');
    if (idx + 1 === currentTradeStep) icon.classList.add('active');
  });

  // Update track width
  const progress = ((currentTradeStep - 1) / 2) * 100;
  track.style.width = `${progress}%`;

  if (currentTradeStep === 1) {
    title.innerText = 'Verificación';
    desc.innerText = 'Busca tu usuario de Roblox para continuar';

    const searchView = document.getElementById('trade-search-view');
    const confirmView = document.getElementById('trade-confirm-view');

    if (tradeSelectedUser) {
      searchView.classList.add('hidden');
      confirmView.classList.remove('hidden');
      backBtn.classList.remove('hidden'); // Show back button to return to search

      document.getElementById('step1-user-card').innerHTML = `
        <div class="user-result-item !bg-white/5 !border-white/10 !p-5">
          <img src="${tradeSelectedUser.avatarUrl}" class="user-result-avatar !size-14" alt="">
          <div class="flex-1">
            <p class="text-[10px] text-white/20 font-black uppercase tracking-widest">Cuenta Encontrada</p>
            <p class="text-base font-bold text-white">${tradeSelectedUser.displayName || tradeSelectedUser.name}</p>
            <p class="text-xs text-white/40">@${tradeSelectedUser.name}</p>
          </div>
          <div class="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
        </div>
      `;
      nextBtnText.innerText = 'Continuar';
      nextBtn.disabled = false;
    } else {
      searchView.classList.remove('hidden');
      confirmView.classList.add('hidden');
      backBtn.classList.add('hidden');
      nextBtnText.innerText = 'Selecciona un usuario';
      nextBtn.disabled = true;
    }
  } else if (currentTradeStep === 2) {
    title.innerText = 'Seleccionar Item';
    desc.innerText = 'Selecciona un item para el trade';
    nextBtnText.innerText = tradeSelectedInventoryItem ? 'Continuar' : 'Selecciona un item';
    nextBtn.disabled = !tradeSelectedInventoryItem;

    if (tradeSelectedUser) {
      document.getElementById('trade-selected-user-card').innerHTML = `
        <div class="user-result-item">
          <img src="${tradeSelectedUser.avatarUrl}" class="user-result-avatar" alt="">
          <div class="flex-1">
            <p class="text-[10px] text-white/20 font-black uppercase tracking-widest">Cuenta Encontrada</p>
            <p class="text-sm font-bold text-white">${tradeSelectedUser.displayName || tradeSelectedUser.name}</p>
            <p class="text-[11px] text-white/40">@${tradeSelectedUser.name}</p>
          </div>
          <div class="verified-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M20 6 9 17l-5-5"/></svg>
            Verificado
          </div>
        </div>
      `;
    }
  } else if (currentTradeStep === 3) {
    title.innerText = 'Confirmar Compra';

    // Forzamos PEN para el trade si está disponible
    const tradeCurrency = CURRENCY_RATES['PEN'] ? 'PEN' : state.currency;
    const totalUSD = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);

    desc.innerText = `Total: ${fmtByCurr(totalUSD, tradeCurrency)}`;
    nextBtnText.innerText = 'Confirmar y Pagar';
    nextBtn.disabled = false;

    if (tradeSelectedUser) {
      document.getElementById('final-user-card').innerHTML = `
        <div class="user-result-item !bg-white/5 !p-4">
          <img src="${tradeSelectedUser.avatarUrl}" class="user-result-avatar" alt="">
          <div class="flex-1">
            <p class="text-sm font-bold text-white">${tradeSelectedUser.displayName || tradeSelectedUser.name}</p>
            <p class="text-[11px] text-white/40">@${tradeSelectedUser.name}</p>
          </div>
        </div>
      `;
    }

    if (state.cart.length > 0) {
      const mainItem = state.cart[0];
      document.getElementById('final-buy-name').innerText = state.cart.length > 1 ? `${mainItem.name} + ${state.cart.length - 1} más` : mainItem.name;
      document.getElementById('final-buy-img').innerHTML = `<img src="${mainItem.img}" alt="">`;
      document.getElementById('final-buy-price').innerText = fmtByCurr(totalUSD, tradeCurrency);

      document.getElementById('final-subtotal').innerText = fmtByCurr(totalUSD, tradeCurrency);
      document.getElementById('final-total').innerText = formatPrice(totalUSD * (CURRENCY_RATES[tradeCurrency]?.rate || 1));
      document.getElementById('final-currency').innerText = tradeCurrency;
    }

    if (tradeSelectedInventoryItem) {
      document.getElementById('final-trade-name').innerText = tradeSelectedInventoryItem.name;
      document.getElementById('final-trade-img').innerHTML = `<img src="${tradeSelectedInventoryItem.thumbnail}" alt="">`;
      document.getElementById('final-trade-rap').innerText = `RAP: ${formatPrice(tradeSelectedInventoryItem.recentAveragePrice || 0)}`;
    }
  }
}

window.tradeNextStep = function () {
  if (currentTradeStep === 1 && tradeSelectedUser) {
    currentTradeStep = 2;
    fetchUserInventory();
  } else if (currentTradeStep === 2 && tradeSelectedInventoryItem) {
    currentTradeStep = 3;
    prepareTradeConfirmation();
  } else if (currentTradeStep === 3) {
    confirmTrade();
  }
  updateTradeStepUI();
};

window.tradePrevStep = function tradePrevStep() {
  if (currentTradeStep === 1) {
    // Si estamos en el paso 1 y hay un usuario seleccionado, "Atrás" vuelve a la búsqueda
    tradeSelectedUser = null;
    updateTradeStepUI();
    return;
  }
  if (currentTradeStep > 1) {
    currentTradeStep--;
    updateTradeStepUI();
  }
};

// Step 1: User Search for Trade
document.getElementById('tradeRobloxInput').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  const resultsDiv = document.getElementById('tradeSearchResults');
  const status = document.getElementById('tradeSearchStatus');

  clearTimeout(searchTimeout);
  if (q.length < 3) {
    resultsDiv.innerHTML = '';
    status.textContent = 'Escribe al menos 3 caracteres...';
    return;
  }

  if (status) status.textContent = 'Buscando usuario...';
  resultsDiv.innerHTML = `
      <div class="py-10 flex flex-col items-center gap-3">
        <div class="size-8 rounded-full border-2 border-white/5 border-t-blue-500 animate-spin"></div>
        <p class="text-[10px] text-white/20 font-black uppercase tracking-widest">Buscando usuario...</p>
      </div>
    `;

  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/users/search?username=${q}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        resultsDiv.innerHTML = data.data.map(user => {
          const avatar = `${SERVER_URL}/api/users/avatar/${user.id}`;
          return `
            <div class="user-result-item" onclick="selectTradeUser('${user.id}', '${user.name}', '${user.displayName}')">
              <img src="${avatar}" class="user-result-avatar" alt="" onerror="this.src='https://ui-avatars.com/api/?name=${user.name}&background=random'">
              <div class="flex-1">
                <p class="text-sm font-bold text-white">${user.displayName}</p>
                <p class="text-[10px] text-white/30">@${user.name}</p>
              </div>
              <svg class="text-white/10" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          `;
        }).join('');
        if (status) status.textContent = 'Selecciona tu perfil';
      } else {
        resultsDiv.innerHTML = '';
        if (status) status.textContent = 'Usuario no encontrado';
      }
    } catch (err) {
      resultsDiv.innerHTML = '';
      if (status) status.textContent = 'Error de conexión';
    }
  }, 500);
});

window.selectTradeUser = function (id, name, displayName) {
  const avatarUrl = `${SERVER_URL}/api/users/avatar/${id}`;
  tradeSelectedUser = { id, name, displayName, avatarUrl };
  updateTradeStepUI();

  // Save to recent
  saveRecentUser({ name, id, avatar: avatarUrl });
};

// Step 2: Inventory
async function fetchUserInventory() {
  const grid = document.getElementById('tradeInventoryGrid');
  const empty = document.getElementById('tradeInventoryEmpty');
  const countLabel = document.getElementById('user-inv-count');

  grid.innerHTML = '<div class="col-span-full py-10 flex flex-col items-center gap-3"><div class="size-8 rounded-full border-2 border-white/5 border-t-blue-500 animate-spin"></div><p class="text-[10px] text-white/30 font-black uppercase tracking-widest">Consultando Inventario...</p></div>';
  empty.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE_URL}/users/${tradeSelectedUser.id}/collectibles`);
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      tradeInventoryItems = data.data;
      countLabel.textContent = `${data.data.length} Items`;
      grid.innerHTML = data.data.map(item => `
        <div class="inv-item-card" onclick="selectTradeItem('${item.assetId}')" data-asset-id="${item.assetId}">
          <div class="inv-item-img">
            <img src="${item.thumbnail}" alt="">
          </div>
          <p class="inv-item-name">${item.name}</p>
          <div class="inv-item-rap">
            <span class="text-[9px] opacity-40">VALOR ESTIMADO</span>
            <span class="ml-1">${item.recentAveragePrice?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      countLabel.textContent = '0 Items';
    }
  } catch (err) {
    grid.innerHTML = '<p class="col-span-full text-center text-red-400 text-xs py-10">Error al cargar el inventario</p>';
  }
}

window.selectTradeItem = function (assetId) {
  tradeSelectedInventoryItem = tradeInventoryItems.find(i => String(i.assetId) === String(assetId));
  document.querySelectorAll('.inv-item-card').forEach(el => {
    el.classList.toggle('active', el.dataset.assetId === String(assetId));
  });
  updateTradeStepUI();
};

// Step 3: Confirmation
function prepareTradeConfirmation() {
  document.getElementById('final-buy-img').innerHTML = `<img src="${tradeTargetProduct.img}" class="size-full object-contain">`;
  document.getElementById('final-buy-name').textContent = tradeTargetProduct.name;

  document.getElementById('final-trade-img').innerHTML = `<img src="${tradeSelectedInventoryItem.thumbnail}" class="size-full object-contain">`;
  document.getElementById('final-trade-name').textContent = tradeSelectedInventoryItem.name;

  // Limpiamos cualquier rastro de robux en el rap de confirmación
  const rapEl = document.getElementById('final-trade-rap');
  if (rapEl) {
    rapEl.innerText = `RAP: ${tradeSelectedInventoryItem.recentAveragePrice?.toLocaleString() || 'N/A'}`;
  }
}

function confirmTrade() {
  const tradeCurrency = CURRENCY_RATES['PEN'] ? 'PEN' : state.currency;
  const rate = CURRENCY_RATES[tradeCurrency]?.rate || 1;
  const totalUSD = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const totalFinal = totalUSD * rate;

  const tradeData = {
    action: 'checkout',
    user: tradeSelectedUser,
    tradeItem: tradeSelectedInventoryItem,
    targetItem: tradeTargetProduct,
    type: 'trade_limited',
    total: totalFinal,
    currency: tradeCurrency,
    cart: state.cart
  };

  window.parent.postMessage(tradeData, '*');
  closeTradeModal();
  showToast('✓ Solicitud de intercambio enviada');
}

// ===== INIT =====
initApp();

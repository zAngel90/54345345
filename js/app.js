// ===== CONFIG =====
const API_BASE_URL = 'https://arrives-tcp-lead-talk.trycloudflare.com/api';
const SERVER_URL = 'https://arrives-tcp-lead-talk.trycloudflare.com';

let CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1, flag: 'us' },
  COP: { symbol: '$', rate: 4000, flag: 'co' }
};
let currentCurrency = 'USD';

async function fetchCurrencies() {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/currencies-config`);
    const data = await res.json();
    if (data.success && data.data) {
      const activeCurrencies = data.data.filter(c => c.active);
      CURRENCY_RATES = {};
      activeCurrencies.forEach(c => {
        CURRENCY_RATES[c.code] = {
          symbol: c.symbol,
          rate: c.rate,
          flag: c.flag
        };
      });
      if (!CURRENCY_RATES[currentCurrency]) {
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
let PRODUCTS = [];
let GAME_CATEGORIES = {};
let state={currency:'USD',sort:'popular',activeGame:null,search:'',cart:[],gameSearch:''};
let lastAddedId = null;
let selectedUser = null;
let searchTimeout = null;

// ===== INITIALIZATION =====
async function initApp() {
  try {
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
        img: g.image ? (g.image.startsWith('http') ? g.image : `${SERVER_URL}${g.image}`) : '',
        count: g.items ? g.items.split(' ')[0] : 0
      }));
    }

    const prodsData = await prodsRes.json();
    PRODUCTS = prodsData.map(p => ({
      ...p,
      purchases: Math.floor(Math.random() * 1000) + 100,
      img: p.image ? (p.image.startsWith('http') ? p.image : `${SERVER_URL}${p.image}`) : ''
    }));

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

    // 4. Renderizar sidebar
    renderSidebar();

    // 5. Detectar juego por URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    if (gameId && GAMES.some(g => g.id === gameId)) {
      selectGame(gameId);
    } else if (GAMES.length > 0) {
      selectGame(GAMES[0].id);
    }

    updateCart();
    renderCatalog();
  } catch (err) {
    console.error('Error initializing app:', err);
  }
}

// ===== HELPERS =====
function fmt(p){const c=CURRENCY_RATES[state.currency];const v=p*c.rate;return c.symbol+(v>=1000?v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):v.toFixed(2))+' '+state.currency;}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
function badgeClass(badge,rarity){if(badge==='hot')return'badge-hot';if(badge==='new')return'badge-new';if(badge==='trending')return'badge-trending';if(rarity==='Mythic')return'badge-mythic';if(rarity==='Legendary')return'badge-legendary';if(rarity==='Epic')return'badge-epic';return'badge-rare';}
function badgeLabel(badge,rarity){if(badge==='hot')return'HOT';if(badge==='new')return'NEW';if(badge==='trending')return'TOP';return (rarity||'ITEM').toUpperCase();}
function sortProds(arr){const s=[...arr];if(state.sort==='popular')return s.sort((a,b)=>b.purchases-a.purchases);if(state.sort==='priceAsc')return s.sort((a,b)=>a.price-b.price);if(state.sort==='priceDesc')return s.sort((a,b)=>b.price-a.price);if(state.sort==='nameAsc')return s.sort((a,b)=>a.name.localeCompare(b.name));if(state.sort==='nameDesc')return s.sort((a,b)=>a.name.localeCompare(b.name));return s;}

// ===== RENDER CARD =====
function getRarityColor(rarity){
  const colors = {
    'Mythic': '#2a1a0a',    
    'Legendary': '#0f1225', 
    'Epic': '#121826',      
    'Rare': '#0a1a12',      
    'Uncommon': '#1a1c20',
    'Common': '#1a1c20'
  };
  return colors[rarity] || '#1a1c20';
}

function renderCard(p){
  const pd = {
    main: (p.price * CURRENCY_RATES[state.currency].rate).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    curr: state.currency
  };
  const badgeHtml=p.badge?`<span class="card-badge-el ${badgeClass(p.badge,p.rarity)}">${badgeLabel(p.badge,p.rarity)}</span>`:'';
  const bgColor = getRarityColor(p.rarity);
  const borderCol = p.rarity === 'Mythic' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)';

  return `<div class="product-card" data-id="${p.id}" onclick="addToCart('${p.id}',event)" style="background: ${bgColor} !important; border-color: ${borderCol}">
    <div class="added-overlay">
      <div class="check-circle">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </div>
    <div class="card-img-wrap" style="background: transparent">
      ${badgeHtml}
      <img src="${p.img}" alt="${p.name}" loading="lazy">
    </div>
    <div class="card-info" style="background: rgba(0,0,0,0.25)">
      <h3 class="card-title">${p.name}</h3>
      <p class="card-category">${p.category||p.rarity||'Item'}</p>
      <div class="card-price-row">
        <div class="price-box">
          <span class="card-price">${pd.main}</span>
          <span class="card-currency">${pd.curr}</span>
        </div>
        <button class="card-cart-btn" onclick="addToCart('${p.id}',event)">
          <svg class="cart-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span class="plus-icon">+</span>
        </button>
      </div>
    </div>
  </div>`;
}

// ===== CATEGORY TABS =====
let activeTab='Más Vendidos';

function renderTabs(){
  const el=document.getElementById('categoryTabs');
  if(!el)return;
  if(!state.activeGame){el.innerHTML='';return;}
  const tabs=GAME_CATEGORIES[state.activeGame]||['Más Vendidos','Productos'];
  el.innerHTML=tabs.map(t=>`<button class="category-tab ${t===activeTab?'active':''}" onclick="selectTab('${t}')">${t}</button>`).join('');
}
window.selectTab=function(t){
  activeTab=t;
  renderTabs();
  renderCatalog();
};

// ===== RENDER CATALOG =====
function getGameIcon(id, type = null){
  const icons = {
    'blox-fruits': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 2 2 7-7-2-2"/></svg>`,
    'mm2': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.7c-4.2-1.1-9.1-3.1-13-3.7l2.1-4.7c4.4 1 10.1 3.2 13.9 4.4l-3 4z"/></svg>`,
    'pet-sim': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.42 11.42 2 13.172 2h7.656C22.58 2 24 3.42 24 5.172v7.656C24 14.58 22.58 16 20.828 16h-7.656C11.42 16 10 14.58 10 12.828V5.172Z"/></svg>`,
    'adopt-me': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    'rivals': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/></svg>`,
    'Fruits': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 11 6a7 7 0 0 1 0 14Zm0-11v5m-3-2h6"/></svg>`,
    'Gamepasses': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    'Cajas': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    'Keys': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z"/></svg>`,
    'Ancient': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z"/></svg>`,
    'Guns': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/></svg>`,
    'Huge Pets': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.42 11.42 2 13.172 2h7.656C22.58 2 24 3.42 24 5.172v7.656C24 14.58 22.58 16 20.828 16h-7.656C11.42 16 10 14.58 10 12.828V5.172Z"/></svg>`
  };
  return icons[type] || icons[id] || `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
}

function renderCatalog(){
  const cat=document.getElementById('catalogContent');
  const empty=document.getElementById('emptyState');
  
  cat.classList.remove('animate-fade-in');
  void cat.offsetWidth; 
  cat.classList.add('animate-fade-in');

  let filtered=PRODUCTS.filter(p=>{
    const gOk=state.activeGame?p.game===state.activeGame:true;
    const sOk=state.search?p.name.toLowerCase().includes(state.search.toLowerCase()):true;
    const tOk=activeTab==='Más Vendidos'?true:(p.category===activeTab);
    return gOk&&sOk&&tOk;
  });

  if(!filtered.length){
    cat.innerHTML='';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  let html='';
  if(!state.activeGame){
    GAMES.forEach(g=>{
      const items=sortProds(filtered.filter(p=>p.game===g.id));
      if(!items.length)return;
      html+=`<div class="space-y-6 mb-10">
        <div class="section-header">
          <div class="section-icon-wrap">${getGameIcon(g.id)}</div>
          <div class="section-info">
            <h2 class="section-title-text">${g.label}</h2>
            <span class="section-count-badge">${items.length} productos disponibles</span>
          </div>
        </div>
        <div class="product-grid">${items.map(renderCard).join('')}</div>
      </div>`;
    });
  } else {
    const grouped = {};
    filtered.forEach(p => {
      const t = p.type || 'Otros';
      if(!grouped[t]) grouped[t] = [];
      grouped[t].push(p);
    });

    Object.keys(grouped).forEach(type => {
      const items = sortProds(grouped[type]);
      html += `<div class="space-y-6 mb-10">
        <div class="section-header">
          <div class="section-icon-wrap">${getGameIcon(state.activeGame, type)}</div>
          <div class="section-info">
            <h2 class="section-title-text">${type}</h2>
            <span class="section-count-badge">${items.length} productos disponibles</span>
          </div>
        </div>
        <div class="product-grid">${items.map(renderCard).join('')}</div>
      </div>`;
    });
  }
  cat.innerHTML=html;
}

// ===== RENDER SIDEBAR =====
function renderSidebar(){
  const list=document.getElementById('gameItemsContainer');
  const q=state.gameSearch.toLowerCase();
  const games=q?GAMES.filter(g=>g.label.toLowerCase().includes(q)):GAMES;
  if(!games.length){list.innerHTML='<p class="text-white/40 text-xs text-center py-4">No se encontraron juegos</p>';return;}
  
  list.innerHTML=games.map((g, idx)=>`
    <div id="game-item-${g.id}" class="game-list-item ${state.activeGame===g.id?'active':''}" 
         onclick="selectGame('${g.id}')">
      <div class="game-list-thumb">
        <img src="${g.img}" alt="${g.label}">
      </div>
      <div>
        <p class="game-list-name">${g.label}</p>
      </div>
    </div>`).join('');
    
    setTimeout(updateSidebarIndicator, 50);
}

// ===== SELECT GAME =====
function selectGame(id){
  state.activeGame = state.activeGame === id ? null : id;
  const g = GAMES.find(x => x.id === id);
  const chip = document.getElementById('navGameChip');
  const tabsWrap = document.getElementById('categoryTabsWrap');

  document.querySelectorAll('.game-list-item').forEach(item => {
    item.classList.toggle('active', item.id === `game-item-${state.activeGame}`);
  });

  if(state.activeGame && g){
    document.getElementById('navGameName').textContent = g.label;
    document.getElementById('navGameCount').textContent = g.count + ' items';
    const thumb = document.getElementById('navGameThumb');
    thumb.innerHTML = `<img src="${g.img}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;
    chip.style.display = 'flex';
    tabsWrap.style.display = 'block';
    activeTab = 'Más Vendidos';
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
    indicator.style.opacity = '1';
    indicator.style.height = activeItem.offsetHeight + 'px';
    indicator.style.transform = `translateY(${activeItem.offsetTop}px)`;
  } else {
    indicator.style.opacity = '0';
  }
}

// ===== CART =====
function addToCart(id,e){
  if(e)e.stopPropagation();
  const p=PRODUCTS.find(x=>String(x.id)===String(id));
  if(!p){
    console.error('Product not found for ID:', id);
    return;
  }
  const existing=state.cart.find(x=>String(x.id)===String(id));
  if(existing){
    existing.qty++;
  }else{
    state.cart.push({...p,qty:1});
  }
  
  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if(card){
    card.classList.add('is-added');
    setTimeout(()=>card.classList.remove('is-added'), 2000);
  }
  
  lastAddedId = id; 
  updateCart();
  showToast('✓ '+p.name+' added to cart');
  
  setTimeout(() => { lastAddedId = null; }, 500);
}

function decreaseQty(id, e){
  if(e) e.stopPropagation();
  const item = state.cart.find(x => String(x.id) === String(id));
  if(!item) return;
  
  if(item.qty > 1) {
    item.qty--;
    updateCart();
  } else {
    removeFromCart(id, e);
  }
}

function removeFromCart(id, event){
  if(event) event.stopPropagation();
  const targetEl = document.querySelector(`.cart-item-premium[data-id="${id}"]`);

  if(targetEl){
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
function clearCart(){state.cart=[];updateCart();}

function updateCart(){
  const cartList = document.getElementById('cartItemsList');
  const subtitle = document.getElementById('cartSubtitle');
  const empty = document.getElementById('cartEmpty');
  const footer = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartBadge = document.getElementById('cartBadge');
  
  const total = state.cart.reduce((s,x)=>s+x.price*x.qty,0);
  const count = state.cart.reduce((s,x)=>s+x.qty,0);
  
  if(cartBadge) cartBadge.textContent = count;
  if(subtitle) subtitle.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;

  if(!state.cart.length){
    if(empty) empty.classList.remove('hidden');
    if(cartList) cartList.classList.add('hidden');
    if(footer) footer.classList.add('hidden');
    return;
  }
  
  if(empty) empty.classList.add('hidden');
  if(cartList) cartList.classList.remove('hidden');
  if(footer) footer.classList.remove('hidden');

  if(cartSubtotal) cartSubtotal.textContent = fmt(total);
  if(cartTotal) cartTotal.textContent = fmt(total);

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
  
  if(cartList) cartList.innerHTML = html;
}

function renderCurrencies() {
  const container = document.getElementById('currencyDropdown');
  if(!container) return;
  container.innerHTML = Object.keys(CURRENCY_RATES).map(code => {
    const config = CURRENCY_RATES[code];
    return `
      <button class="peek-dropdown-item ${code === currentCurrency ? 'active' : ''}" data-code="${code}">
        <img src="https://flagcdn.com/w80/${config.flag}.png" style="width:20px;height:14px;object-fit:cover;border-radius:2px;">
        <span>${code}</span>
      </button>
    `;
  }).join('');
  document.querySelectorAll('.peek-dropdown-item[data-code]').forEach(b=>b.addEventListener('click',()=>setCurrency(b.dataset.code)));
}

// ===== CURRENCY =====
function setCurrency(code){
  state.currency=code;
  currentCurrency=code;
  document.getElementById('currencyLabel').textContent=code;
  const flagImg = document.getElementById('currencyFlagImg');
  if(flagImg) flagImg.src = `https://flagcdn.com/w80/${CURRENCY_RATES[code].flag}.png`;

  renderCurrencies();
  renderCatalog();
  updateCart();
  document.getElementById('currencyDropdown').classList.add('hidden');
}

// ===== DROPDOWNS =====
document.getElementById('notifBtn').addEventListener('click',e=>{
  e.stopPropagation();
  document.getElementById('currencyDropdown').classList.add('hidden');
  document.getElementById('sortDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.toggle('hidden');
});
document.getElementById('currencyBtn').addEventListener('click',e=>{
  e.stopPropagation();
  document.getElementById('sortDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.add('hidden');
  document.getElementById('currencyDropdown').classList.toggle('hidden');
});
document.getElementById('sortBtn').addEventListener('click',e=>{
  e.stopPropagation();
  document.getElementById('currencyDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.add('hidden');
  document.getElementById('sortDropdown').classList.toggle('hidden');
});
document.addEventListener('click',()=>{
  document.getElementById('currencyDropdown').classList.add('hidden');
  document.getElementById('sortDropdown').classList.add('hidden');
  document.getElementById('notifDropdown').classList.add('hidden');
});
document.querySelectorAll('.peek-dropdown-item[data-sort]').forEach(b=>b.addEventListener('click',()=>{
  state.sort=b.dataset.sort;
  document.getElementById('sortLabel').textContent=b.textContent.replace(/^..\s/,'');
  document.querySelectorAll('.peek-dropdown-item[data-sort]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('sortDropdown').classList.add('hidden');
  renderCatalog();
}));

// Notification Tabs Logic
document.querySelectorAll('.notif-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ===== SEARCH =====
document.getElementById('searchInput').addEventListener('input',e=>{state.search=e.target.value;renderCatalog();});
window.clearSearch=function(){state.search='';document.getElementById('searchInput').value='';renderCatalog();};

// ===== GAME SEARCH =====
document.getElementById('gameSearch').addEventListener('input',e=>{state.gameSearch=e.target.value;renderSidebar();});

// ===== CHECKOUT MODAL LOGIC =====
window.openCheckoutModal = function() {
  if (state.cart.length === 0) {
    showToast('❌ Tu carrito está vacío');
    return;
  }
  
  const modal = document.getElementById('checkoutModal');
  const modalList = document.getElementById('modalItemsList');
  const modalTotal = document.getElementById('modalTotalAmount');
  const modalCurrency = document.getElementById('modalTotalCurrency');
  
  modalList.innerHTML = state.cart.map(item => `
    <div class="modal-summary-item">
      <img src="${item.img}" class="modal-summary-img" alt="">
      <div class="flex-1">
        <p class="text-[13px] font-bold text-white">${item.name}</p>
        <p class="text-[10px] text-white/30 uppercase tracking-tighter">${item.game}</p>
      </div>
      <div class="text-right">
        <p class="text-[13px] font-black text-white">${fmt(item.price * item.qty)}</p>
        <p class="text-[10px] text-white/20">Cant: ${item.qty}</p>
      </div>
    </div>
  `).join('');
  
  const total = state.cart.reduce((s, x) => s + (x.price * x.qty), 0);
  modalTotal.textContent = fmt(total).split(' ')[0];
  modalCurrency.textContent = state.currency;
  
  modal.classList.remove('hidden');
  document.getElementById('robloxUserInput').focus();
};

window.closeCheckoutModal = function() {
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
          const avatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : `${SERVER_URL}${user.avatarUrl}`;
          return `
            <div class="user-result-item" onclick="selectRobloxUser('${user.id}', '${user.name}', '${user.displayName}')">
              <img src="${avatar}" class="user-result-avatar" alt="">
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

window.selectRobloxUser = function(id, name, displayName) {
  selectedUser = { id, name, displayName };
  
  const resultsDiv = document.getElementById('userSearchResults');
  resultsDiv.innerHTML = `
    <div class="user-result-item selected">
      <img src="${SERVER_URL}/api/users/avatar/${id}" class="user-result-avatar" alt="">
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

// ===== INIT =====
initApp();

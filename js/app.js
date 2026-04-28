// ===== MOCK DATA =====
const CURRENCY_RATES = {
  USD:{symbol:'$',rate:1,flag:'🇺🇸'},
  COP:{symbol:'$',rate:4200,flag:'🇨🇴'},
  MXN:{symbol:'$',rate:17.5,flag:'🇲🇽'},
  ARS:{symbol:'$',rate:1050,flag:'🇦🇷'},
  PEN:{symbol:'S/',rate:3.8,flag:'🇵🇪'},
  EUR:{symbol:'€',rate:0.92,flag:'🇪🇺'},
  BRL:{symbol:'R$',rate:5.1,flag:'🇧🇷'}
};

const GAMES=[
  {id:'blox-fruits',label:'Blox Fruits',img:'https://tr.rbxcdn.com/180da39f041f92e42095f9c9629b3a0d/150/150/Image/Webp',count:124},
  {id:'mm2',label:'Murder Mystery 2',img:'https://tr.rbxcdn.com/f94da877709a340a6b6d471f288022b3/150/150/Image/Webp',count:85},
  {id:'pet-sim',label:'Pet Simulator 99',img:'https://tr.rbxcdn.com/90f4d329eeed2b23e8a02dc80ee37534/150/150/Image/Webp',count:64},
  {id:'adopt-me',label:'Adopt Me!',img:'https://tr.rbxcdn.com/3e1dcf4a0c2b5a6f8e4d2b1c0a9f8e7d/150/150/Image/Webp',count:97},
  {id:'rivals',label:'Rivals',img:'https://tr.rbxcdn.com/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6/150/150/Image/Webp',count:41},
];

const PRODUCTS=[
  // Blox Fruits
  {id:'kitsune',name:'Kitsune Fruit',game:'blox-fruits',price:15.00,rarity:'Mythic',type:'Fruits',img:'https://tr.rbxcdn.com/f417f7b3c6b24d7803b82f61a1d2d3d3/150/150/Image/Webp',badge:'hot',purchases:2341},
  {id:'leopard',name:'Leopard Fruit',game:'blox-fruits',price:12.00,rarity:'Mythic',type:'Fruits',img:'https://tr.rbxcdn.com/f417f7b3c6b24d7803b82f61a1d2d3d3/150/150/Image/Webp',badge:'trending',purchases:1876},
  {id:'dragon',name:'Dragon Fruit',game:'blox-fruits',price:9.50,rarity:'Legendary',type:'Fruits',img:'https://tr.rbxcdn.com/e3b2a1c4d5e6f7a8b9c0d1e2f3a4b5c6/150/150/Image/Webp',badge:null,purchases:3200},
  {id:'dark-blade',name:'Dark Blade',game:'blox-fruits',price:25.00,rarity:'Mythic',type:'Gamepasses',img:'https://tr.rbxcdn.com/4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9/150/150/Image/Webp',badge:'hot',purchases:1200},
  {id:'fast-boats',name:'Fast Boats',game:'blox-fruits',price:5.00,rarity:'Legendary',type:'Gamepasses',img:'https://tr.rbxcdn.com/5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0/150/150/Image/Webp',badge:null,purchases:850},
  
  // MM2
  {id:'niks-scythe',name:"Nik's Scythe",game:'mm2',price:45.00,rarity:'Mythic',type:'Ancient',img:'https://tr.rbxcdn.com/97825603b82f61a1d2d3d3f417f7b3c6/150/150/Image/Webp',badge:'hot',purchases:312},
  {id:'harvester',name:'Harvester',game:'mm2',price:12.00,rarity:'Mythic',type:'Ancient',img:'https://tr.rbxcdn.com/3d3f417f7b3c697825603b82f61a1d2d/150/150/Image/Webp',badge:'trending',purchases:540},
  {id:'icebeam',name:'Icebeam Gun',game:'mm2',price:8.00,rarity:'Legendary',type:'Guns',img:'https://tr.rbxcdn.com/f3d2c1b0a9e8f7d6c5b4a3f2e1d0c9b8/150/150/Image/Webp',badge:null,purchases:890},
  {id:'luger',name:'Luger',game:'mm2',price:6.00,rarity:'Legendary',type:'Guns',img:'https://tr.rbxcdn.com/e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7/150/150/Image/Webp',badge:null,purchases:1100},
  
  // Pet Sim 99
  {id:'huge-cat',name:'Huge Cat',game:'pet-sim',price:20.00,rarity:'Mythic',type:'Huge Pets',img:'https://tr.rbxcdn.com/90f4d329eeed2b23e8a02dc80ee37534/150/150/Image/Webp',badge:'hot',purchases:430},
  {id:'huge-dog',name:'Huge Dog',game:'pet-sim',price:18.00,rarity:'Legendary',type:'Huge Pets',img:'https://tr.rbxcdn.com/90f4d329eeed2b23e8a02dc80ee37534/150/150/Image/Webp',badge:null,purchases:320},
  {id:'skin-case-3',name:'Skin Case 3 [x3]',game:'pet-sim',price:15.00,rarity:'Common',type:'Cajas',img:'https://tr.rbxcdn.com/b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4/150/150/Image/Webp',badge:null,purchases:150},
  {id:'skin-case-2',name:'Skin Case 2',game:'pet-sim',price:5.00,rarity:'Common',type:'Cajas',img:'https://tr.rbxcdn.com/b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4/150/150/Image/Webp',badge:null,purchases:90},
  
  // Rivals
  {id:'galaxy-sword',name:'Galaxy Sword',game:'rivals',price:8.00,rarity:'Legendary',type:'Keys',img:'https://tr.rbxcdn.com/f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4/150/150/Image/Webp',badge:'new',purchases:340},
  {id:'plasma-gun',name:'Plasma Gun',game:'rivals',price:6.00,rarity:'Epic',type:'Keys',img:'https://tr.rbxcdn.com/e8a7b6c5d4f3e2a1b0c9d8e7f6a5b4c3/150/150/Image/Webp',badge:null,purchases:520},
];

// ===== STATE =====
let state={currency:'USD',sort:'popular',activeGame:null,search:'',cart:[],gameSearch:''};
let lastAddedId = null;

// ===== HELPERS =====
function fmt(p){const c=CURRENCY_RATES[state.currency];const v=p*c.rate;return c.symbol+(v>=1000?v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):v.toFixed(2))+' '+state.currency;}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
function badgeClass(badge,rarity){if(badge==='hot')return'badge-hot';if(badge==='new')return'badge-new';if(badge==='trending')return'badge-trending';if(rarity==='Mythic')return'badge-mythic';if(rarity==='Legendary')return'badge-legendary';if(rarity==='Epic')return'badge-epic';return'badge-rare';}
function badgeLabel(badge,rarity){if(badge==='hot')return'HOT';if(badge==='new')return'NEW';if(badge==='trending')return'TOP';return rarity.toUpperCase();}
function sortProds(arr){const s=[...arr];if(state.sort==='popular')return s.sort((a,b)=>b.purchases-a.purchases);if(state.sort==='priceAsc')return s.sort((a,b)=>a.price-b.price);if(state.sort==='priceDesc')return s.sort((a,b)=>b.price-a.price);if(state.sort==='nameAsc')return s.sort((a,b)=>a.name.localeCompare(b.name));if(state.sort==='nameDesc')return s.sort((a,b)=>b.name.localeCompare(a.name));return s;}

// ===== RENDER CARD =====
const CATEGORY_COLORS={
  'blox-fruits':{'Fruits':'#f59e0b','Permanent Fruits':'#60a5fa','Passes':'#a78bfa','Accessories':'#34d399'},
  'mm2':{'Ancient':'#a855f7','Godly':'#f59e0b','Knife':'#ef4444','Gun':'#3b82f6'},
  'pet-sim':{'Mythic':'#f59e0b','Legendary':'#a78bfa','Huge':'#ec4899'},
  'adopt-me':{'Dragon':'#3b82f6','Legendary':'#a78bfa'},
  'rivals':{'Weapon':'#ef4444','Legendary':'#a78bfa'}
};

function cardBorderColor(rarity){
  if(rarity==='Mythic')return'rgba(245,158,11,0.4)';
  if(rarity==='Legendary')return'rgba(139,92,246,0.4)';
  if(rarity==='Epic')return'rgba(139,92,246,0.25)';
  return'rgba(255,255,255,0.08)';
}

function priceDisplay(price){
  const c=CURRENCY_RATES[state.currency];
  const v=(price*c.rate);
  if(v>=1000)return{main:Math.round(v).toLocaleString('en-US'),curr:state.currency};
  return{main:v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),curr:state.currency};
}

function getRarityColor(rarity){
  const colors = {
    'Mythic': '#2a1a0a',    
    'Legendary': '#0f1225', 
    'Epic': '#121826',      
    'Rare': '#0a1a12',      
    'Uncommon': '#1a1c20',  // Gris frío neutro
    'Common': '#1a1c20'     // Gris frío neutro
  };
  return colors[rarity] || '#1a1c20';
}

function renderCard(p){
  const pd=priceDisplay(p.price);
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
      <img src="https://picsum.photos/seed/${p.id}/200" alt="${p.name}" loading="lazy">
    </div>
    <div class="card-info" style="background: rgba(0,0,0,0.25)">
      <h3 class="card-title">${p.name}</h3>
      <p class="card-category">${p.category||p.rarity}</p>
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
const GAME_CATEGORIES={
  'blox-fruits':['Más Vendidos','Productos','Frutas Permanentes','Pases'],
  'mm2':['Más Vendidos','Cuchillos','Pistolas','Mascotas','Varios'],
  'pet-sim':['Más Vendidos','Huge','Legendary','Epic'],
  'adopt-me':['Más Vendidos','Dragones','Legendary'],
  'rivals':['Más Vendidos','Armas','Legendary'],
};
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
    // Icons for types
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
    return gOk&&sOk;
  });

  if(!filtered.length){cat.innerHTML='';empty.classList.remove('hidden');return;}
  empty.classList.add('hidden');

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
        <img src="https://picsum.photos/seed/${g.id}/150" alt="${g.label}">
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

  // Actualizar clases activas sin re-renderizar todo el sidebar (evita parpadeo)
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
  const p=PRODUCTS.find(x=>x.id===id);
  if(!p)return;
  if(!p) return;
  const existing=state.cart.find(x=>x.id===id);
  if(existing){
    existing.qty++;
  }else{
    state.cart.push({...p,qty:1});
  }
  
  // Efecto visual en la card
  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if(card){
    card.classList.add('is-added');
    setTimeout(()=>card.classList.remove('is-added'), 2000);
  }
  
  lastAddedId = id; // Track el último añadido
  updateCart();
  showToast('✓ '+p.name+' added to cart');
  
  // Limpiar el ID después de un momento para que no se repita la animación al re-renderizar por otras razones
  setTimeout(() => { lastAddedId = null; }, 500);
}

function decreaseQty(id, e){
  if(e) e.stopPropagation();
  const item = state.cart.find(x => x.id === id);
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
      state.cart = state.cart.filter(x => x.id !== id);
      updateCart();
    }, 300);
  } else {
    state.cart = state.cart.filter(x => x.id !== id);
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
        const p = priceDisplay(item.price * item.qty);
        // Solo aplicar animate-pop si es el item recién añadido
        const animClass = (item.id === lastAddedId) ? 'animate-pop' : '';
        
        return `
        <div class="cart-item-premium ${animClass}" data-id="${item.id}">
          <div class="cart-item-img-wrap">
            <img src="https://picsum.photos/seed/${item.id}/100" alt="${item.name}">
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
              <span class="cart-item-price-total">${p.main} ${p.curr}</span>
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

    <!-- Recommendations -->
    <div class="cart-recommendations mt-6">
      <div class="rec-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span>También te podría interesar</span>
      </div>
      <div class="rec-list space-y-2 mt-3">
        <div class="rec-item">
          <img src="https://tr.rbxcdn.com/90f4d329eeed2b23e8a02dc80ee37534/150/150/Image/Webp" class="rec-img">
          <div class="rec-info">
            <span class="rec-name">100 Diamonds</span>
            <span class="rec-game">Pet Simulator 99</span>
            <span class="rec-price">$10,800</span>
          </div>
          <button class="rec-add-btn">+</button>
        </div>
      </div>
    </div>
  `;
  
  if(cartList) cartList.innerHTML = html;
}

function calcTotal(){
  const t = state.cart.reduce((acc,item)=>acc + (item.price * item.qty), 0);
  const c = CURRENCY_RATES[state.currency];
  return (t * c.rate).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}

// ===== CURRENCY =====
function setCurrency(code){
  state.currency=code;
  const c=CURRENCY_RATES[code];
  const flagMap = {
    'USD': 'https://flagcdn.com/w40/us.png',
    'COP': 'https://flagcdn.com/w40/co.png',
    'MXN': 'https://flagcdn.com/w40/mx.png',
    'ARS': 'https://flagcdn.com/w40/ar.png',
    'PEN': 'https://flagcdn.com/w40/pe.png',
    'EUR': 'https://flagcdn.com/w40/eu.png',
    'BRL': 'https://flagcdn.com/w40/br.png'
  };
  
  document.getElementById('currencyLabel').textContent=code;
  const flagImg = document.getElementById('currencyFlagImg');
  if(flagImg) flagImg.src = flagMap[code] || flagMap['USD'];

  document.querySelectorAll('.peek-dropdown-item[data-code]').forEach(b=>b.classList.toggle('active',b.dataset.code===code));
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
document.querySelectorAll('.peek-dropdown-item[data-code]').forEach(b=>b.addEventListener('click',()=>setCurrency(b.dataset.code)));
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

// ===== INIT =====
renderSidebar();
selectGame('blox-fruits');
updateCart();

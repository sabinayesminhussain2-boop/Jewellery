/* =========================================================
   AURÉLIA — interactions
   Vanilla JS, no dependencies. All demo data lives in the
   HTML (data-* attributes), so products are easy to swap.
   ========================================================= */
(() => {
  'use strict';

  const $  = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const reduceMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const inr = (n) => '₹' + new Intl.NumberFormat('en-IN').format(n);

  /* ---------------------------------------------------------
     Product catalogue — built from the markup
     --------------------------------------------------------- */
  const PRODUCTS = new Map();
  $$('.product').forEach((card) => {
    const specs = {};
    (card.dataset.specs || '').split('\n').forEach((line) => {
      const [key, value] = line.split('|');
      if (key && value) specs[key.trim()] = value.trim();
    });
    PRODUCTS.set(card.dataset.id, {
      id: card.dataset.id,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      image: card.dataset.image,
      material: card.dataset.material,
      desc: card.dataset.desc,
      specs,
    });
  });

  /* ---------------------------------------------------------
     Storage helpers
     --------------------------------------------------------- */
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  };

  let wishlist = read('aurelia:wishlist', []);
  let cart = read('aurelia:bag', []);

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (message) => {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  };

  /* ---------------------------------------------------------
     Overlay / scroll-lock management
     --------------------------------------------------------- */
  const lock = () => document.body.classList.add('scroll-lock');
  const unlock = () => {
    const anyOpen = $$('.drawer.is-open, .modal.is-open, .mobile-menu.is-open').length > 0;
    if (!anyOpen) document.body.classList.remove('scroll-lock');
  };

  let lastFocused = null;
  const openOverlay = (el) => {
    lastFocused = document.activeElement;
    el.classList.add('is-open');
    lock();
    const focusTarget = el.querySelector('[data-autofocus]') || el.querySelector('button, a[href], input');
    if (focusTarget) setTimeout(() => focusTarget.focus({ preventScroll: true }), 120);
  };
  const closeOverlay = (el) => {
    el.classList.remove('is-open');
    unlock();
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus({ preventScroll: true });
  };

  /* ---------------------------------------------------------
     Header on scroll
     --------------------------------------------------------- */
  const topbar = $('#topbar');
  const onScrollHeader = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  const mobileMenu = $('#mobileMenu');
  const menuToggle = $('#menuToggle');

  const openMenu = () => {
    openOverlay(mobileMenu);
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
  };
  const closeMenu = () => {
    closeOverlay(mobileMenu);
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  };

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  $('#menuClose').addEventListener('click', closeMenu);
  $$('.mobile-menu__nav a').forEach((link) => link.addEventListener('click', closeMenu));

  /* ---------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     Subtle parallax (maison background)
     --------------------------------------------------------- */
  const parallaxEl = $('[data-parallax]');
  if (parallaxEl && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const rect = parallaxEl.parentElement.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const shift = Math.max(-1, Math.min(1, progress)) * -55;
      parallaxEl.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.12)`;
      ticking = false;
    };
    const request = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  /* ---------------------------------------------------------
     Wishlist
     --------------------------------------------------------- */
  const wishButtons = $$('.wishlist');
  const wishCountEls = [$('#wishlistCount'), $('#wishItemsCount')];

  const syncWishButtons = () => {
    wishButtons.forEach((btn) => {
      const on = wishlist.includes(btn.dataset.wish);
      btn.setAttribute('aria-pressed', String(on));
      const product = PRODUCTS.get(btn.dataset.wish);
      btn.setAttribute('aria-label',
        `${on ? 'Remove' : 'Add'} ${product ? product.name : 'piece'} ${on ? 'from' : 'to'} wishlist`);
    });
  };

  const renderWishlist = () => {
    syncWishButtons();
    const count = wishlist.length;
    const badge = $('#wishlistCount');
    badge.textContent = count;
    badge.hidden = count === 0;
    $('#wishItemsCount').textContent = `(${count})`;

    const wrap = $('#wishItems');
    if (!count) {
      wrap.innerHTML = `<div class="drawer__empty"><span>◆</span><p>Your wishlist is empty.<br>Save the pieces you love and share them with our concierge.</p></div>`;
      return;
    }
    wrap.innerHTML = wishlist.map((id) => {
      const p = PRODUCTS.get(id);
      if (!p) return '';
      return `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.name}" width="70" height="70" loading="lazy">
          <div class="cart-item__info">
            <h4>${p.name}</h4>
            <p>${inr(p.price)}</p>
            <button class="cart-item__remove" type="button" data-view="${id}">View details</button>
          </div>
          <button class="cart-item__remove" type="button" data-unwish="${id}" aria-label="Remove ${p.name} from wishlist">Remove</button>
        </div>`;
    }).join('');
  };

  const toggleWish = (id) => {
    const i = wishlist.indexOf(id);
    const added = i === -1;
    if (added) wishlist.push(id); else wishlist.splice(i, 1);
    write('aurelia:wishlist', wishlist);
    renderWishlist();
    const p = PRODUCTS.get(id);
    if (p) toast(added ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`);
  };

  wishButtons.forEach((btn) => {
    btn.addEventListener('click', () => toggleWish(btn.dataset.wish));
  });

  $('#wishlistBtn').addEventListener('click', () => {
    renderWishlist();
    openOverlay($('#wishDrawer'));
  });

  /* ---------------------------------------------------------
     Bag
     --------------------------------------------------------- */
  const renderCart = () => {
    const count = cart.length;
    const badge = $('#cartCount');
    badge.textContent = count;
    badge.hidden = count === 0;
    $('#cartItemsCount').textContent = `(${count})`;

    const wrap = $('#cartItems');
    if (!count) {
      $('#cartTotal').textContent = inr(0);
      wrap.innerHTML = `<div class="drawer__empty"><span>◆</span><p>Your bag is empty.<br>Every creation is made to order in our atelier.</p></div>`;
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    $('#cartTotal').textContent = inr(total);
    wrap.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" width="70" height="70" loading="lazy">
        <div class="cart-item__info">
          <h4>${item.name}</h4>
          <p>${inr(item.price)}</p>
          <button class="cart-item__remove" type="button" data-view="${item.id}">View details</button>
        </div>
        <button class="cart-item__remove" type="button" data-remove="${index}" aria-label="Remove ${item.name} from bag">Remove</button>
      </div>`).join('');
  };

  const addToBag = (id) => {
    const p = PRODUCTS.get(id);
    if (!p) return;
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.image });
    write('aurelia:bag', cart);
    renderCart();
    toast(`${p.name} added to your bag`);
  };

  $('#cartBtn').addEventListener('click', () => {
    renderCart();
    openOverlay($('#cartDrawer'));
  });

  /* Delegated clicks inside both drawers */
  document.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove]');
    const unwish = event.target.closest('[data-unwish]');
    const view = event.target.closest('[data-view]');

    if (remove) {
      cart.splice(Number(remove.dataset.remove), 1);
      write('aurelia:bag', cart);
      renderCart();
      return;
    }
    if (unwish) {
      toggleWish(unwish.dataset.unwish);
      return;
    }
    if (view) {
      const id = view.dataset.view;
      $$('.drawer.is-open').forEach(closeOverlay);
      setTimeout(() => openQuickView(id), 260);
    }
  });

  /* ---------------------------------------------------------
     Quick view modal
     --------------------------------------------------------- */
  const modal = $('#quickView');
  let currentProduct = null;

  const openQuickView = (id) => {
    const p = PRODUCTS.get(id);
    if (!p) return;
    currentProduct = p;

    const img = $('#qvImage');
    img.src = p.image;
    img.alt = p.name;
    $('#qvMaterial').textContent = p.material;
    $('#qvName').textContent = p.name;
    $('#qvPrice').textContent = inr(p.price);
    $('#qvDesc').textContent = p.desc;
    $('#qvSpecs').innerHTML = Object.entries(p.specs)
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    openOverlay(modal);
  };

  $$('.product__view').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product');
      if (!card) return;
      openQuickView(card.dataset.id);
      toast('Demo piece — shown for presentation only');
    });
  });

  /* clicking the photograph opens the same detail view */
  $$('.product__media').forEach((media) => {
    media.addEventListener('click', () => {
      const card = media.closest('.product');
      if (card) openQuickView(card.dataset.id);
    });
  });

  $('#qvAdd').addEventListener('click', () => {
    if (!currentProduct) return;
    addToBag(currentProduct.id);
    closeOverlay(modal);
    setTimeout(() => openOverlay($('#cartDrawer')), 320);
    renderCart();
  });

  /* ---------------------------------------------------------
     Close handlers
     --------------------------------------------------------- */
  $$('[data-close-modal]').forEach((el) => el.addEventListener('click', () => closeOverlay(modal)));
  $$('[data-close-cart]').forEach((el) => el.addEventListener('click', () => closeOverlay($('#cartDrawer'))));
  $$('[data-close-wish]').forEach((el) => el.addEventListener('click', () => closeOverlay($('#wishDrawer'))));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) { closeOverlay(modal); return; }
    if ($('#cartDrawer').classList.contains('is-open')) { closeOverlay($('#cartDrawer')); return; }
    if ($('#wishDrawer').classList.contains('is-open')) { closeOverlay($('#wishDrawer')); return; }
    if (mobileMenu.classList.contains('is-open')) closeMenu();
  });

  /* ---------------------------------------------------------
     Demo-only actions
     --------------------------------------------------------- */
  const appointmentMessage = 'Appointment request noted — our concierge will call you within 24 hours. (Demo)';
  $$('[data-appointment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.drawer.is-open, .modal.is-open').forEach(closeOverlay);
      toast(appointmentMessage);
    });
  });

  $('#newsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#newsEmail');
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      toast('Please enter a valid email address');
      input.focus();
      return;
    }
    input.value = '';
    toast('Thank you — you are on the list. (Demo)');
  });

  $$('[data-legal]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      toast(`${link.dataset.legal} — placeholder for the live site`);
    });
  });

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  $('#year').textContent = new Date().getFullYear();
  renderWishlist();
  renderCart();
})();

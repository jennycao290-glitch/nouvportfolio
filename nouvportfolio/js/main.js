/* main.js — scripts communs à toutes les pages
   1. Thème jour / nuit   2. Langue (FR / EN / 中文)   3. Menu mobile
   4. Carrousel des projets   5. Apparition au défilement
   6. Étoiles suspendues   7. Ciel des compétences   8. Traînée d’étoiles du curseur
   9. Livre à feuilleter (pages projet) */

(function () {
  var root = document.documentElement;

  /* ---------- 1. Thème jour / nuit ---------- */
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }
  var themeBtn = document.querySelector('.theme-btn');
  function paintTheme() {
    if (!themeBtn) return;
    var key = isDark() ? 'ui.theme.light' : 'ui.theme.dark';
    themeBtn.setAttribute('aria-label', tr(key) || themeBtn.getAttribute('aria-label'));
    themeBtn.setAttribute('aria-pressed', String(isDark()));
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('jenny-theme', next); } catch (e) {}
    paintTheme();
  });

  /* ---------- 2. Langue ---------- */
  var DICT = window.I18N || {};
  var lang = 'fr';
  try { lang = localStorage.getItem('jenny-lang') || 'fr'; } catch (e) {}
  function tr(key) { var e = DICT[key]; return e ? (e[lang] || e.fr) : null; }

  function applyLang(l) {
    lang = DICT && l ? l : 'fr';
    root.setAttribute('lang', lang === 'zh' ? 'zh-CN' : lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = tr(el.getAttribute('data-i18n'));
      if (v != null) el.innerHTML = v;
    });
    var code = document.querySelector('.lang-code');
    if (code) code.textContent = lang === 'zh' ? '中文' : lang.toUpperCase();
    document.querySelectorAll('.lang-menu [data-lang]').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.lang === lang));
    });
    paintTheme();
    document.dispatchEvent(new CustomEvent('langchange'));
  }

  var langBtn = document.querySelector('.lang-btn');
  var langMenu = document.querySelector('.lang-menu');
  function closeLang() { if (!langMenu) return; langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); }
  if (langBtn) {
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langMenu.hidden;
      langMenu.hidden = !open;
      langBtn.setAttribute('aria-expanded', String(open));
    });
    langMenu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (!b) return;
      try { localStorage.setItem('jenny-lang', b.dataset.lang); } catch (err) {}
      applyLang(b.dataset.lang);
      closeLang();
    });
    document.addEventListener('click', closeLang);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLang(); });
  }
  applyLang(lang);

  /* ---------- 3. Menu mobile + ombre de l’en-tête ---------- */
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }
  function onScroll() { header && header.classList.toggle('scrolled', scrollY > 8); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 4. Carrousel ---------- */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.gallery').forEach(function (g) {
    var track = g.querySelector('.track');
    var slides = track.children;
    var dots = g.querySelector('.dots');
    var i = 0;
    for (var k = 0; k < slides.length; k++) dots.appendChild(document.createElement('i'));
    function paint() { [].forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === i); }); }
    function go(n) {
      i = (n + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      paint();
    }
    g.querySelector('.prev').addEventListener('click', function () { go(i - 1); });
    g.querySelector('.next').addEventListener('click', function () { go(i + 1); });
    var t;
    track.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () { i = Math.round(track.scrollLeft / track.clientWidth); paint(); }, 80);
    }, { passive: true });
    paint();
  });

  /* ---------- 5. Apparition douce au défilement ---------- */
  var els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }
  /* ---------- 6. Étoiles suspendues + phrases ---------- */
  var hangs = [].slice.call(document.querySelectorAll('.hang'));
  function fit(h) {
    var b = h.querySelector('.bubble'); if (!b) return;
    b.style.setProperty('--dx', '0px');
    var r = b.getBoundingClientRect(), d = 0, w = document.documentElement.clientWidth;
    if (r.left < 12) d = 12 - r.left; else if (r.right > w - 12) d = w - 12 - r.right;
    b.style.setProperty('--dx', d + 'px');
  }
  hangs.forEach(function (h) {
    ['mouseenter', 'focus'].forEach(function (ev) { h.addEventListener(ev, function () { fit(h); }); });
    h.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = h.getAttribute('aria-expanded') === 'true';
      hangs.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
      h.setAttribute('aria-expanded', String(!open));
      fit(h);
    });
  });
  document.addEventListener('click', function () { hangs.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); });

  /* ---------- 7. Ciel des compétences ---------- */
  var views = document.querySelector('.views');
  if (views) {
    var tabs = document.querySelectorAll('.switch [data-view]');
    function setView(v) {
      views.dataset.view = v;
      tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.view === v)); });
      var hint = document.querySelector('.hint'); if (hint) hint.style.visibility = v === 'ciel' ? 'visible' : 'hidden';
      try { localStorage.setItem('jenny-view', v); } catch (e) {}
    }
    tabs.forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); }); });
    try { var sv = localStorage.getItem('jenny-view'); if (sv) setView(sv); } catch (e) {}

    var sky = views.querySelector('.sky'), info = views.querySelector('.sky-info');
    var tools = [].slice.call(sky.querySelectorAll('.sky-tool')), current = null;
    var groupIdx = { 's.g1': 0, 's.g2': 1, 's.g3': 2 };
    function show(t) {
      current = t;
      tools.forEach(function (x) {
        x.classList.toggle('on', x === t);
        x.classList.toggle('same', x.dataset.g === t.dataset.g);
      });
      sky.querySelectorAll('.links polyline').forEach(function (pl, k) { pl.classList.toggle('on', k === groupIdx[t.dataset.g]); });
      sky.classList.add('focus');
      info.querySelector('.si-g').textContent = tr(t.dataset.g) || '';
      info.querySelector('.si-n').textContent = t.getAttribute('aria-label');
      info.querySelector('.si-d').innerHTML = t.querySelector('.sky-d').innerHTML;
    }
    tools.forEach(function (t) {
      t.addEventListener('click', function (e) { e.stopPropagation(); show(t); });
      t.addEventListener('mouseenter', function () { if (matchMedia('(hover:hover)').matches) show(t); });
      t.addEventListener('focus', function () { show(t); });
    });
    document.addEventListener('langchange', function () { if (current) show(current); });
  }

  /* ---------- 9. Livre à feuilleter ---------- */
  document.querySelectorAll('.book-stage').forEach(function (stage) {
    var src = stage.querySelector('.book-src'), book = stage.querySelector('.book');
    var prevB = stage.querySelector('.bprev'), nextB = stage.querySelector('.bnext'), count = stage.querySelector('.bcount');
    var mq = matchMedia('(max-width: 700px)'), sheets = [], state = 0, single = false;

    function face(node, side, no) {
      var f = document.createElement('div');
      f.className = 'face ' + side + (node ? '' : ' blank');
      if (node) {
        f.appendChild(node.cloneNode(true));
        if (no) { var n = document.createElement('span'); n.className = 'pno'; n.textContent = no; f.appendChild(n); }
      }
      return f;
    }
    function build() {
      var pages = [].slice.call(src.children);
      single = mq.matches;
      book.innerHTML = ''; sheets = [];
      var step = single ? 1 : 2;
      for (var i = 0; i < pages.length; i += step) {
        var sh = document.createElement('div'); sh.className = 'sheet';
        sh.appendChild(face(pages[i], 'front', i > 0 && i < pages.length - 1 ? i : ''));
        var b = single ? null : pages[i + 1];
        sh.appendChild(face(b || null, 'back', b && i + 1 < pages.length - 1 ? i + 1 : ''));
        book.appendChild(sh); sheets.push(sh);
      }
      book.classList.toggle('single', single);
      state = Math.min(state, max());
      paint(true);
    }
    function max() { return single ? sheets.length - 1 : sheets.length; }
    function paint() {
      sheets.forEach(function (sh, i) {
        var f = i < state;
        sh.classList.toggle('flipped', f);
        sh.style.zIndex = f ? i + 1 : sheets.length - i + 1;
        sh.setAttribute('aria-hidden', String(single ? i !== state : !(i === state || i === state - 1)));
      });
      book.classList.toggle('at-start', state === 0);
      book.classList.toggle('at-end', !single && state === sheets.length);
      prevB.disabled = state === 0; nextB.disabled = state === max();
      var total = max() + 1;
      count.textContent = (tr('pj.page') || 'Page') + ' ' + (state + 1) + ' / ' + total;
    }
    function go(d) { var n = Math.max(0, Math.min(max(), state + d)); if (n !== state) { state = n; paint(); } }
    prevB.addEventListener('click', function () { go(-1); });
    nextB.addEventListener('click', function () { go(1); });
    book.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('.shot img')) return;
      var r = book.getBoundingClientRect();
      if (single) { go(e.clientX - r.left > r.width * .35 ? 1 : -1); return; }
      var sh = e.target.closest('.sheet'); if (!sh) return;
      go(sh.classList.contains('flipped') ? -1 : 1);
    });
    book.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    var x0 = null;
    book.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    book.addEventListener('pointerup', function (e) {
      if (x0 === null) return; var d = e.clientX - x0; x0 = null;
      if (Math.abs(d) > 45) { e.stopPropagation(); go(d < 0 ? 1 : -1); book.dataset.swiped = '1'; setTimeout(function () { delete book.dataset.swiped; }, 50); }
    });
    book.addEventListener('click', function (e) { if (book.dataset.swiped) e.stopImmediatePropagation(); }, true);
    (mq.addEventListener ? mq.addEventListener('change', build) : mq.addListener(build));
    document.addEventListener('langchange', build);
    build();
  });

  /* ---------- 10. Mon parcours : fiches au survol des étoiles ---------- */
  document.querySelectorAll('.scene').forEach(function (scene) {
    var stops = [].slice.call(scene.querySelectorAll('.stop')), pinned = null;
    function open(stop) {
      stops.forEach(function (s) {
        var on = s === stop;
        s.setAttribute('aria-expanded', String(on));
        document.getElementById(s.getAttribute('aria-controls')).classList.toggle('open', on);
      });
    }
    stops.forEach(function (s) {
      s.addEventListener('mouseenter', function () { if (!pinned) open(s); });
      s.addEventListener('focus', function () { open(s); });
      s.addEventListener('click', function (e) { e.stopPropagation(); pinned = pinned === s ? null : s; open(pinned || s); });
    });
    scene.addEventListener('mouseleave', function () { if (!pinned) open(null); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pop')) { pinned = null; open(null); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pinned = null; open(null); } });
  });

  /* ---------- 11. Système solaire (À propos) ---------- */
  document.querySelectorAll('.orbit-sys').forEach(function (sys) {
    var svg = sys.querySelector('.orbits');
    var items = [].slice.call(sys.querySelectorAll('.orbiter'));
    var N_TRAIL = 7, trails = [], orbits = [], tails = [], paused = false, t0 = performance.now(), tPause = 0, pausedAt = 0;
    items.forEach(function () {
      var row = [];
      for (var k = 0; k < N_TRAIL; k++) {
        var im = document.createElement('img'); im.src = 'images/etoile.png'; im.alt = ''; im.className = 'trail-star';
        var sz = 15 - k * 1.5; im.style.width = im.style.height = sz + 'px'; im.dataset.s = sz;
        sys.appendChild(im); row.push(im);
      }
      trails.push(row);
    });
    function layout() {
      var W = sys.clientWidth, H = sys.clientHeight, mob = W < 560;
      orbits = [0, 1, 2, 3].map(function (i) {
        return mob ? { rx: W * (.16 + i * .085), ry: H * (.12 + i * .1) }
                   : { rx: W * (.15 + i * .095), ry: H * (.13 + i * .095) };
      });
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = orbits.map(function (o) { return '<ellipse cx="' + W / 2 + '" cy="' + H / 2 + '" rx="' + o.rx + '" ry="' + o.ry + '"/>'; }).join('') +
        items.map(function () { return '<path class="tail"/>'; }).join('');
      tails = [].slice.call(svg.querySelectorAll('.tail'));
      sys._c = [W / 2, H / 2];
    }
    function place(time) {
      var c = sys._c, a0 = time * .00016;
      items.forEach(function (el, i) {
        var o = orbits[+el.dataset.o], th = a0 + (+el.dataset.p) * Math.PI / 2 + .5;
        var x = c[0] + Math.cos(th) * o.rx, y = c[1] + Math.sin(th) * o.ry;
        var front = Math.sin(th) > -.15, sc = .86 + .14 * (Math.sin(th) + 1) / 2;
        var W = sys.clientWidth, ew = el.offsetWidth * sc, lx = Math.min(Math.max(x - el.offsetWidth / 2, 6 - (el.offsetWidth - ew) / 2), W - 6 - el.offsetWidth + (el.offsetWidth - ew) / 2);
        el.style.transform = 'translate(' + lx + 'px,' + (y - el.offsetHeight / 2) + 'px) scale(' + sc.toFixed(3) + ')';
        el.style.zIndex = front ? 8 : 3;
        var dMax = (N_TRAIL + .5) * 17 / Math.max(o.rx, o.ry) + .32 * Math.max(60, el.offsetWidth) / Math.max(o.rx, o.ry) * .9, d = '';
        for (var q = 0; q <= 24; q++) {
          var tq = th - dMax * q / 24;
          d += (q ? 'L' : 'M') + (c[0] + Math.cos(tq) * o.rx).toFixed(1) + ' ' + (c[1] + Math.sin(tq) * o.ry).toFixed(1);
        }
        var tp = tails[i];
        if (tp) {
          tp.setAttribute('d', d);
          var hx = c[0] + Math.cos(th) * o.rx, hy = c[1] + Math.sin(th) * o.ry, tq2 = th - dMax;
          tp.style.stroke = 'url(#tg' + i + ')';
          var g = svg.querySelector('#tg' + i);
          if (!g) { svg.insertAdjacentHTML('afterbegin', '<defs><linearGradient id="tg' + i + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe04d" stop-opacity=".95"/><stop offset="1" stop-color="#ffe04d" stop-opacity="0"/></linearGradient></defs>'); g = svg.querySelector('#tg' + i); }
          g.setAttribute('x1', hx); g.setAttribute('y1', hy);
          g.setAttribute('x2', c[0] + Math.cos(tq2) * o.rx); g.setAttribute('y2', c[1] + Math.sin(tq2) * o.ry);
          tp.style.opacity = Math.sin(th) > -.15 ? 1 : .45;
        }
        trails[i].forEach(function (im, k) {
          var d = (k + 1) * 17 / Math.max(o.rx, o.ry) + .32 * Math.max(60, el.offsetWidth) / Math.max(o.rx, o.ry) * .9;
          var tk = th - d, s = +im.dataset.s;
          var tx = c[0] + Math.cos(tk) * o.rx, ty = c[1] + Math.sin(tk) * o.ry;
          im.style.transform = 'translate(' + (tx - s / 2) + 'px,' + (ty - s / 2) + 'px) rotate(' + (time * .05 + k * 30) % 360 + 'deg)';
          im.style.opacity = (1 - k / N_TRAIL) * (Math.sin(tk) > -.15 ? 1 : .45);
          im.style.zIndex = Math.sin(tk) > -.15 ? 7 : 2;
        });
      });
    }
    function frame(now) {
      if (!paused) place(now - t0 - tPause);
      if (!reduce) requestAnimationFrame(frame);
    }
    sys.addEventListener('mouseenter', function () { paused = true; pausedAt = performance.now(); });
    sys.addEventListener('mouseleave', function () { paused = false; tPause += performance.now() - pausedAt; });
    layout(); place(0);
    addEventListener('resize', function () { layout(); place(performance.now() - t0 - tPause); });
    document.addEventListener('langchange', function () { place(performance.now() - t0 - tPause); });
    if (!reduce) requestAnimationFrame(frame);
  });

  /* ---------- 12. Dessins : catégories + défilement infini ---------- */
  document.querySelectorAll('.hobby').forEach(function (card) {
    var tabs = card.querySelectorAll('.draw-tabs [data-cat]'); if (!tabs.length) return;
    card.querySelectorAll('.mq-track').forEach(function (tr) {
      [].slice.call(tr.children).forEach(function (f) { var c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tr.appendChild(c); });
    });
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.dataset.cat;
        tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        card.querySelectorAll('.marquee,.draw-note').forEach(function (el) {
          el.hidden = (el.dataset.cat || el.dataset.for) !== cat;
        });
      });
    });
  });

  /* ---------- 13. Agrandir un dessin au clic, puis le remettre à sa place ---------- */
  (function () {
    var arts = document.querySelectorAll('.hobby .art, .book-src .shot img'); if (!arts.length) return;
    var open = null;
    function fit(r) {
      var img = open.src.tagName === 'IMG' ? open.src : open.src.querySelector('img'), ratio = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : r.width / r.height;
      var maxW = innerWidth * .9, maxH = innerHeight * .86, w = maxW, h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
    }
    function set(el, r) { el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; }
    function close() {
      if (!open) return;
      var o = open; open = null;
      set(o.fig, o.src.getBoundingClientRect()); o.fig.style.borderRadius = '14px';
      o.veil.classList.remove('on');
      setTimeout(function () { o.fig.remove(); o.veil.remove(); o.src.style.visibility = ''; if (o.mq) o.mq.classList.remove('paused'); }, 460);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('.hobby .art, .book .shot img');
      if (open) { close(); return; }
      if (!a) return;
      var r = a.getBoundingClientRect(), mq = a.closest('.marquee');
      if (mq) mq.classList.add('paused');
      var veil = document.createElement('div'); veil.className = 'zoom-veil';
      var fig = document.createElement('figure'); fig.className = 'zoom-fig';
      fig.innerHTML = a.tagName === 'IMG' ? a.outerHTML : a.innerHTML; if (a.tagName === 'IMG') fig.classList.add('shot-zoom'); fig.setAttribute('role', 'dialog'); fig.setAttribute('aria-label', 'Dessin agrandi');
      document.body.appendChild(veil); document.body.appendChild(fig);
      set(fig, r); a.style.visibility = 'hidden';
      open = { fig: fig, veil: veil, src: a, mq: mq };
      requestAnimationFrame(function () { requestAnimationFrame(function () { veil.classList.add('on'); set(fig, fit(r)); fig.style.borderRadius = '20px'; }); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    addEventListener('resize', function () { if (open) set(open.fig, fit(open.src.getBoundingClientRect())); });
  })();

  /* ---------- 14. Défilement des dessins : automatique + glisser (avec élan) ---------- */
  document.querySelectorAll('.marquee').forEach(function (mq) {
    var track = mq.querySelector('.mq-track'), x = 0, v = 0, auto = -38, drag = null, hover = false, last = performance.now(), moved = 0;
    function half() { return track.scrollWidth / 2 + 6; }
    function wrap() { var h = half(); if (!h) return; while (x <= -h) x += h; while (x > 0) x -= h; }
    function tick(now) {
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!mq.hidden && !drag) {
        var paused = hover || mq.classList.contains('paused');
        var target = paused || reduce ? 0 : auto;
        v += (target - v) * Math.min(1, dt * 2.5);   // l'élan retombe doucement vers la vitesse normale
        x += v * dt; wrap();
        track.style.transform = 'translateX(' + x.toFixed(2) + 'px)';
      }
      requestAnimationFrame(tick);
    }
    mq.addEventListener('mouseenter', function () { hover = true; });
    mq.addEventListener('mouseleave', function () { hover = false; });
    mq.addEventListener('pointerdown', function (e) {
      drag = { x0: e.clientX, y0: e.clientY, xs: x, lastX: e.clientX, lastT: performance.now(), vel: 0, id: e.pointerId, horiz: null };
      moved = 0;
    });
    addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (drag.horiz === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        drag.horiz = Math.abs(dx) > Math.abs(dy);
        if (drag.horiz) { mq.classList.add('dragging'); try { mq.setPointerCapture(e.pointerId); } catch (er) {} }
      }
      if (!drag.horiz) return;
      moved = Math.abs(dx);
      x = drag.xs + dx; wrap();
      track.style.transform = 'translateX(' + x.toFixed(2) + 'px)';
      var now = performance.now(), dtm = Math.max(1, now - drag.lastT);
      drag.vel = drag.vel * .6 + ((e.clientX - drag.lastX) / dtm * 1000) * .4;
      drag.lastX = e.clientX; drag.lastT = now;
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.horiz) v = Math.max(-2600, Math.min(2600, drag.vel));
      drag = null; mq.classList.remove('dragging'); last = performance.now();
    }
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    // un glissé n'ouvre pas le dessin
    mq.addEventListener('click', function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    requestAnimationFrame(tick);
  });

  /* ---------- 15. Badge de l'accueil : pluie d'étoiles au clic ---------- */
  document.querySelectorAll('.status').forEach(function (badge) {
    function burst(cx, cy) {
      var n = reduce ? 0 : 18;
      for (var i = 0; i < n; i++) (function (i) {
        var im = document.createElement('img'); im.src = 'images/etoile.png'; im.alt = ''; im.className = 'burst-star';
        var sz = 10 + Math.random() * 16; im.style.width = im.style.height = sz + 'px';
        document.body.appendChild(im);
        var a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3, sp = 4 + Math.random() * 6;
        var vx = Math.cos(a) * sp, vy = Math.sin(a) * sp, x = cx, y = cy, r = Math.random() * 360, vr = (Math.random() - .5) * 20, life = 0;
        (function step() {
          life++; vy += .22; vx *= .99; x += vx; y += vy; r += vr;
          im.style.transform = 'translate(' + (x - sz / 2) + 'px,' + (y - sz / 2) + 'px) rotate(' + r + 'deg)';
          im.style.opacity = Math.max(0, 1 - life / 75);
          if (life < 75) requestAnimationFrame(step); else im.remove();
        })();
      })(i);
    }
    function fire(e) {
      var r = badge.getBoundingClientRect();
      var x = e && e.clientX ? e.clientX : r.left + r.width / 2, y = e && e.clientY ? e.clientY : r.top + r.height / 2;
      burst(x, y);
    }
    badge.addEventListener('click', fire);
    badge.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });

  /* ---------- 16. Savoir-être : objets qui tombent et s'empilent (Matter.js) ---------- */
  document.querySelectorAll('.pile').forEach(function (pile) {
    if (reduce || !('IntersectionObserver' in window)) return;
    var started = false;
    function load(cb) {
      if (window.Matter) return cb();
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
      sc.onload = cb; document.head.appendChild(sc);
    }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; io.disconnect(); load(start); }
    }, { threshold: .35 });
    io.observe(pile);

    function start() {
      var M = window.Matter; if (!M) return;
      var items = [].slice.call(pile.querySelectorAll('.pills li'));
      pile.classList.add('physics');
      var eng = M.Engine.create(), W = pile.clientWidth, H = pile.clientHeight, T = 80;
      var floor = M.Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true });
      var left = M.Bodies.rectangle(-T / 2, 0, T, H * 4, { isStatic: true });
      var right = M.Bodies.rectangle(W + T / 2, 0, T, H * 4, { isStatic: true });
      // étoiles-objets (ton dessin images/etoile.png)
      for (var k = 0; k < 7; k++) {
        var st = document.createElement('img'); st.src = 'images/etoile.png'; st.alt = ''; st.className = 'pile-star';
        var sz = 28 + Math.random() * 16; st.style.width = st.style.height = sz + 'px'; st.dataset.star = '1';
        pile.appendChild(st); items.push(st);
      }
      // coins arrondis du bocal + plafond (le contenu reste dans le bocal quand on mélange)
      var cs = getComputedStyle(pile), rb = parseFloat(cs.borderBottomLeftRadius) || 0, rt = parseFloat(cs.borderTopLeftRadius) || 0;
      function wedge(x, y, r) { var sq = r * 1.15; return M.Bodies.rectangle(x, y, sq, sq, { isStatic: true, angle: Math.PI / 4 }); }
      var corners = [];
      if (rb) corners.push(wedge(0, H, rb), wedge(W, H, rb));
      if (rt) corners.push(wedge(0, 0, rt), wedge(W, 0, rt));
      var ceil = M.Bodies.rectangle(W / 2, -T / 2, W * 3, T, { isStatic: true });
      var hasJar = !!pile.closest('.jar');
      if (hasJar) M.Composite.add(eng.world, corners.concat([ceil]));
      var bodies = items.map(function (el, i) {
        var y0 = hasJar ? 30 + Math.random() * (H * .5) : -80 - i * 55;
        if (el.dataset.star) {
          var r = el.offsetWidth / 2;
          var sb = M.Bodies.polygon(40 + Math.random() * (W - 80), y0, 5, r * .82,
            { restitution: .5, friction: .4, frictionAir: .015, angle: Math.random() * 6 });
          sb.el = el; sb.w0 = el.offsetWidth; return sb;
        }
        var w = el.offsetWidth, h = el.offsetHeight;
        var b = M.Bodies.rectangle(w / 2 + 30 + Math.random() * Math.max(1, W - w - 60), hasJar ? y0 : -50 - i * 65, w, h,
          { chamfer: { radius: h / 2 - 1 }, restitution: .35, friction: .5, frictionAir: .012, angle: (Math.random() - .5) * .8 });
        b.el = el; b.w0 = w; return b;
      });
      M.Composite.add(eng.world, [floor, left, right].concat(bodies));
      var mouse = M.Mouse.create(pile);
      ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(function (ev) { pile.removeEventListener(ev, mouse.mousewheel); });
      // écrans tactiles : on laisse le doigt faire défiler la page ; un simple toucher fait sauter l'objet
      var touchUI = matchMedia('(hover:none) and (pointer:coarse)').matches;
      if (touchUI) {
        ['touchstart', 'touchmove', 'touchend'].forEach(function (ev) {
          pile.removeEventListener(ev, ev === 'touchmove' ? mouse.mousemove : ev === 'touchstart' ? mouse.mousedown : mouse.mouseup);
        });
        var t0 = null;
        pile.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') t0 = { x: e.clientX, y: e.clientY }; }, { passive: true });
        pile.addEventListener('pointerup', function (e) {
          if (!t0) return; var moved = Math.abs(e.clientX - t0.x) + Math.abs(e.clientY - t0.y); t0 = null;
          if (moved > 10) return;
          var g = pile.closest('.soft') && pile.closest('.soft').querySelector('.game.on'); if (g) return;
          var r = pile.getBoundingClientRect(), pt = { x: e.clientX - r.left, y: e.clientY - r.top };
          var hit = M.Query.point(bodies, pt)[0]; if (!hit) return;
          M.Sleeping.set(hit, false);
          M.Body.setVelocity(hit, { x: (Math.random() - .5) * 6, y: -12 - Math.random() * 4 });
          M.Body.setAngularVelocity(hit, (Math.random() - .5) * .2);
        });
      }
      var mc = M.MouseConstraint.create(eng, { mouse: mouse, constraint: { stiffness: .2, render: { visible: false } } });
      M.Composite.add(eng.world, mc);
      // garde un filet invisible au-dessus pour que rien ne s'échappe trop loin
      addEventListener('resize', function () {
        W = pile.clientWidth; H = pile.clientHeight;
        M.Body.setPosition(floor, { x: W / 2, y: H + T / 2 });
        M.Body.setPosition(right, { x: W + T / 2, y: 0 });
      });
      document.addEventListener('langchange', function () {
        bodies.forEach(function (b) {
          var w = b.el.offsetWidth; if (Math.abs(w - b.w0) > 1) { M.Body.scale(b, w / b.w0, 1); b.w0 = w; }
          M.Sleeping.set(b, false);
        });
      });
      pile.addEventListener('shakejar', function () {
        bodies.forEach(function (b) {
          M.Sleeping.set(b, false);
          M.Body.setVelocity(b, { x: (Math.random() - .5) * 14, y: -8 - Math.random() * 10 });
          M.Body.setAngularVelocity(b, b.el.dataset.star ? (Math.random() - .5) * .5 : (Math.random() - .5) * .12);
        });
      });
      var last = performance.now();
      (function loop(now) {
        M.Engine.update(eng, Math.min(32, now - last)); last = now;
        bodies.forEach(function (b) {
          if (b.position.y > H + 200 || b.position.x < -200 || b.position.x > W + 200) {
            M.Body.setPosition(b, { x: W / 2, y: -40 }); M.Body.setVelocity(b, { x: 0, y: 0 });
          }
          var el = b.el;
          el.style.transform = 'translate(' + (b.position.x - el.offsetWidth / 2) + 'px,' + (b.position.y - el.offsetHeight / 2) + 'px) rotate(' + b.angle + 'rad)';
        });
        requestAnimationFrame(loop);
      })(last);
    }
  });

  /* ---------- 17. Bouton « Mélanger » : le bocal se secoue ---------- */
  document.querySelectorAll('.shake-btn').forEach(function (btn) {
    var jar = (btn.closest('.soft') || document).querySelector('.jar'); if (!jar) return;
    var lastShake = 0;
    function shake() {
      var now = Date.now(); if (now - lastShake < 700) return; lastShake = now;
      jar.classList.remove('shaking'); void jar.offsetWidth; jar.classList.add('shaking');
      var pile = jar.querySelector('.pile');
      setTimeout(function () { pile.dispatchEvent(new CustomEvent('shakejar')); }, 90);
    }
    // secouer le téléphone : détection du mouvement (accéléromètre)
    var motionOn = false;
    function onMotion(e) {
      var a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
      var r = jar.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;   // seulement si le bocal est à l'écran
      if (!onMotion.p) { onMotion.p = { x: a.x, y: a.y, z: a.z }; return; }
      var d = Math.abs(a.x - onMotion.p.x) + Math.abs(a.y - onMotion.p.y) + Math.abs(a.z - onMotion.p.z);
      onMotion.p = { x: a.x, y: a.y, z: a.z };
      if (d > 28) shake();
    }
    function enableMotion() {
      if (motionOn || !('DeviceMotionEvent' in window)) return;
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {   // iPhone : autorisation demandée au premier toucher
          DeviceMotionEvent.requestPermission().then(function (st) { if (st === 'granted' && !motionOn) { addEventListener('devicemotion', onMotion); motionOn = true; } }).catch(function () {});
        } else { addEventListener('devicemotion', onMotion); motionOn = true; }
      } catch (er) {}
    }
    // Android : marche tout de suite ; iPhone : l'autorisation est demandée au premier toucher sur la page ou sur « Mélanger »
    enableMotion();
    addEventListener('touchend', function once() { enableMotion(); removeEventListener('touchend', once); }, { passive: true });
    btn.addEventListener('click', function () { enableMotion(); shake(); });
    jar.addEventListener('animationend', function () { jar.classList.remove('shaking'); });
  });

  /* ---------- 18. Mini-jeu « Quel savoir-être ? » ---------- */
  document.querySelectorAll('.soft').forEach(function (soft) {
    var game = soft.querySelector('.game'), play = soft.querySelector('.play-btn'), pile = soft.querySelector('.pile');
    if (!game || !play || !pile) return;
    var qs = [].slice.call(soft.querySelectorAll('.game-data li'));
    var order = [], idx = 0, score = 0, tries = 0, on = false, done = {};
    function txt(k, fb) { return tr(k) || fb; }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function paint(msg, cls) {
      game.querySelector('.g-round').textContent = txt('g.round', 'Situation') + ' ' + Math.min(idx + 1, order.length) + ' / ' + order.length;
      game.querySelector('.g-score').textContent = txt('g.score', 'Score') + ' : ' + score;
      var cs = soft.querySelector('.cork-score'); if (cs) cs.textContent = txt('g.score', 'Score') + ' : ' + score;
      var m = game.querySelector('.g-msg'); m.textContent = msg || txt('g.ask', ''); m.className = 'g-msg' + (cls ? ' ' + cls : '');
    }
    function ask() { game.querySelector('.g-q').textContent = order[idx].textContent; paint(); }
    function start() {
      on = true; idx = 0; score = 0; tries = 0; done = {}; order = shuffle(qs.slice());
      pile.querySelectorAll('.pills li').forEach(function (li) { li.classList.remove('g-win', 'g-wrong'); });
      game.hidden = false; game.classList.add('on'); play.textContent = txt('g.stop', 'Arrêter'); ask();
    }
    function stop() {
      on = false; game.hidden = true; game.classList.remove('on'); play.textContent = txt('g.play', 'Jouer');
      var cs = soft.querySelector('.cork-score'); if (cs) cs.textContent = '';
      pile.querySelectorAll('.pills li').forEach(function (li) { li.classList.remove('g-win', 'g-wrong'); });
    }
    function sparkle(el) {
      if (reduce) return;
      var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (var i = 0; i < 12; i++) (function () {
        var im = document.createElement('img'); im.src = 'images/etoile.png'; im.alt = ''; im.className = 'burst-star';
        var sz = 10 + Math.random() * 12; im.style.width = im.style.height = sz + 'px'; document.body.appendChild(im);
        var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 4, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - 2, x = cx, y = cy, life = 0;
        (function step() { life++; vy += .15; x += vx; y += vy;
          im.style.transform = 'translate(' + (x - sz / 2) + 'px,' + (y - sz / 2) + 'px) rotate(' + life * 8 + 'deg)';
          im.style.opacity = Math.max(0, 1 - life / 50); if (life < 50) requestAnimationFrame(step); else im.remove(); })();
      })();
    }
    play.addEventListener('click', function () { on ? stop() : start(); });
    var down = null;
    pile.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
    pile.addEventListener('pointerup', function (e) {
      if (!on || !down) return;
      var moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y); down = null;
      if (moved > 8) return;
      var li = document.elementsFromPoint(e.clientX, e.clientY).filter(function (n) { return n.matches && n.matches('.pills li'); })[0];
      if (!li || idx >= order.length) return;
      var key = li.getAttribute('data-i18n'), want = order[idx].dataset.k;
      tries++;
      if (key === want) {
        score++; li.classList.add('g-win'); sparkle(li); done[key] = 1;
        paint(txt('g.ok', 'Bravo !'), 'ok');
        idx++;
        setTimeout(function () {
          if (!on) return;
          if (idx >= order.length) {
            game.querySelector('.g-q').textContent = txt('g.end', 'Bravo !');
            game.querySelector('.g-round').textContent = score + ' / ' + order.length;
            var m = game.querySelector('.g-msg'); m.className = 'g-msg ok'; m.textContent = tries + ' ' + txt('g.tries', 'essais');
            play.textContent = txt('g.again', 'Rejouer'); on = false;
            var btn = soft.querySelector('.shake-btn'); if (btn) btn.click();
          } else ask();
        }, 1100);
      } else {
        li.classList.add('g-wrong'); paint(txt('g.no', 'Essaie encore !'), 'no');
        setTimeout(function () { li.classList.remove('g-wrong'); }, 700);
      }
    });
    document.addEventListener('langchange', function () {
      if (on) { ask(); play.textContent = txt('g.stop', 'Arrêter'); }
      else if (!game.hidden) play.textContent = txt('g.again', 'Rejouer');
    });
  });

  /* ---------- 8. Traînée d’étoiles du curseur (discrète) ---------- */
  (function () {
    if (reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2000';
    document.body.appendChild(cv);
    var img = new Image(); img.src = 'images/etoile.png'; /* ton dessin d’étoile */
    var cx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0, P = [], run = false, lx = -99, ly = -99;
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    function star(x, y, r, rot) { cx.beginPath(); for (var i = 0; i < 10; i++) { var a = rot + i * Math.PI / 5 - Math.PI / 2, k = i % 2 ? r * .45 : r; cx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } cx.closePath(); }
    function tick() {
      cx.clearRect(0, 0, W, H);
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.t += 16; if (p.t >= p.life) { P.splice(i, 1); continue; }
        var a = 1 - p.t / p.life; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        cx.globalAlpha = a * .85; cx.shadowColor = 'rgba(255,216,77,.9)'; cx.shadowBlur = 8;
        var r = p.r * (.5 + .5 * a);
        if (img.complete && img.naturalWidth) {
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.drawImage(img, -r * 1.2, -r * 1.2, r * 2.4, r * 2.4); cx.restore();
        } else { cx.fillStyle = p.c; star(p.x, p.y, r, p.rot); cx.fill(); }
      }
      cx.globalAlpha = 1; cx.shadowBlur = 0;
      if (P.length) requestAnimationFrame(tick); else run = false;
    }
    addEventListener('mousemove', function (e) {
      var dx = e.clientX - lx, dy = e.clientY - ly; if (dx * dx + dy * dy < 400) return;
      lx = e.clientX; ly = e.clientY;
      P.push({ x: lx, y: ly, vx: (Math.random() - .5) * .4, vy: .3 + Math.random() * .5, r: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .08, t: 0, life: 500 + Math.random() * 350, c: Math.random() < .8 ? '#ffd84d' : '#ffffff' });
      if (P.length > 40) P.splice(0, P.length - 40);
      if (!run) { run = true; requestAnimationFrame(tick); }
    }, { passive: true });
  })();
})();

/* ---------- 19. Onglets des projets d'une catégorie ---------- */
(function () {
  var list = document.querySelector('.proj-tabs'); if (!list) return;
  var tabs = [].slice.call(list.querySelectorAll('.pt'));
  function show(id, push) {
    tabs.forEach(function (b) {
      var on = b.getAttribute('aria-controls') === id;
      b.setAttribute('aria-selected', on);
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (push) history.replaceState(null, '', '#' + id);
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('aria-controls'), true); }); });
  var h = location.hash.slice(1);
  if (h && document.getElementById(h)) show(h, false);
})();

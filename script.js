/* =====================================================================
   EMBER ROOT · experimentele one-pager "Jouw gloeiuur"
   - Eigen sectie-navigatie (1 scroll = 1 sectie), scroll-driven 3D-doosje
   - Deeltjes-canvas (vonkjes, stoom, explosies), cursor met spoor
   - Swipe-carrousel, quiz met slot + automatisch doorscrollen, resultaat
   - MailerLite-formulier: kaartjes, foutmeldingen, bedankmelding
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- basis ---------- */
  var body = document.body;
  var wereld = document.getElementById('wereld');
  var secties = Array.prototype.slice.call(document.querySelectorAll('.sectie'));
  var N = secties.length;
  var wrap = document.getElementById('doosWrap');
  var doos = document.getElementById('doos');
  var W = innerWidth, H = innerHeight;
  var smal = W < 760;
  var KLEUR = { groen: '#9CB06D', gember: '#CB7B4D', bosbes: '#BD7F89', honing: '#D0A04E' };
  var LETTER = { G: 'groen', O: 'gember', R: 'bosbes', C: 'honing' };

  function maat() {
    W = innerWidth; H = innerHeight; smal = W < 760;
    document.documentElement.style.setProperty('--vh', H + 'px');
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- tekst opsplitsen: woord per woord / letter per letter ---------- */
  function splitsWoorden(el) {
    var i = 0;
    (function loop(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (k) {
        if (k.nodeType === 3) {
          var frag = document.createDocumentFragment();
          k.textContent.split(/(\s+)/).forEach(function (d) {
            if (!d) return;
            if (/^\s+$/.test(d)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = d; s.style.setProperty('--i', i++); frag.appendChild(s);
          });
          k.parentNode.replaceChild(frag, k);
        } else if (k.nodeType === 1) loop(k);
      });
    })(el);
  }
  function splitsLetters(el) {
    var i = 0;
    (function loop(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (k) {
        if (k.nodeType === 3) {
          var frag = document.createDocumentFragment();
          k.textContent.split(/(\s+)/).forEach(function (woord) {
            if (!woord) return;
            if (/^\s+$/.test(woord)) { frag.appendChild(document.createTextNode(' ')); return; }
            var wd = document.createElement('span'); wd.className = 'lw';   // woord blijft heel
            Array.prototype.forEach.call(woord, function (ch) {
              var s = document.createElement('span'); s.className = 'l'; s.textContent = ch;
              s.style.setProperty('--i', i++); s.style.setProperty('--lr', (Math.random() * 40 - 20).toFixed(1) + 'deg');
              wd.appendChild(s);
            });
            frag.appendChild(wd);
          });
          k.parentNode.replaceChild(frag, k);
        } else if (k.nodeType === 1) loop(k);
      });
    })(el);
  }
  document.querySelectorAll('[data-woorden]').forEach(function (el, n) { splitsWoorden(el); if (el.classList.contains('lead')) el.style.setProperty('--wb', '.75s'); });
  document.querySelectorAll('[data-letters]').forEach(splitsLetters);

  /* ---------- deeltjes ---------- */
  var canvas = document.getElementById('deeltjes');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var deeltjes = [];
  var MAX = 520;
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function nieuw(o) { if (deeltjes.length < MAX) deeltjes.push(o); }
  function vonk(x, y, kleur, vx, vy, grootte, leven) {
    nieuw({ t: 'v', x: x, y: y, vx: vx, vy: vy, s: grootte, l: 0, m: leven, k: hexRgb(kleur), f: Math.random() * 6 });
  }
  function explosie(x, y, n, kleur, kracht) {
    if (smal) n = Math.round(n * .55);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * (kracht || 9);
      vonk(x, y, Math.random() < .1 ? '#ffc58f' : kleur, Math.cos(a) * v, Math.sin(a) * v - 2, 1.2 + Math.random() * 2.6, 50 + Math.random() * 60);
    }
  }
  function stoom(x, y, sterkte) {
    nieuw({ t: 's', x: x + (Math.random() - .5) * 40, y: y, vx: (Math.random() - .5) * .3, vy: -0.6 - Math.random() * .8, s: 12 + Math.random() * 18, l: 0, m: 110 + Math.random() * 60, a: .05 + sterkte * .07, f: Math.random() * 6 });
  }
  function as_(x, y) {
    nieuw({ t: 'a', x: x, y: y, vx: (Math.random() - .5) * .3, vy: .15 + Math.random() * .35, s: .6 + Math.random() * 1.4, l: 0, m: 400 + Math.random() * 300, r: Math.random() * 6 });
  }
  function tekenDeeltjes() {
    ctx.clearRect(0, 0, W, H);
    // as die traag naar beneden dwarrelt
    for (var z = deeltjes.length - 1; z >= 0; z--) {
      var o = deeltjes[z]; if (o.t !== 'a') continue;
      o.l++; o.x += o.vx + Math.sin((o.l + o.r * 40) / 40) * .25; o.y += o.vy;
      var ka = o.l / o.m; if (ka >= 1 || o.y > H + 10) { deeltjes.splice(z, 1); continue; }
      ctx.fillStyle = 'rgba(170,165,155,' + (Math.sin(ka * Math.PI) * .35) + ')';
      ctx.fillRect(o.x, o.y, o.s, o.s);
    }
    // stoom (normaal mengen)
    ctx.globalCompositeOperation = 'source-over';
    for (var i = deeltjes.length - 1; i >= 0; i--) {
      var p = deeltjes[i];
      if (p.t !== 's') continue;
      p.l++; p.x += p.vx + Math.sin((p.l + p.f * 20) / 18) * .35; p.y += p.vy; p.s += .35;
      var k = p.l / p.m;
      if (k >= 1) { deeltjes.splice(i, 1); continue; }
      var a = p.a * Math.sin(k * Math.PI);
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s);
      g.addColorStop(0, 'rgba(247,242,233,' + a + ')'); g.addColorStop(1, 'rgba(247,242,233,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill();
    }
    // vonkjes (oplichtend mengen)
    ctx.globalCompositeOperation = 'lighter';
    for (var j = deeltjes.length - 1; j >= 0; j--) {
      var q = deeltjes[j];
      if (q.t !== 'v') continue;
      q.l++; q.vx *= .975; q.vy = q.vy * .975 - .035; q.x += q.vx + Math.sin((q.l + q.f * 10) / 9) * .3; q.y += q.vy;
      var r = q.l / q.m;
      if (r >= 1) { deeltjes.splice(j, 1); continue; }
      var flik = .7 + Math.sin(q.l * .22 + q.f) * .3;
      var al = (1 - r) * flik, sz = q.s * (1 - r * .6);
      var gg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, sz * 4);
      gg.addColorStop(0, 'rgba(255,214,170,' + al + ')');
      gg.addColorStop(.25, 'rgba(' + q.k[0] + ',' + q.k[1] + ',' + q.k[2] + ',' + al * .8 + ')');
      gg.addColorStop(1, 'rgba(' + q.k[0] + ',' + q.k[1] + ',' + q.k[2] + ',0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(q.x, q.y, sz * 4, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- het product: sleutelposities per sectie ---------- */
  // x/y in vw/vh vanaf het midden, s = schaal, ry/rx = draaiing, open = deksel, licht = binnenlicht, gloed = halo, stoom
  var KF_BREED = [
    { x: 0, y: 9, s: 1.0, ry: -28, rx: -10, open: 0, licht: 0, gloed: 1.0, stoom: .25 },   // hero
    { x: 24, y: 6, s: 1.08, ry: 28, rx: -14, open: -26, licht: .45, gloed: 1.1, stoom: 1 },  // verhaal
    { x: 0, y: -31, s: .5, ry: -18, rx: -8, open: 0, licht: 0, gloed: .9, stoom: .2 },       // wie ben jij
    { x: 29, y: 4, s: .84, ry: 62, rx: -12, open: 0, licht: 0, gloed: 1, stoom: .3 },         // v1
    { x: 29, y: 4, s: .84, ry: 152, rx: -16, open: -6, licht: .1, gloed: 1.05, stoom: .3 },   // v2
    { x: 29, y: 4, s: .84, ry: 242, rx: -12, open: -10, licht: .15, gloed: 1.1, stoom: .4 },  // v3
    { x: 29, y: 4, s: .84, ry: 332, rx: -16, open: -16, licht: .25, gloed: 1.2, stoom: .5 },  // v4
    { x: -24, y: 8, s: 1.18, ry: 700, rx: -12, open: -118, licht: 1, gloed: 1.7, stoom: .7 }, // resultaat
    { x: -27, y: 6, s: 1.0, ry: 742, rx: -12, open: -22, licht: .35, gloed: 1.15, stoom: .6 },// cta
    { x: 0, y: -16, s: .82, ry: 1050, rx: -10, open: 0, licht: 0, gloed: 1.2, stoom: .4 }     // footer
  ];
  var KF_SMAL = [
    { x: 0, y: 12, s: .95 }, { x: 0, y: 25, s: .72 }, { x: 0, y: -33, s: .38 },
    { x: 0, y: -29, s: .5 }, { x: 0, y: -29, s: .5 }, { x: 0, y: -29, s: .5 }, { x: 0, y: -29, s: .5 },
    { x: 0, y: -27, s: .62 }, { x: 0, y: -43, s: .3 }, { x: 0, y: -18, s: .7 }
  ];
  function kf(i) {
    var b = KF_BREED[i];
    if (!smal) return b;
    var o = {}; for (var k in b) o[k] = b[k];
    var m = KF_SMAL[i]; o.x = m.x; o.y = m.y; o.s = m.s;
    return o;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function zacht(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- navigatie ---------- */
  var p = 0;            // continue positie (0 … N-1): stuurt de wereld én het product
  var huidig = 0;
  var bezig = false, rustTot = 0;
  var beantwoord = {};  // per data-vraag
  var keuzes = {};      // gewichten per vraag
  var persoon = null;

  function slotIndex(van, naar) {
    // geeft de eerste onbeantwoorde vraag tussen van en naar (of -1)
    for (var k = van; k < naar; k++) {
      var v = secties[k].getAttribute('data-vraag');
      if (v && !beantwoord[v]) return k;
    }
    return -1;
  }
  var hint = document.createElement('div');
  hint.className = 'vergrendeld-hint'; document.body.appendChild(hint);
  var hintTimer;
  function toonSlot(k) {
    hint.textContent = k === 2 ? 'Kies eerst wie je bent' : 'Kies eerst een antwoord';
    hint.classList.add('toon'); clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hint.classList.remove('toon'); }, 1600);
    var doel = secties[k].querySelector('.antwoorden, .wie-onder');
    if (doel) { doel.classList.remove('schud'); void doel.offsetWidth; doel.classList.add('schud'); }
    reageer(.4);
  }

  function ga(naar, geforceerd) {
    naar = Math.max(0, Math.min(N - 1, naar));
    if (naar === huidig || bezig) return;
    if (!geforceerd && naar > huidig) {
      var s = slotIndex(huidig, naar);
      if (s !== -1) { if (s === huidig) { toonSlot(s); return; } naar = s; }
    }
    var van = p, oud = huidig, start = performance.now(), duur = 1150 + Math.min(3, Math.abs(naar - oud) - 1) * 250;
    bezig = true; huidig = naar;
    setTimeout(function () { activeer(naar); }, 260);
    (function stap(nu) {
      var t = Math.min(1, (nu - start) / duur);
      p = lerp(van, naar, zacht(t));
      if (t < 1) requestAnimationFrame(stap);
      else { p = naar; bezig = false; rustTot = performance.now() + 380; secties[oud] !== secties[naar] && secties[oud].classList.remove('actief'); }
    })(start);
    // overgangseffect: vonkjes die mee de sectie in vliegen
    var richting = naar > oud ? 1 : -1;
    var sk = document.querySelector('.schok'), dm0 = doosMidden();
    sk.style.setProperty('--sx', dm0.x + 'px'); sk.style.setProperty('--sy', dm0.y + 'px');
    sk.classList.remove('aan'); void sk.offsetWidth; sk.classList.add('aan');
    for (var i = 0; i < 26; i++) vonk(Math.random() * W, richting > 0 ? H + 10 : -10, KLEUR[body.getAttribute('data-smaak')], (Math.random() - .5) * 3, -richting * (6 + Math.random() * 10), 1 + Math.random() * 2, 70 + Math.random() * 40);
  }
  function activeer(i) {
    secties.forEach(function (s, j) { if (j === i) s.classList.add('actief'); });
    updatePunten();
    if (secties[i].classList.contains('s-resultaat')) onthul();
    if (secties[i].classList.contains('s-wie')) zetCarrousel();
  }

  /* wiel, touch, toetsen */
  var wielSom = 0, wielTimer;
  addEventListener('wheel', function (e) {
    e.preventDefault();
    if (bezig || performance.now() < rustTot) { wielSom = 0; return; }
    wielSom += e.deltaY;
    clearTimeout(wielTimer); wielTimer = setTimeout(function () { wielSom = 0; }, 180);
    if (Math.abs(wielSom) > 40) { ga(huidig + (wielSom > 0 ? 1 : -1)); wielSom = 0; }
  }, { passive: false });
  var tStart = null;
  addEventListener('touchstart', function (e) { tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, in: !!e.target.closest('.carrousel') }; vraagOrientatie(); }, { passive: true });
  addEventListener('touchend', function (e) {
    if (!tStart) return;
    var dx = e.changedTouches[0].clientX - tStart.x, dy = e.changedTouches[0].clientY - tStart.y;
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) * 1.2 && !(tStart.in && Math.abs(dx) > 30)) ga(huidig + (dy < 0 ? 1 : -1));
    tStart = null;
  }, { passive: true });
  addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, select')) return;
    if (['ArrowDown', 'PageDown', ' '].indexOf(e.key) > -1) { e.preventDefault(); ga(huidig + 1); }
    if (['ArrowUp', 'PageUp'].indexOf(e.key) > -1) { e.preventDefault(); ga(huidig - 1); }
    if (e.key === 'Home') ga(0); if (e.key === 'End') ga(N - 1);
    if (huidig === 2 && e.key === 'ArrowLeft') schuif(-1);
    if (huidig === 2 && e.key === 'ArrowRight') schuif(1);
  });

  /* voortgang */
  var punten = document.querySelector('.vg-punten');
  secties.forEach(function (s, i) {
    var li = document.createElement('li');
    li.style.top = (i / (N - 1) * 100) + '%';
    li.innerHTML = '<span>' + s.getAttribute('data-naam') + '</span>';
    li.addEventListener('click', function () { ga(i); });
    punten.appendChild(li);
  });
  var puntLijst = Array.prototype.slice.call(punten.children);
  function updatePunten() {
    var slot = slotIndex(0, N);
    puntLijst.forEach(function (li, i) {
      li.classList.toggle('voorbij', i <= huidig);
      li.classList.toggle('nu', i === huidig);
      li.classList.toggle('slot', slot !== -1 && i > slot);
    });
  }

  /* ---------- muis, cursor, kantelen ---------- */
  var muis = { x: W / 2, y: H / 2, nx: 0, ny: 0, rx: 0, ry: 0 };
  var cursor = document.querySelector('.cursor');
  var orient = null;
  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var dx = e.clientX - muis.x, dy = e.clientY - muis.y;
    muis.x = e.clientX; muis.y = e.clientY;
    muis.nx = (e.clientX / W) * 2 - 1; muis.ny = (e.clientY / H) * 2 - 1;
    var snel = Math.min(1, Math.hypot(dx, dy) / 40);
    if (Math.random() < .2 + snel * .5) vonk(muis.x, muis.y, KLEUR[body.getAttribute('data-smaak')], -dx * .04 + (Math.random() - .5) * .5, -dy * .04 - Math.random() * .7, .7 + snel * 1.3, 24 + Math.random() * 20);
    var hov = e.target.closest('button, a, .kaart, .moment-keuze, input, label, .vg-punten li');
    cursor.classList.toggle('is-hover', !!hov);
    // achtergrondgloed volgt de muis een beetje
  });
  addEventListener('pointerdown', function () { cursor.classList.add('is-druk'); });
  addEventListener('pointerup', function () { cursor.classList.remove('is-druk'); });
  var orientGevraagd = false;
  function vraagOrientatie() {
    if (orientGevraagd) return; orientGevraagd = true;
    function start() { addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; orient = { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, (e.beta - 45) / 30)) }; }); }
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') start(); }).catch(function () {});
    } else start();
  }

  /* gloed die de muis volgt op de antwoordblokken */
  document.querySelectorAll('.antwoord').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--hx', (e.clientX - r.left) + 'px'); b.style.setProperty('--hy', (e.clientY - r.top) + 'px');
    });
  });
  /* magnetische knoppen */
  document.querySelectorAll('[data-magneet]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .35) + 'px');
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .45) + 'px');
    });
    b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  /* ---------- reactie van het product (veer) ---------- */
  var veer = { spin: 0, vs: 0, pop: 0, vp: 0 };
  function reageer(k) { veer.vs += 26 * k; veer.vp += .22 * k; }
  var extraSpin = 0;   // voor de onthulling
  var intro = 0;       // 0 → 1 bij het laden

  /* ---------- de grote lus ---------- */
  var tijd = 0, laatsteStoom = 0, laatsteVonk = 0, laatsteAs = 0, vorigeP = 0, vul = 0;
  var agGloed = document.querySelector('.ag-gloed');
  var hitteRuis = document.getElementById('hitteRuis');
  function lus(nu) {
    tijd = nu / 1000;
    // product-staat interpoleren tussen de secties
    if (!(p >= 0)) p = huidig; if (p > N - 1) p = N - 1;
    var a = Math.min(N - 1, Math.floor(p)), b = Math.min(N - 1, a + 1), t = p - a;
    var A = kf(a), B = kf(b), S = {};
    for (var k in A) S[k] = lerp(A[k], B[k], t);
    // formulier: hoe verder ingevuld, hoe verder het deksel opengaat
    var wCta = Math.max(0, 1 - Math.abs(p - 8));
    S.open += -92 * vul * wCta; S.licht += .65 * vul * wCta; S.gloed += .5 * vul * wCta;
    // veer
    veer.vs += -veer.spin * .08; veer.vs *= .86; veer.spin += veer.vs;
    veer.vp += -veer.pop * .12; veer.vp *= .8; veer.pop += veer.vp;
    // muis of gsm-kanteling
    var mx = orient ? orient.x : muis.nx, my = orient ? orient.y : muis.ny;
    muis.rx += (mx - muis.rx) * .06; muis.ry += (my - muis.ry) * .06;
    var zweef = Math.sin(tijd * 1.4) * 10 + Math.sin(tijd * .63) * 5;
    var ip = intro < 1 ? 1 - Math.pow(1 - intro, 3) : 1;
    var schaal = S.s * (0.05 + ip * .95) * (1 + veer.pop);
    var px = S.x * W / 100 + muis.rx * 12, py = S.y * H / 100 + muis.ry * 8;
    wrap.style.setProperty('--px', px.toFixed(1) + 'px');
    wrap.style.setProperty('--py', py.toFixed(1) + 'px');
    wrap.style.setProperty('--ps', schaal.toFixed(4));
    wrap.style.setProperty('--zweef', zweef.toFixed(1) + 'px');
    wrap.style.setProperty('--gloed', (S.gloed * (0.6 + ip * .4) + veer.pop * 2).toFixed(3));
    doos.style.setProperty('--ry', (S.ry + muis.rx * 22 + veer.spin + extraSpin + (1 - ip) * -260 + Math.sin(tijd * .5) * 4).toFixed(2) + 'deg');
    doos.style.setProperty('--rx', (S.rx - muis.ry * 12 + Math.sin(tijd * .8) * 2).toFixed(2) + 'deg');
    doos.style.setProperty('--rz', (Math.sin(tijd * .9) * 2 + muis.rx * -3).toFixed(2) + 'deg');
    doos.style.setProperty('--open', S.open.toFixed(2) + 'deg');
    doos.style.setProperty('--licht', S.licht.toFixed(3));
    wrap.style.setProperty('--licht', S.licht.toFixed(3));
    // wereld schuift (met wat bewegingsonscherpte en scheefstand bij snelheid)
    wereld.style.setProperty('--wy', (-p * H).toFixed(1) + 'px');
    var snelheid = (p - vorigeP) * 60; vorigeP = p;
    var sb = Math.min(7, Math.abs(snelheid) * 9);
    wereld.style.filter = sb > .3 ? 'blur(' + sb.toFixed(1) + 'px)' : '';
    wereld.style.setProperty('--skew', Math.max(-3, Math.min(3, snelheid * 3)).toFixed(2) + 'deg');
    agGloed.style.setProperty('--gx', (50 + px / W * 100).toFixed(1) + '%');
    agGloed.style.setProperty('--gy', (52 + py / H * 100).toFixed(1) + '%');
    if (hitteRuis) hitteRuis.setAttribute('baseFrequency', (0.012 + Math.sin(tijd * .7) * .003).toFixed(4) + ' ' + (0.06 + Math.sin(tijd * 1.3) * .015).toFixed(4));
    // voortgang
    document.querySelector('.voortgang').style.setProperty('--vg', (p / (N - 1)).toFixed(4));

    // deeltjes rond het doosje
    var cx = W / 2 + px, cy = H / 2 + py + zweef * schaal;
    var bx = (wrap.firstElementChild.offsetWidth || 400) / 4.2 * schaal; // ≈ breedte doos
    var kleur = KLEUR[body.getAttribute('data-smaak')];
    if (nu - laatsteAs > (smal ? 700 : 300)) { laatsteAs = nu; as_(Math.random() * W, -5); }
    if (ip > .3 && nu - laatsteVonk > (smal ? 230 : 110)) {
      laatsteVonk = nu;
      vonk(cx + (Math.random() - .5) * bx * 2.2, cy + bx * .7 + Math.random() * bx * .4, kleur, (Math.random() - .5) * .8, -.6 - Math.random() * 1.6, .8 + Math.random() * 1.8, 90 + Math.random() * 80);
    }
    if (S.stoom > .05 && nu - laatsteStoom > 140 / S.stoom) {
      laatsteStoom = nu;
      stoom(cx, cy - bx * 1.1, S.stoom);
    }
    // cursor
    cursor.style.setProperty('--cx', muis.x + 'px'); cursor.style.setProperty('--cy', muis.y + 'px');
    var rr = cursor.style; muis.kx = (muis.kx || muis.x) + (muis.x - (muis.kx || muis.x)) * .18; muis.ky = (muis.ky || muis.y) + (muis.y - (muis.ky || muis.y)) * .18;
    rr.setProperty('--rxp', muis.kx + 'px'); rr.setProperty('--ryp', muis.ky + 'px');

    tekenDeeltjes();
    requestAnimationFrame(lus);
  }

  /* ---------- carrousel: wie ben jij ---------- */
  var car = document.getElementById('carrousel');
  var kaarten = Array.prototype.slice.call(car.querySelectorAll('.kaart'));
  var kIdx = 1, sleep = null;
  function zetCarrousel(extra) {
    extra = extra || 0;
    kaarten.forEach(function (k, i) {
      var off = i - kIdx + extra;
      k.style.setProperty('--off', off.toFixed(3));
      k.style.setProperty('--abs', Math.min(2, Math.abs(off)).toFixed(3));
      k.style.setProperty('--absi', Math.round(Math.abs(off) * 3));
    });
    if (!persoon || huidig === 2) body.setAttribute('data-smaak', kaarten[kIdx].getAttribute('data-smaak'));
  }
  function schuif(r) {
    var n = Math.max(0, Math.min(kaarten.length - 1, kIdx + r));
    if (n !== kIdx) { kIdx = n; zetCarrousel(); reageer(r * .5); }
  }
  car.addEventListener('pointerdown', function (e) {
    sleep = { x: e.clientX, id: e.pointerId, bewogen: false };
    car.setPointerCapture(e.pointerId); car.classList.add('sleept');
  });
  car.addEventListener('pointermove', function (e) {
    if (!sleep) return;
    var dx = e.clientX - sleep.x; if (Math.abs(dx) > 6) sleep.bewogen = true;
    zetCarrousel(dx / (kaarten[0].offsetWidth * .9));
  });
  function loslaten(e) {
    if (!sleep) return;
    var dx = e.clientX - sleep.x, w = kaarten[0].offsetWidth;
    car.classList.remove('sleept');
    if (!sleep.bewogen) {
      var k = e.target.closest('.kaart'); var i = kaarten.indexOf(k);
      if (i > -1 && i !== kIdx) { kIdx = i; reageer(.5); }
    } else if (dx < -w * .18) kIdx = Math.min(kaarten.length - 1, kIdx + 1);
    else if (dx > w * .18) kIdx = Math.max(0, kIdx - 1);
    sleep = null; zetCarrousel();
  }
  car.addEventListener('pointerup', loslaten);
  car.addEventListener('pointercancel', loslaten);
  document.querySelectorAll('.knop-pijl').forEach(function (b) { b.addEventListener('click', function () { schuif(+b.getAttribute('data-richting')); }); });
  zetCarrousel();

  function doosMidden() { var r = wrap.getBoundingClientRect(); return { x: r.left, y: r.top }; }
  document.getElementById('ditBenIk').addEventListener('click', function (e) {
    var kaart = kaarten[kIdx];
    persoon = kaart.getAttribute('data-type');
    beantwoord.persoon = true;
    keuzes.persoon = { vroeg: 'G:3', middag: 'O:3', avond: 'C:2,R:2' }[persoon];
    body.setAttribute('data-smaak', kaart.getAttribute('data-smaak'));
    var r = e.currentTarget.getBoundingClientRect();
    explosie(r.left + r.width / 2, r.top + r.height / 2, 110, KLEUR[kaart.getAttribute('data-smaak')], 13);
    // de persoon vliegt het product in
    var kr = kaart.getBoundingClientRect(), dm = doosMidden();
    var kloon = kaart.cloneNode(true);
    kloon.style.cssText = 'position:fixed;left:' + kr.left + 'px;top:' + kr.top + 'px;width:' + kr.width + 'px;height:' + kr.height + 'px;margin:0;z-index:40;transform:none;opacity:1;transition:transform .95s cubic-bezier(.6,0,.3,1),opacity .95s,filter .95s;transform-origin:50% 50%;';
    document.body.appendChild(kloon);
    requestAnimationFrame(function () {
      kloon.style.transform = 'translate(' + (dm.x - kr.left - kr.width / 2) + 'px,' + (dm.y - kr.top - kr.height / 2) + 'px) scale(.04) rotate(540deg)';
      kloon.style.opacity = '0'; kloon.style.filter = 'blur(6px) brightness(2)';
    });
    setTimeout(function () { kloon.remove(); var d = doosMidden(); explosie(d.x, d.y, 70, KLEUR[kaart.getAttribute('data-smaak')], 8); reageer(1.4); }, 900);
    setTimeout(function () { ga(3); }, 1250);
  });

  /* ---------- quiz ---------- */
  document.querySelectorAll('.s-vraag').forEach(function (sec) {
    var v = sec.getAttribute('data-vraag');
    var lijst = sec.querySelector('.antwoorden');
    sec.querySelectorAll('.antwoord').forEach(function (knop) {
      knop.addEventListener('click', function (e) {
        if (bezig) return;
        lijst.querySelectorAll('.antwoord').forEach(function (x) { x.classList.remove('gekozen'); });
        knop.classList.add('gekozen'); lijst.classList.add('beantwoord');
        beantwoord[v] = true; keuzes[v] = knop.getAttribute('data-w');
        body.setAttribute('data-smaak', knop.getAttribute('data-smaak'));
        explosie(e.clientX, e.clientY, 80, KLEUR[knop.getAttribute('data-smaak')], 11);
        var d = doosMidden(); explosie(d.x, d.y, 40, KLEUR[knop.getAttribute('data-smaak')], 6);
        reageer(1.1);
        werkDoosBij(leider());
        updatePunten();
        var hier = secties.indexOf(sec);
        setTimeout(function () { if (huidig === hier) ga(hier + 1); }, 950);
      });
    });
  });

  /* ---------- score en resultaat ---------- */
  var SMAKEN = {
    G: { naam: 'Green Tea & Lemongrass', tijd: '07:30', water: '80 °C', trek: '2–3 min', caf: 'minder dan koffie', moment: 'Ochtend',
         tekst: 'Green Tea & Lemongrass is fris en licht, met minder cafeïne dan koffie. Zet water op, neem je eerste slok en laat de ochtend rustig beginnen.' },
    O: { naam: 'Ginger & Turmeric', tijd: '15:00', water: '100 °C', trek: '5–7 min', caf: 'van nature vrij', moment: 'Middagpauze',
         tekst: 'Ginger & Turmeric is kruidig en vol, en van nature cafeïnevrij. Warmte die nagloeit, precies op het moment dat je anders naar koffie grijpt.' },
    R: { naam: 'Rooibos & Forest Berries', tijd: '20:30', water: '100 °C', trek: '6 min', caf: 'van nature vrij', moment: 'Avond',
         tekst: 'Rooibos & Forest Berries is fruitig en warm, en van nature cafeïnevrij. Iets zoets na het eten, zonder dessert.' },
    C: { naam: 'Chamomile & Honey', tijd: '21:00', water: '100 °C', trek: '5 min', caf: 'van nature vrij', moment: 'Avond',
         tekst: 'Chamomile & Honey is zacht en rond, en van nature cafeïnevrij. Het laatste kopje van de dag, voor een avond zonder haast.' }
  };
  var INTRO = { vroeg: 'Jij begint de dag liever met een zucht dan met een schok.', middag: 'Jij verdient een echte pauze tussen alle drukte.', avond: 'Jij sluit de dag graag zacht af.' };
  function scores() {
    var t = { G: 0, O: 0, R: 0, C: 0 };
    Object.keys(keuzes).forEach(function (k) {
      (keuzes[k] || '').split(',').forEach(function (d) { var x = d.split(':'); if (x[0]) t[x[0]] += +x[1]; });
    });
    return t;
  }
  function leider() {
    var t = scores(), volg = [];
    if (keuzes.v2) volg.push(keuzes.v2.split(':')[0]);
    if (keuzes.persoon) volg.push(keuzes.persoon.split(':')[0]);
    volg = volg.concat(['O', 'G', 'C', 'R']);
    var best = null;
    volg.forEach(function (k) { if (best === null || t[k] > t[best]) best = k; });
    return best;
  }
  var bandNaam = doos.querySelector('.band-naam');
  var bandTijden = doos.querySelectorAll('.band-tijd');
  function werkDoosBij(k) {
    var s = SMAKEN[k]; if (!s) return;
    bandNaam.textContent = s.naam;
    bandTijden.forEach(function (b) { b.textContent = s.tijd; });
  }

  var resultaat = null;
  function onthul() {
    var k = leider(); resultaat = k; var s = SMAKEN[k];
    body.setAttribute('data-smaak', LETTER[k]);
    werkDoosBij(k);
    document.getElementById('resSmaak').textContent = s.naam;
    document.getElementById('resTekst').textContent = (INTRO[persoon] ? INTRO[persoon] + ' ' : '') + s.tekst;
    document.getElementById('resWater').textContent = s.water;
    document.getElementById('resTrek').textContent = s.trek;
    document.getElementById('resCaf').textContent = s.caf;
    // flits + draaien + opengaan + deeltjes
    var fl = document.querySelector('.flits'); fl.classList.remove('aan'); void fl.offsetWidth; fl.classList.add('aan');
    var start = performance.now();
    (function draai(nu) {
      var t = Math.min(1, (nu - start) / 1900);
      extraSpin = -720 * (1 - zacht(t));
      if (t < 1) requestAnimationFrame(draai); else extraSpin = 0;
    })(start);
    reageer(1.5);
    var fontein = 0;
    var fi = setInterval(function () {
      var d = doosMidden(), b = 60;
      for (var i = 0; i < 9; i++) vonk(d.x + (Math.random() - .5) * b, d.y - b * 1.2, Math.random() < .3 ? '#fff4d6' : KLEUR[LETTER[k]], (Math.random() - .5) * 4, -6 - Math.random() * 9, 1.4 + Math.random() * 2.4, 70 + Math.random() * 50);
      if (++fontein > 40) clearInterval(fi);
    }, 50);
    setTimeout(function () { var d = doosMidden(); explosie(d.x, d.y - 60, 160, KLEUR[LETTER[k]], 15); }, 900);
    // smaaknaam komt uit de doos
    var op = document.getElementById('resOpstijg'), d0 = doosMidden();
    op.textContent = s.naam; op.style.left = d0.x + 'px'; op.style.top = (d0.y - 40) + 'px';
    op.classList.remove('stijgt'); void op.offsetWidth; op.classList.add('stijgt');
    // de klok telt naar jouw gloeiuur
    var doel = +s.tijd.slice(0, 2) * 60 + +s.tijd.slice(3), u = document.querySelector('.rt-u'), m = document.querySelector('.rt-m'), t0 = performance.now();
    (function tel(nu) {
      var t = Math.min(1, (nu - t0 - 400) / 1600); if (t < 0) t = 0;
      var v = Math.round(doel * (1 - Math.pow(1 - t, 4)));
      u.textContent = String(Math.floor(v / 60)).padStart(2, '0'); m.textContent = String(v % 60).padStart(2, '0');
      if (t < 1) requestAnimationFrame(tel);
    })(t0);
    // formulier: favoriete moment alvast invullen
    var r = document.querySelector('.ml-subscribe-form-48335183 input[value="' + s.moment + '"]');
    if (r && !document.querySelector('.ml-subscribe-form-48335183 input[name="fields[favoriete_moment]"]:checked')) { r.checked = true; r.setAttribute('data-was', '1'); toonMoment(); }
  }
  document.getElementById('naarCta').addEventListener('click', function () { ga(8); });
  document.getElementById('naarBoven').addEventListener('click', function () { ga(0); });
  document.getElementById('opnieuw').addEventListener('click', function () {
    beantwoord = {}; keuzes = {}; persoon = null; resultaat = null;
    document.querySelectorAll('.antwoord').forEach(function (x) { x.classList.remove('gekozen'); });
    document.querySelectorAll('.antwoorden').forEach(function (x) { x.classList.remove('beantwoord'); });
    bandNaam.textContent = 'Jouw gloeiuur'; bandTijden.forEach(function (b) { b.textContent = '00:00'; });
    var d = doosMidden(); explosie(d.x, d.y, 60, KLEUR[body.getAttribute('data-smaak')], 9);
    ga(2, true);
  });

  /* ---------- formulier (MailerLite) ---------- */
  var root = document.querySelector('.ml-subscribe-form-48335183');
  var radios = [], hintEl, hintStandaard = '';
  function toonMoment() {
    if (!root) return;
    var g = radios.filter(function (r) { return r.checked; })[0];
    if (!hintEl) return;
    if (g) hintEl.innerHTML = 'Mooi. Om <strong>' + g.getAttribute('data-tijd') + '</strong> past <strong>' + g.getAttribute('data-thee').replace('&', '&amp;') + '</strong>.';
    else hintEl.innerHTML = hintStandaard;
  }
  if (root) {
    var form = root.querySelector('form.ml-block-form');
    radios = Array.prototype.slice.call(form.querySelectorAll('input[name="fields[favoriete_moment]"]'));
    hintEl = form.querySelector('.moment-hint'); hintStandaard = hintEl ? hintEl.innerHTML : '';
    radios.forEach(function (r) {
      r.addEventListener('click', function (e) {
        if (r.getAttribute('data-was') === '1') { r.checked = false; r.setAttribute('data-was', '0'); }
        else { radios.forEach(function (x) { x.setAttribute('data-was', '0'); }); r.setAttribute('data-was', '1'); }
        toonMoment(); explosie(e.clientX || W / 2, e.clientY || H / 2, 24, KLEUR[body.getAttribute('data-smaak')], 5);
      });
    });
    var velden = [
      { el: form.querySelector('#ml-voornaam'), ok: function (el) { return el.value.trim().length > 0; }, fout: 'Vul je voornaam in, dan weten we hoe we je mogen aanspreken.' },
      { el: form.querySelector('#ml-email'), ok: function (el) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()); }, fout: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.be.' },
      { el: form.querySelector('#ml-optin'), ok: function (el) { return el.checked; }, fout: 'Vink het vakje aan, dan weten we dat je onze e-mails wilt ontvangen.' }
    ].filter(function (v) { return v.el; });
    function zetFout(v, tonen) {
      var groep = v.el.closest('.ml-field-group, .ml-form-checkboxRow');
      var uit = document.getElementById(v.el.getAttribute('aria-describedby'));
      var geldig = v.ok(v.el), fout = tonen && !geldig;
      if (groep) groep.classList.toggle('is-fout', fout);
      if (uit) uit.textContent = fout ? v.fout : '';
      return geldig;
    }
    var kader = root.closest('.formulier');
    var vmTekst = form.querySelector('.vm-tekst');
    var bandBewaard = null;
    var meetCtx = document.createElement('canvas').getContext('2d');
    function voortgang() {
      var ok = velden.filter(function (v) { return v.ok(v.el); }).length;
      vul = ok / velden.length;
      kader.style.setProperty('--vul', vul.toFixed(3));
      velden.forEach(function (v) { var g = v.el.closest('.ml-field-group'); if (g) { var was = g.classList.contains('is-ok'); var nu = v.ok(v.el); g.classList.toggle('is-ok', nu); if (nu && !was) { var r = v.el.getBoundingClientRect(); explosie(r.right - 20, r.top + r.height / 2, 30, KLEUR[body.getAttribute('data-smaak')], 6); reageer(.6); } } });
      var pct = Math.round(vul * 100);
      if (vmTekst) vmTekst.innerHTML = pct === 100 ? 'Klaar. Je doosje staat <b>open</b> voor je' : 'Je proefdoosje is voor <b>' + pct + '%</b> klaar';
      var naam = form.querySelector('#ml-voornaam').value.trim();
      if (bandBewaard === null) bandBewaard = bandNaam.textContent;
      bandNaam.textContent = naam ? 'Voor ' + naam.slice(0, 14) : bandBewaard;
    }
    form.addEventListener('input', function (e) {
      var el = e.target;
      if (el.matches('input.form-control')) {
        var cs = getComputedStyle(el); meetCtx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        var r = el.getBoundingClientRect();
        var x = r.left + parseFloat(cs.paddingLeft) + Math.min(r.width - 30, meetCtx.measureText(el.value).width);
        for (var i = 0; i < 6; i++) vonk(x, r.top + r.height * .62, KLEUR[body.getAttribute('data-smaak')], (Math.random() - .5) * 2, -1 - Math.random() * 3, .8 + Math.random() * 1.4, 30 + Math.random() * 25);
      }
      voortgang();
    });
    form.addEventListener('change', voortgang);
    velden.forEach(function (v) {
      v.el.addEventListener(v.el.type === 'checkbox' ? 'change' : 'blur', function () { if (v.el.type === 'checkbox' || v.el.value.trim()) zetFout(v, true); });
      v.el.addEventListener('input', function () { if (v.el.closest('.is-fout')) zetFout(v, true); });
    });
    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      var eerste = null;
      velden.forEach(function (v) { if (!zetFout(v, true) && !eerste) eerste = v.el; });
      if (eerste) { e.preventDefault(); e.stopImmediatePropagation(); eerste.focus(); reageer(.5); }
      else { var r = form.querySelector('button.primary').getBoundingClientRect(); explosie(r.left + r.width / 2, r.top + r.height / 2, 120, KLEUR[body.getAttribute('data-smaak')], 12); }
    }, true);
    window.ml_webform_success_48335183 = function () {
      var naam = form.querySelector('#ml-voornaam').value.trim();
      var g = radios.filter(function (r) { return r.checked; })[0];
      var succes = root.querySelector('.row-success');
      var nv = succes.querySelector('[data-ml-naam]'), mv = succes.querySelector('[data-ml-moment]');
      if (nv) nv.textContent = naam ? ', ' + naam : '';
      if (mv && g) { mv.textContent = 'Tot je gloeiuur om ' + g.getAttribute('data-tijd') + '.'; mv.hidden = false; }
      root.querySelector('.row-form').style.display = 'none';
      succes.style.display = 'block';
      bandNaam.textContent = naam ? 'Tot snel, ' + naam.slice(0, 12) : 'Tot snel';
      var d = doosMidden(); explosie(d.x, d.y, 200, KLEUR[body.getAttribute('data-smaak')], 16); reageer(2);
    };
  }

  /* ---------- eigen voorkant van het doosje? ---------- */
  var test = new Image();
  test.onload = function () { body.classList.add('heeft-voorkant'); };
  test.src = 'img/EmberRoot_Doos_Voorkant.png';

  /* ---------- start ---------- */
  maat();
  addEventListener('resize', function () { maat(); });
  requestAnimationFrame(lus);
  // intro: het doosje verschijnt uit een gloed en vonkjes
  setTimeout(function () {
    activeer(0);
    var t0 = performance.now();
    (function in_(nu) { intro = Math.min(1, (nu - t0) / 1600); if (intro < 1) requestAnimationFrame(in_); })(t0);
    var fl = document.querySelector('.flits'); fl.classList.add('aan');
    setTimeout(function () { var d = doosMidden(); explosie(d.x, d.y, 140, KLEUR.gember, 12); }, 350);
  }, 250);
})();

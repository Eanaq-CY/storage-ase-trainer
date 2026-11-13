/* Storage ASE Trainer – Anwendung (Vanilla JS, ohne Abhängigkeiten) */
(function () {
'use strict';

/* ================= Grundlagen ================= */
var A = window.ASE || {};
var main = document.getElementById('main');
var sidebar = document.getElementById('sidebar');
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function fmt(n, d) { return Number(n).toLocaleString('de-DE', { maximumFractionDigits: d == null ? 1 : d }); }
function mmss(ms) { var s = Math.max(0, Math.round(ms / 1000)); var m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
var DAY = 86400000;

var TOPICS = A.topics || {};
var EXAMS = A.exams || {};
var SOURCES = A.sources || {};
var QB = (A.qb || []).filter(function (q) { return q && q.id; });
var Q = {}; QB.forEach(function (q) { Q[q.id] = q; });
(A.focusIds || []).forEach(function (id) { if (Q[id]) Q[id].fx = 1; });
var SCN = {}; (A.scenarios || []).forEach(function (s) { SCN[s.id] = s; });
function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'c' + (h >>> 0).toString(36); }
var CARDS = (A.cards || []).map(function (c) { return Object.assign({ id: hash(c.t + '|' + c.f) }, c); });
var CLOZE = A.cloze || [];
var CHAPTERS = A.chapters || [];
var TOPIC_KEYS = Object.keys(TOPICS);

/* Datenprüfung (Konsole) */
(function validate() {
  var ids = {}, warn = [];
  QB.forEach(function (q) {
    if (ids[q.id]) warn.push('Doppelte ID ' + q.id); ids[q.id] = 1;
    if (!TOPICS[q.t]) warn.push('Unbekanntes Thema ' + q.t + ' (' + q.id + ')');
    if (q.type === 'match') { if (!q.pairs || q.pairs.length < 2) warn.push('Zuordnung ohne Paare ' + q.id); }
    else if (!q.o || !q.a || !q.a.length) warn.push('Optionen/Lösung fehlen ' + q.id);
    else {
      if (q.a.some(function (i) { return i < 0 || i >= q.o.length; })) warn.push('Lösungsindex ungültig ' + q.id);
      if (q.type === 'single' && q.a.length !== 1) warn.push('Single mit mehreren Lösungen ' + q.id);
      if (q.type === 'multi' && q.a.length < 2) warn.push('Multi mit < 2 Lösungen ' + q.id);
    }
    if (q.sc && !SCN[q.sc]) warn.push('Unbekannte Fallstudie ' + q.sc);
    if (q.src && !SOURCES[q.src]) warn.push('Unbekannte Quelle ' + q.src + ' (' + q.id + ')');
  });
  (A.focusIds || []).forEach(function (id) { if (!Q[id]) warn.push('Fokus-ID fehlt ' + id); });
  if (warn.length) console.warn('[ASE] Datenprüfung:', warn);
  else console.info('[ASE] Daten ok: ' + QB.length + ' Fragen, ' + CARDS.length + ' Karten, ' + CHAPTERS.length + ' Kapitel');
})();

/* ================= Speicher ================= */
var KEY = 'aseTrainer.v1';
function blank() { return { q: {}, cards: {}, ch: {}, exams: [], session: null, last: null, days: {}, mg: {} }; }
var S = blank();
try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* ohne Speicher weiter */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorieren */ } }
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function activity(n) { var k = dayKey(); S.days[k] = (S.days[k] || 0) + (n || 1); }
function recordQ(id, ok) { var r = S.q[id] || { n: 0, c: 0 }; r.n++; if (ok) r.c++; r.last = ok ? 1 : 0; r.t = Date.now(); S.q[id] = r; activity(); }
function streak() {
  var d = new Date(), n = 0;
  if (!S.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (S.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ================= Helfer ================= */
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 2800); }
function topicName(t) { return TOPICS[t] ? TOPICS[t].icon + ' ' + TOPICS[t].name : t; }
function topicBadge(t) { return '<span class="badge">' + esc(topicName(t)) + '</span>'; }
function numWord(n) { return ['NULL', 'EINE', 'ZWEI', 'DREI', 'VIER', 'FÜNF'][n] || String(n); }
function byTopics(ts) { return QB.filter(function (q) { return ts.indexOf(q.t) >= 0; }); }
function isDue(c) { var st = S.cards[c.id]; return !st || st.due <= Date.now(); }
function dueCards(ts) { return CARDS.filter(function (c) { return (!ts || ts.indexOf(c.t) >= 0) && isDue(c); }); }
function weakQs() { return QB.filter(function (q) { var r = S.q[q.id]; return r && (r.last === 0 || (r.n >= 2 && r.c / r.n < 0.5)); }); }
function examTopics(code) { var t = []; (EXAMS[code].sections || []).forEach(function (s) { s.topics.forEach(function (x) { if (t.indexOf(x) < 0) t.push(x); }); }); return t; }
function topicStats() {
  return TOPIC_KEYS.map(function (t) {
    var qs = QB.filter(function (q) { return q.t === t; }), n = 0, c = 0, seen = 0;
    qs.forEach(function (q) { var r = S.q[q.id]; if (r) { seen++; n += r.n; c += r.c; } });
    return { t: t, total: qs.length, seen: seen, n: n, c: c, acc: n ? c / n : 0 };
  });
}
function srcLink(key) { var s = SOURCES[key]; return s ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>' : ''; }
function topicChips(selected, id) {
  return '<div class="chips" id="' + id + '">' + TOPIC_KEYS.map(function (t) {
    var n = QB.filter(function (q) { return q.t === t; }).length;
    return '<button class="chip ' + (selected.indexOf(t) >= 0 ? 'on' : '') + '" data-t="' + t + '">' + esc(topicName(t)) + ' <span class="muted">' + n + '</span></button>';
  }).join('') + '</div>';
}
function bindTopicChips(id, list, onChange) {
  $$('#' + id + ' .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.dataset.t, k = list.indexOf(t);
      if (k >= 0) list.splice(k, 1); else list.push(t);
      b.classList.toggle('on', k < 0);
      if (onChange) onChange();
    });
  });
}
function setTopicList(list, values, id) {
  list.length = 0; values.forEach(function (v) { list.push(v); });
  $$('#' + id + ' .chip').forEach(function (b) { b.classList.toggle('on', list.indexOf(b.dataset.t) >= 0); });
}

/* ================= Fragen-Engine ================= */
function makeInst(q) {
  if (q.type === 'match') {
    var rights = []; q.pairs.forEach(function (p) { if (rights.indexOf(p[1]) < 0) rights.push(p[1]); });
    return { rights: shuffle(rights) };
  }
  return { order: shuffle(q.o.map(function (_, i) { return i; })) };
}
function emptyAns(q) { return q.type === 'match' ? q.pairs.map(function () { return ''; }) : []; }
function isAnswered(q, ans) { if (!q || !ans) return false; if (q.type === 'match') return ans.every(function (v) { return !!v; }); return ans.length > 0; }
function isCorrect(q, ans) {
  if (!q || !ans) return false;
  if (q.type === 'match') return q.pairs.every(function (p, i) { return ans[i] === p[1]; });
  var a = ans.slice().sort(), b = q.a.slice().sort();
  return a.length === b.length && a.every(function (v, i) { return v === b[i]; });
}
function qHTML(q, inst, ans, mode) {
  var h = '';
  if (q.sc && SCN[q.sc]) h += '<div class="scenario"><div class="sc-title">Fallstudie: ' + esc(SCN[q.sc].title) + '</div>' + SCN[q.sc].text + '</div>';
  h += '<div class="qtext">' + esc(q.q) + '</div>';
  var review = mode === 'review';
  if (q.type === 'multi') h += '<div class="hint">Wählen Sie ' + numWord(q.a.length) + ' Antworten.</div>';
  if (q.type === 'match') {
    h += '<div class="hint">Ordnen Sie jedem Eintrag links die passende Aussage zu.</div><div class="match">';
    q.pairs.forEach(function (p, i) {
      var sel = ans ? ans[i] : '';
      var cls = review ? (sel === p[1] ? 'ok' : 'bad') : '';
      h += '<div class="mrow ' + cls + '"><div class="mleft">' + esc(p[0]) + '</div><select data-mi="' + i + '"' + (review ? ' disabled' : '') + ' aria-label="Zuordnung für ' + esc(p[0]) + '"><option value="">— zuordnen —</option>' +
        inst.rights.map(function (r) { return '<option value="' + esc(r) + '"' + (r === sel ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') +
        '</select>' + (review && sel !== p[1] ? '<div class="msol">✓ ' + esc(p[1]) + '</div>' : '') + '</div>';
    });
    h += '</div>';
  } else {
    h += '<div class="opts">';
    inst.order.forEach(function (oi, k) {
      var selected = ans && ans.indexOf(oi) >= 0;
      var cls = selected ? 'sel' : '';
      if (review) { cls = q.a.indexOf(oi) >= 0 ? 'ok' : (selected ? 'bad' : ''); }
      h += '<button class="opt ' + cls + '" data-oi="' + oi + '"' + (review ? ' disabled' : '') + '><span class="key">' + String.fromCharCode(65 + k) + '</span><span>' + esc(q.o[oi]) + '</span></button>';
    });
    h += '</div>';
  }
  return h;
}
function explHTML(q, ok) {
  var corr = q.type === 'match' ? '' : '<p class="corr"><b>Richtig:</b> ' + q.a.map(function (i) { return esc(q.o[i]); }).join(' · ') + '</p>';
  var src = q.src && SOURCES[q.src] ? '<p class="src">Quelle: ' + srcLink(q.src) + '</p>' : '';
  return '<div class="expl ' + (ok ? 'ok' : 'bad') + '"><div class="verdict">' + (ok ? '✔ Richtig' : '✘ Leider falsch') + '</div>' + corr + '<p>' + esc(q.e) + '</p>' + src + '</div>';
}
function bindQuestion(root, q, item, onChange) {
  $$('.opt', root).forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.disabled) return;
      var oi = +b.dataset.oi;
      if (q.type === 'single') {
        item.ans = [oi];
        $$('.opt', root).forEach(function (x) { x.classList.toggle('sel', x === b); });
      } else {
        var k = item.ans.indexOf(oi);
        if (k >= 0) item.ans.splice(k, 1); else item.ans.push(oi);
        b.classList.toggle('sel', k < 0);
      }
      onChange('opt');
    });
  });
  $$('select[data-mi]', root).forEach(function (sel) {
    sel.addEventListener('change', function () { item.ans[+sel.dataset.mi] = sel.value; onChange('match'); });
  });
}
function keySelect(e, root) {
  var k = -1;
  if (/^[1-9]$/.test(e.key)) k = +e.key - 1;
  else if (/^[a-fA-F]$/.test(e.key)) k = e.key.toUpperCase().charCodeAt(0) - 65;
  if (k < 0) return false;
  var btns = $$('.opt', root);
  if (btns[k] && !btns[k].disabled) { btns[k].click(); return true; }
  return false;
}

/* ================= Router ================= */
var TIMER = null, KEYH = null;
function go(h) { if (location.hash === h) render(); else location.hash = h; }
function parse() { var h = location.hash.replace(/^#\/?/, ''); var parts = h.split('/').filter(Boolean).map(decodeURIComponent); return { r: parts[0] || '', p: parts.slice(1) }; }
var NAV = [['', '🏠', 'Start'], ['kapitel', '📚', 'Lernkapitel'], ['karten', '🃏', 'Karteikarten'], ['quiz', '❓', 'Quiz'], ['fokus', '🎯', 'Prüfungsfokus'],
  ['zuordnen', '🔗', 'Zuordnen'], ['luecken', '✏️', 'Lückentext'], ['szenarien', '🏢', 'Fallstudien'], ['rechner', '🧮', 'Sizing-Rechner'], ['sep'],
  ['pruefung', '⏱️', 'Prüfungsmodus'], ['fehler', '🩹', 'Fehlertraining'], ['sep'],
  ['glossar', '📖', 'Glossar'], ['spick', '📝', 'Spickzettel'], ['fortschritt', '📊', 'Fortschritt'], ['info', 'ℹ️', 'Prüfungsinfos & Quellen']];
function buildNav(active) {
  var due = dueCards().length, weak = weakQs().length;
  sidebar.innerHTML = NAV.map(function (n) {
    if (n[0] === 'sep') return '<div class="sep"></div>';
    var act = active === n[0] || (active === 'ueben' && n[0] === 'quiz');
    var cnt = '';
    if (n[0] === 'karten' && due) cnt = '<span class="count">' + due + '</span>';
    if (n[0] === 'fehler' && weak) cnt = '<span class="count">' + weak + '</span>';
    if (n[0] === 'pruefung' && S.session) cnt = '<span class="count">läuft</span>';
    return '<a href="#/' + n[0] + '" class="' + (act ? 'active' : '') + '"><span class="ico">' + n[1] + '</span>' + n[2] + cnt + '</a>';
  }).join('') + '<div class="disclaimer">Unabhängige Lernhilfe – nicht von HPE erstellt oder autorisiert. Produktnamen sind Marken der jeweiligen Inhaber.</div>';
}
var ROUTES = {};
function render() {
  clearInterval(TIMER); TIMER = null; KEYH = null;
  var pr = parse();
  var fn = ROUTES[pr.r] || viewHome;
  buildNav(pr.r);
  sidebar.classList.remove('open');
  try { fn(pr.p); } catch (e) { console.error(e); main.innerHTML = '<div class="card"><h2>Hoppla</h2><p>' + esc(e.message) + '</p><a class="btn" href="#/">Zur Startseite</a></div>'; }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
document.addEventListener('keydown', function (e) {
  if (!KEYH || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
  KEYH(e);
});

/* ================= Startseite ================= */
function viewHome() {
  var answered = Object.keys(S.q).filter(function (id) { return Q[id]; }).length;
  var tot = 0, cor = 0; Object.keys(S.q).forEach(function (k) { tot += S.q[k].n; cor += S.q[k].c; });
  var read = CHAPTERS.filter(function (c) { return S.ch[c.id]; }).length;
  var lastEx = S.exams[S.exams.length - 1];
  var weakTopics = topicStats().filter(function (t) { return t.n >= 3; }).sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3);
  var fxCount = QB.filter(function (q) { return q.fx; }).length;
  var matchCount = QB.filter(function (q) { return q.type === 'match'; }).length;
  var tiles = [
    ['#/kapitel', '📚', 'Lernkapitel', CHAPTERS.length + ' Kapitel mit offiziellen Erklärungen'],
    ['#/karten', '🃏', 'Karteikarten', CARDS.length + ' Karten mit Wiederholungssystem'],
    ['#/quiz', '❓', 'Quiz', QB.length + ' Fragen mit sofortigem Feedback'],
    ['#/fokus', '🎯', 'Prüfungsfokus', fxCount + ' Fragen zu Detailthemen'],
    ['#/zuordnen', '🔗', 'Zuordnen', matchCount + ' Zuordnungsspiele'],
    ['#/luecken', '✏️', 'Lückentext', CLOZE.length + ' Merksätze zum Ergänzen'],
    ['#/szenarien', '🏢', 'Fallstudien', (A.scenarios || []).length + ' Kundenszenarien'],
    ['#/rechner', '🧮', 'Sizing-Rechner', 'Rechner und Rechenaufgaben'],
    ['#/pruefung', '⏱️', 'Prüfungsmodus', '60 Fragen · 90 Minuten · 63 %'],
    ['#/fehler', '🩹', 'Fehlertraining', weakQs().length + ' Fragen zum Wiederholen'],
    ['#/glossar', '📖', 'Glossar', 'Begriffe Deutsch/Englisch'],
    ['#/spick', '📝', 'Spickzettel', 'Wichtigste Zahlen auf einen Blick']
  ].map(function (t) { return '<a class="tile" href="' + t[0] + '"><span class="t-ico">' + t[1] + '</span><span class="t-title">' + t[2] + '</span><span class="t-sub">' + t[3] + '</span></a>'; }).join('');
  var examCards = ['J82', 'J83'].map(examCardHTML).join('');
  main.innerHTML =
    '<section class="hero"><h1>HPE Storage ASE – Prüfungsvorbereitung</h1>' +
    '<p>Lernplattform für <b>HPE0-J82 (Storage Architect)</b> und <b>HPE0-J83 (Storage Integrator Solutions)</b>: ' + CHAPTERS.length + ' Lernkapitel, ' + QB.length + ' Prüfungsfragen mit Erklärungen und Quellen, ' + CARDS.length + ' Karteikarten, Fallstudien, Sizing-Rechner und eine realistische Prüfungssimulation. Stand der Inhalte: November 2026.</p>' +
    '<div class="btnrow"><a class="btn" href="#/pruefung">⏱️ Prüfung simulieren</a><a class="btn ghost" href="#/kapitel">📚 Mit dem Lernen beginnen</a></div></section>' +
    (S.session ? '<div class="callout tip">Eine Prüfungssimulation läuft noch. <a href="#/pruefung/run">Jetzt fortsetzen</a></div>' : '') +
    '<div class="card"><div class="statrow">' +
    '<div class="stat"><b>' + answered + '/' + QB.length + '</b><span>Fragen bearbeitet</span></div>' +
    '<div class="stat"><b>' + (tot ? pct(cor, tot) + ' %' : '–') + '</b><span>Trefferquote</span></div>' +
    '<div class="stat"><b>' + dueCards().length + '</b><span>Karten fällig</span></div>' +
    '<div class="stat"><b>' + read + '/' + CHAPTERS.length + '</b><span>Kapitel gelesen</span></div>' +
    '<div class="stat"><b>' + streak() + '</b><span>Lerntage in Folge</span></div>' +
    '<div class="stat"><b>' + (lastEx ? lastEx.pct + ' %' : '–') + '</b><span>Letzte Prüfung' + (lastEx ? ' (' + esc(lastEx.code) + ')' : '') + '</span></div>' +
    '</div></div>' +
    (weakTopics.length ? '<div class="card"><h3 style="margin-top:0">Deine schwächsten Themen</h3>' + weakTopics.map(function (t) {
      return '<div class="secrow"><div>' + esc(topicName(t.t)) + '</div><div class="bar ' + (t.acc < 0.63 ? 'bad' : '') + '"><span style="width:' + Math.round(t.acc * 100) + '%"></span></div><div><a href="#/quiz/' + t.t + '">Üben</a></div></div>';
    }).join('') + '</div>' : '') +
    '<h2>Lernmethoden</h2><div class="grid">' + tiles + '</div>' +
    '<h2 style="margin-top:24px">Die beiden ASE-Prüfungen</h2><div class="grid wide">' + examCards + '</div>' +
    '<div class="card"><h3 style="margin-top:0">Empfohlener Lernplan (3 Wochen)</h3><ol>' +
    '<li><b>Woche 1 – Grundlagen und Plattformen:</b> Kapitel 1–11 lesen, nach jedem Kapitel das Kapitel-Quiz, täglich fällige Karteikarten.</li>' +
    '<li><b>Woche 2 – Datensicherung, Netzwerk, Cloud, Services:</b> Kapitel 12–17, Zuordnungsspiele und Lückentexte, erste Prüfungssimulation.</li>' +
    '<li><b>Woche 3 – Sizing, Betrieb, Prüfungsfokus:</b> Kapitel 18–22, Fallstudien, Sizing-Rechenaufgaben, Prüfungsfokus, Fehlertraining und mindestens zwei weitere Simulationen. Ziel: stabil über 75 %.</li>' +
    '</ol><p class="muted small">Die echte Prüfung ist auf Englisch (sowie Japanisch/Koreanisch). Das Glossar zeigt zu jedem Begriff die englische Bezeichnung.</p></div>';
}
function examCardHTML(code) {
  var ex = EXAMS[code];
  return '<div class="card"><div class="badge fx">' + esc(ex.code) + '</div><h3 style="margin:.4em 0">' + esc(ex.name) + '</h3><p class="muted small">' + esc(ex.cert) + ' · ' + ex.questions + ' Fragen · ' + ex.minutes + ' Minuten · Bestehen ab ' + ex.pass + ' %</p>' +
    ex.sections.map(function (s) { return '<div class="secrow"><div class="small">' + esc(s.name) + '</div><div class="bar"><span style="width:' + Math.min(100, s.pct * 2.5) + '%"></span></div><div class="small"><b>' + s.pct + ' %</b></div></div>'; }).join('') +
    '<div class="btnrow"><a class="btn primary" href="#/pruefung">Simulation starten</a><a class="btn" href="#/quiz/' + examTopics(code).join('+') + '">Passendes Quiz</a></div></div>';
}

/* ================= Lernkapitel ================= */
function viewChapters(p) {
  if (p[0]) return viewChapter(p[0]);
  main.innerHTML = '<h1>📚 Lernkapitel</h1><p class="muted">Kompakte Kapitel entlang der offiziellen Prüfungsziele. Blau hinterlegte Kästen fassen offizielle HPE-Aussagen sinngemäß zusammen – mit Link zur Quelle.</p><div class="grid wide">' +
    CHAPTERS.map(function (c, i) {
      return '<a class="tile" href="#/kapitel/' + c.id + '"><span class="t-title">' + (i + 1) + '. ' + esc(c.title) + (S.ch[c.id] ? ' ✅' : '') + '</span><span class="t-sub">' + esc(c.intro) + '</span><span>' + c.topics.map(topicBadge).join('') + '<span class="badge">≈ ' + c.min + ' min</span></span></a>';
    }).join('') + '</div>';
}
function viewChapter(id) {
  var i = -1; CHAPTERS.forEach(function (c, k) { if (c.id === id) i = k; });
  if (i < 0) return go('#/kapitel');
  var c = CHAPTERS[i], qs = byTopics(c.topics), prev = CHAPTERS[i - 1], next = CHAPTERS[i + 1];
  main.innerHTML = '<div class="small noprint"><a href="#/kapitel">← Alle Kapitel</a></div><h1>' + (i + 1) + '. ' + esc(c.title) + '</h1><p class="muted">' + esc(c.intro) + '</p>' +
    '<div class="card content">' + c.html + '</div>' +
    '<div class="card noprint"><h3 style="margin-top:0">Wissen prüfen</h3><p>' + qs.length + ' Fragen und ' + CARDS.filter(function (x) { return c.topics.indexOf(x.t) >= 0; }).length + ' Karteikarten gehören zu diesem Kapitel.</p>' +
    '<div class="btnrow"><button class="btn primary" id="chq">Kapitel-Quiz (' + Math.min(15, qs.length) + ' Fragen)</button><button class="btn" id="chr">' + (S.ch[c.id] ? '✅ Gelesen' : 'Als gelesen markieren') + '</button><a class="btn" href="#/karten/' + c.topics.join('+') + '">Karteikarten zum Kapitel</a></div></div>' +
    '<div class="actions noprint">' + (prev ? '<a class="btn" href="#/kapitel/' + prev.id + '">← ' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a class="btn primary" href="#/kapitel/' + next.id + '">' + esc(next.title) + ' →</a>' : '') + '</div>';
  $('#chq').onclick = function () { startRun(shuffle(qs).slice(0, 15), 'Kapitel-Quiz: ' + c.title, '#/kapitel/' + c.id); };
  $('#chr').onclick = function () { S.ch[c.id] = Date.now(); activity(); save(); this.textContent = '✅ Gelesen'; buildNav('kapitel'); };
}

/* ================= Übungs-Runner ================= */
var RUN = null;
function startRun(qs, title, back) {
  if (!qs.length) { toast('Keine passenden Fragen gefunden.'); return; }
  RUN = { title: title, back: back || '#/quiz', i: 0, items: qs.map(function (q) { return { q: q, inst: makeInst(q), ans: emptyAns(q), checked: false, ok: false }; }) };
  go('#/ueben');
}
function viewRun() {
  if (!RUN) return go('#/quiz');
  var n = RUN.items.length;
  if (RUN.i >= n) return viewRunSummary();
  var it = RUN.items[RUN.i], q = it.q;
  var done = RUN.items.filter(function (x) { return x.checked; }).length;
  var right = RUN.items.filter(function (x) { return x.ok; }).length;
  main.innerHTML = '<div class="run-head"><div><h2 style="margin-bottom:2px">' + esc(RUN.title) + '</h2><div class="muted small">Frage ' + (RUN.i + 1) + ' von ' + n + ' · ' + right + ' von ' + done + ' richtig · Tasten: A–F wählen, Enter prüfen/weiter</div></div><a class="btn ghost" href="' + RUN.back + '">Beenden</a></div>' +
    '<div class="progress"><span style="width:' + (done / n * 100).toFixed(1) + '%"></span></div>' +
    '<div class="card qcard" id="qc">' + topicBadge(q.t) + (q.fx ? '<span class="badge fx">Prüfungsfokus</span>' : '') +
    qHTML(q, it.inst, it.ans, it.checked ? 'review' : 'practice') +
    (it.checked ? explHTML(q, it.ok) : '') +
    '<div class="actions"><button class="btn" id="prev"' + (RUN.i === 0 ? ' disabled' : '') + '>← Zurück</button>' +
    (it.checked ? '<button class="btn primary" id="next">' + (RUN.i < n - 1 ? 'Weiter →' : 'Zur Auswertung') + '</button>' : '<button class="btn primary" id="check">Antwort prüfen</button>') +
    '</div></div>';
  var root = $('#qc');
  function check() {
    if (!isAnswered(q, it.ans)) { toast(q.type === 'match' ? 'Bitte alle Einträge zuordnen.' : 'Bitte zuerst eine Antwort wählen.'); return; }
    if (q.type === 'multi' && it.ans.length !== q.a.length) { toast('Bitte genau ' + q.a.length + ' Antworten wählen.'); return; }
    it.checked = true; it.ok = isCorrect(q, it.ans); recordQ(q.id, it.ok); save(); viewRun();
  }
  function next() { RUN.i++; viewRun(); window.scrollTo(0, 0); }
  if (!it.checked) bindQuestion(root, q, it, function (kind) { if (kind === 'opt' && q.type === 'single') check(); });
  $('#prev').onclick = function () { RUN.i--; viewRun(); };
  if ($('#check')) $('#check').onclick = check;
  if ($('#next')) $('#next').onclick = next;
  KEYH = function (e) {
    if (e.key === 'Enter') { e.preventDefault(); if (it.checked) next(); else check(); return; }
    if (!it.checked && keySelect(e, root)) e.preventDefault();
  };
}
function viewRunSummary() {
  var n = RUN.items.length, right = RUN.items.filter(function (x) { return x.ok; }).length;
  var wrong = RUN.items.filter(function (x) { return x.checked && !x.ok; }).map(function (x) { return x.q; });
  main.innerHTML = '<h2>' + esc(RUN.title) + ' – Auswertung</h2><div class="card"><div class="result-big ' + (pct(right, n) >= 63 ? 'pass' : 'fail') + '">' + pct(right, n) + ' %</div><p class="muted">' + right + ' von ' + n + ' Fragen richtig.</p>' +
    '<div class="btnrow"><button class="btn primary" id="again"' + (wrong.length ? '' : ' disabled') + '>Falsche wiederholen (' + wrong.length + ')</button><button class="btn" id="redo">Gleiche Runde neu mischen</button><a class="btn" href="' + RUN.back + '">Zurück</a></div></div>' +
    RUN.items.map(function (x, k) {
      return '<details class="rv"><summary>' + (k + 1) + '. ' + (x.ok ? '✔' : '✘') + ' ' + esc(x.q.q.slice(0, 110)) + (x.q.q.length > 110 ? '…' : '') + '</summary>' + qHTML(x.q, x.inst, x.ans, 'review') + explHTML(x.q, x.ok) + '</details>';
    }).join('');
  $('#again').onclick = function () { startRun(shuffle(wrong), RUN.title + ' (Wiederholung)', RUN.back); };
  $('#redo').onclick = function () { startRun(shuffle(RUN.items.map(function (x) { return x.q; })), RUN.title, RUN.back); };
}

/* ================= Quiz-Konfiguration ================= */
var QCFG = { topics: TOPIC_KEYS.slice(), count: '20', filter: 'all', types: 'all' };
function quizPool() {
  return QB.filter(function (q) {
    if (QCFG.topics.indexOf(q.t) < 0) return false;
    var r = S.q[q.id];
    if (QCFG.filter === 'new' && r) return false;
    if (QCFG.filter === 'wrong' && !(r && r.last === 0)) return false;
    if (QCFG.filter === 'fx' && !q.fx) return false;
    if (QCFG.types === 'choice' && q.type === 'match') return false;
    if (QCFG.types === 'match' && q.type !== 'match') return false;
    if (QCFG.types === 'calc' && q.t !== 'sizing') return false;
    return true;
  });
}
function viewQuiz(p) {
  if (p[0]) { var pre = p[0].split('+').filter(function (t) { return TOPICS[t]; }); if (pre.length) QCFG.topics = pre; }
  main.innerHTML = '<h1>❓ Quiz – Übungsmodus</h1><p class="muted">Sofortiges Feedback mit Erklärung und Quellenangabe nach jeder Frage. Einfachauswahl wird beim Anklicken direkt geprüft.</p>' +
    '<div class="card"><h3 style="margin-top:0">Themen</h3><div class="btnrow" style="margin:0 0 10px"><button class="btn" data-sel="all">Alle</button><button class="btn" data-sel="none">Keine</button><button class="btn" data-sel="J82">Themen J82</button><button class="btn" data-sel="J83">Themen J83</button></div>' +
    topicChips(QCFG.topics, 'qchips') +
    '<div class="calc-grid" style="margin-top:14px">' +
    '<label class="field">Anzahl Fragen<select id="qcount"><option value="10">10</option><option value="20">20</option><option value="40">40</option><option value="999">Alle</option></select></label>' +
    '<label class="field">Auswahl<select id="qfilter"><option value="all">Alle Fragen</option><option value="new">Nur neue</option><option value="wrong">Nur zuletzt falsch beantwortete</option><option value="fx">Nur Prüfungsfokus</option></select></label>' +
    '<label class="field">Fragetypen<select id="qtypes"><option value="all">Alle Typen</option><option value="choice">Nur Multiple Choice</option><option value="match">Nur Zuordnungen</option><option value="calc">Nur Sizing/Bewertung</option></select></label>' +
    '</div><p id="qavail" class="muted"></p><button class="btn primary" id="qstart">Quiz starten</button></div>';
  $('#qcount').value = QCFG.count; $('#qfilter').value = QCFG.filter; $('#qtypes').value = QCFG.types;
  function upd() { $('#qavail').textContent = quizPool().length + ' passende Fragen verfügbar.'; }
  bindTopicChips('qchips', QCFG.topics, upd);
  $$('[data-sel]').forEach(function (b) {
    b.onclick = function () {
      var v = b.dataset.sel;
      setTopicList(QCFG.topics, v === 'all' ? TOPIC_KEYS : v === 'none' ? [] : examTopics(v), 'qchips'); upd();
    };
  });
  ['qcount', 'qfilter', 'qtypes'].forEach(function (id) { $('#' + id).onchange = function () { QCFG.count = $('#qcount').value; QCFG.filter = $('#qfilter').value; QCFG.types = $('#qtypes').value; upd(); }; });
  $('#qstart').onclick = function () { startRun(shuffle(quizPool()).slice(0, +QCFG.count), 'Quiz', '#/quiz'); };
  upd();
}

/* ================= Prüfungsfokus ================= */
function viewFocus() {
  var fq = QB.filter(function (q) { return q.fx; });
  var open = fq.filter(function (q) { return !(S.q[q.id] && S.q[q.id].last === 1); });
  var byT = {}; fq.forEach(function (q) { byT[q.t] = (byT[q.t] || 0) + 1; });
  main.innerHTML = '<h1>🎯 Prüfungsfokus</h1><div class="card"><p>Diese Auswahl bündelt Detailthemen mit besonders hoher Prüfungsrelevanz: die Aufgabenteilung in DSCC (Setup Service, Data Ops Manager, Block Storage), B10000-Hardwareregeln (Slots, Transceiver, Shelves, Upgrade-Pfade, Bestückung), Schreib-Cache und Express Layout, StoreOnce-Einstellungen und -Modelle, Zerto, VM Essentials, CLI-Statistik- und Alert-Befehle, Garantien sowie typische Sizing-Rechnungen. Alle Fragen sind eigene Formulierungen, belegt durch offizielle HPE-Dokumente.</p>' +
    '<div class="statrow"><div class="stat"><b>' + fq.length + '</b><span>Fokusfragen</span></div><div class="stat"><b>' + (fq.length - open.length) + '</b><span>zuletzt richtig</span></div><div class="stat"><b>' + open.length + '</b><span>offen oder falsch</span></div></div>' +
    '<div class="btnrow"><button class="btn primary" id="fa">Alle Fokusfragen üben</button><button class="btn" id="fo"' + (open.length ? '' : ' disabled') + '>Nur offene/falsche (' + open.length + ')</button><button class="btn" id="f20">20 zufällige</button></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Verteilung nach Thema</h3><div class="chips">' + Object.keys(byT).map(function (t) { return '<span class="chip">' + esc(topicName(t)) + ' <b>' + byT[t] + '</b></span>'; }).join('') + '</div></div>';
  $('#fa').onclick = function () { startRun(shuffle(fq), 'Prüfungsfokus', '#/fokus'); };
  $('#fo').onclick = function () { startRun(shuffle(open), 'Prüfungsfokus – offene Fragen', '#/fokus'); };
  $('#f20').onclick = function () { startRun(shuffle(fq).slice(0, 20), 'Prüfungsfokus (20)', '#/fokus'); };
}

/* ================= Fehlertraining ================= */
function viewWeak() {
  var w = weakQs();
  var byT = {}; w.forEach(function (q) { byT[q.t] = (byT[q.t] || 0) + 1; });
  main.innerHTML = '<h1>🩹 Fehlertraining</h1><p class="muted">Hier landen alle Fragen, die du zuletzt falsch beantwortet hast oder bei denen deine Trefferquote unter 50 % liegt. Richtig beantwortet verschwinden sie wieder.</p>' +
    (w.length ? '<div class="card"><div class="statrow"><div class="stat"><b>' + w.length + '</b><span>Fragen im Fehlerkorb</span></div></div><div class="btnrow"><button class="btn primary" id="wa">Alle üben</button><button class="btn" id="w10">10 zufällige</button></div></div>' +
      '<div class="card"><h3 style="margin-top:0">Nach Thema</h3>' + Object.keys(byT).map(function (t) { return '<div class="secrow"><div>' + esc(topicName(t)) + '</div><div class="small muted">' + byT[t] + ' Fragen</div><div><button class="btn" data-wt="' + t + '">Üben</button></div></div>'; }).join('') + '</div>'
      : '<div class="card"><p>Dein Fehlerkorb ist leer. 🎉 Bearbeite Quiz, Fokusfragen oder eine Prüfungssimulation – falsch beantwortete Fragen erscheinen dann hier.</p><a class="btn primary" href="#/quiz">Zum Quiz</a></div>');
  if ($('#wa')) {
    $('#wa').onclick = function () { startRun(shuffle(w), 'Fehlertraining', '#/fehler'); };
    $('#w10').onclick = function () { startRun(shuffle(w).slice(0, 10), 'Fehlertraining (10)', '#/fehler'); };
    $$('[data-wt]').forEach(function (b) { b.onclick = function () { startRun(shuffle(w.filter(function (q) { return q.t === b.dataset.wt; })), 'Fehlertraining: ' + TOPICS[b.dataset.wt].name, '#/fehler'); }; });
  }
}

/* ================= Prüfungsmodus ================= */
function examCounts(code) {
  var ex = EXAMS[code], N = ex.questions;
  var raw = ex.sections.map(function (s) { return s.pct / 100 * N; });
  var counts = raw.map(function (x) { return Math.max(1, Math.round(x)); });
  var diff = N - counts.reduce(function (a, b) { return a + b; }, 0);
  var order = raw.map(function (_, i) { return i; }).sort(function (a, b) { return raw[b] - raw[a]; });
  var k = 0;
  while (diff !== 0 && k < 1000) { var i = order[k % order.length]; if (diff > 0) { counts[i]++; diff--; } else if (counts[i] > 1) { counts[i]--; diff++; } k++; }
  return counts;
}
function weightedPick(pool, n) {
  return pool.map(function (q) { return { q: q, k: Math.random() * (q.fx ? 0.65 : 1) }; }).sort(function (a, b) { return a.k - b.k; }).slice(0, n).map(function (x) { return x.q; });
}
function buildExam(code, custom) {
  var items = [], used = {}, title, minutes, pass, sections;
  if (code === 'CUSTOM') {
    var pool = QB.filter(function (q) { return custom.topics.indexOf(q.t) >= 0; });
    weightedPick(pool, custom.count).forEach(function (q) { items.push({ id: q.id, sec: 0 }); });
    title = 'Individueller Test (' + items.length + ' Fragen)'; minutes = custom.minutes; pass = 63; sections = [{ name: 'Gemischte Themen', pct: 100 }];
  } else {
    var ex = EXAMS[code], counts = examCounts(code);
    ex.sections.forEach(function (s, si) {
      var pool2 = QB.filter(function (q) { return s.topics.indexOf(q.t) >= 0 && !used[q.id]; });
      var pick = weightedPick(pool2, counts[si]);
      if (pick.length < counts[si]) pick = pick.concat(weightedPick(QB.filter(function (q) { return !used[q.id] && pick.indexOf(q) < 0; }), counts[si] - pick.length));
      pick.forEach(function (q) { used[q.id] = 1; items.push({ id: q.id, sec: si }); });
    });
    title = ex.code + ' – ' + ex.name; minutes = ex.minutes; pass = ex.pass; sections = ex.sections.map(function (s) { return { name: s.name, pct: s.pct }; });
  }
  items = shuffle(items).map(function (x) { var q = Q[x.id]; return { id: x.id, sec: x.sec, inst: makeInst(q), ans: emptyAns(q), flag: false }; });
  var now = Date.now();
  return { code: code === 'CUSTOM' ? 'Test' : EXAMS[code].code, title: title, minutes: minutes, pass: pass, sections: sections, items: items, i: 0, start: now, end: now + minutes * 60000, pal: false };
}
var XCFG = { topics: TOPIC_KEYS.slice(), count: '30' };
function viewExam(p) {
  if (p[0] === 'run') return viewExamRun();
  if (p[0] === 'ergebnis') return viewExamResult();
  var s = S.session;
  if (s && Date.now() >= s.end) { finishExam(true); return; }
  var running = '';
  if (s) {
    var answered = s.items.filter(function (x) { return isAnswered(Q[x.id], x.ans); }).length;
    running = '<div class="card"><h3 style="margin-top:0">Laufende Prüfung</h3><p>' + esc(s.title) + ' – Restzeit ' + mmss(s.end - Date.now()) + ', ' + answered + ' von ' + s.items.length + ' beantwortet.</p><div class="btnrow"><a class="btn primary" href="#/pruefung/run">Fortsetzen</a><button class="btn danger" id="xabort">Abbrechen</button></div></div>';
  }
  var hist = S.exams.slice().reverse().slice(0, 12);
  main.innerHTML = '<h1>⏱️ Prüfungsmodus</h1><p class="muted">Realistische Simulation: gleiche Fragenzahl, Zeit und Bestehensgrenze wie die echte Prüfung, Fragen gewichtet nach den offiziellen Prüfungsbereichen. Kein Feedback bis zur Abgabe; Markieren und Zurückspringen ist erlaubt. Die Zeit läuft weiter, auch wenn du die Seite verlässt.</p>' + running +
    '<div class="grid wide">' + ['J82', 'J83', 'J81'].map(function (code) {
      var ex = EXAMS[code];
      return '<div class="card"><span class="badge fx">' + esc(ex.code) + '</span>' + (code === 'J81' ? '<span class="badge">Vorstufe ATP</span>' : '') + '<h3 style="margin:.4em 0">' + esc(ex.name) + '</h3><p class="muted small">' + ex.questions + ' Fragen · ' + ex.minutes + ' Minuten · Bestehen ab ' + ex.pass + ' % · ' + ex.sections.length + ' Bereiche</p><button class="btn primary" data-start="' + code + '">Simulation starten</button></div>';
    }).join('') + '</div>' +
    '<div class="card"><h3 style="margin-top:0">Individueller Test</h3><p class="muted small">Eigene Themen, Fragenzahl und Zeit (1,5 Minuten pro Frage wie im Original).</p>' + topicChips(XCFG.topics, 'xchips') +
    '<div class="calc-grid" style="margin-top:12px"><label class="field">Fragen<select id="xcount"><option>15</option><option>30</option><option>45</option><option>60</option></select></label></div><button class="btn" data-start="CUSTOM">Test starten</button></div>' +
    (hist.length ? '<div class="card"><h3 style="margin-top:0">Verlauf</h3><table class="tbl"><thead><tr><th>Datum</th><th>Prüfung</th><th>Ergebnis</th><th>Status</th><th>Dauer</th></tr></thead><tbody>' + hist.map(function (r) {
      return '<tr><td>' + new Date(r.date).toLocaleString('de-DE') + '</td><td>' + esc(r.code) + '</td><td>' + r.pct + ' % (' + r.correct + '/' + r.total + ')</td><td>' + (r.pass ? '<span class="badge ok">bestanden</span>' : '<span class="badge bad">nicht bestanden</span>') + '</td><td>' + mmss(r.secs * 1000) + '</td></tr>';
    }).join('') + '</tbody></table>' + (S.last ? '<a class="btn" href="#/pruefung/ergebnis">Letzte Auswertung ansehen</a>' : '') + '</div>' : '');
  $('#xcount').value = XCFG.count;
  bindTopicChips('xchips', XCFG.topics);
  $('#xcount').onchange = function () { XCFG.count = this.value; };
  $$('[data-start]').forEach(function (b) {
    b.onclick = function () {
      if (S.session && !confirm('Es läuft bereits eine Prüfung. Diese verwerfen und eine neue starten?')) return;
      var code = b.dataset.start;
      if (code === 'CUSTOM') {
        if (!XCFG.topics.length) { toast('Bitte mindestens ein Thema wählen.'); return; }
        var cnt = +XCFG.count; S.session = buildExam('CUSTOM', { topics: XCFG.topics.slice(), count: cnt, minutes: Math.round(cnt * 1.5) });
      } else S.session = buildExam(code);
      save(); go('#/pruefung/run');
    };
  });
  if ($('#xabort')) $('#xabort').onclick = function () { if (confirm('Laufende Prüfung wirklich abbrechen? Die Antworten gehen verloren.')) { S.session = null; save(); render(); } };
}
function updateTimer() {
  var s = S.session; if (!s) return;
  var rem = s.end - Date.now(), el = $('#timer');
  if (el) { el.textContent = mmss(rem); el.classList.toggle('low', rem < 5 * 60000); }
  if (rem <= 0) { clearInterval(TIMER); TIMER = null; finishExam(true); }
}
function viewExamRun() {
  var s = S.session;
  if (!s) return go('#/pruefung');
  if (Date.now() >= s.end) { finishExam(true); return; }
  if (s.i < 0 || s.i >= s.items.length) s.i = 0;
  var it = s.items[s.i], q = Q[it.id];
  var answered = s.items.filter(function (x) { return isAnswered(Q[x.id], x.ans); }).length;
  var flagged = s.items.filter(function (x) { return x.flag; }).length;
  main.innerHTML = '<div class="exam-bar"><div class="exam-top"><b>' + esc(s.title) + '</b><span class="timer" id="timer">' + mmss(s.end - Date.now()) + '</span><span class="muted small" id="xcnt">Beantwortet ' + answered + '/' + s.items.length + ' · Markiert ' + flagged + '</span><span style="flex:1"></span><button class="btn danger" id="xsubmit">Prüfung abgeben</button></div>' +
    '<details id="paldet"' + (s.pal ? ' open' : '') + '><summary class="small muted">Fragenübersicht (grün = beantwortet, Strich = markiert)</summary><div class="palette">' + s.items.map(function (x, k) {
      return '<button data-k="' + k + '" class="' + (isAnswered(Q[x.id], x.ans) ? 'ans ' : '') + (x.flag ? 'flag ' : '') + (k === s.i ? 'cur' : '') + '">' + (k + 1) + '</button>';
    }).join('') + '</div></details></div>' +
    '<div class="card qcard" id="qc"><div class="muted small">Frage ' + (s.i + 1) + ' von ' + s.items.length + (it.flag ? ' · ★ markiert' : '') + '</div>' + qHTML(q, it.inst, it.ans, 'exam') +
    '<div class="actions"><button class="btn" id="xprev"' + (s.i === 0 ? ' disabled' : '') + '>← Zurück</button><button class="btn" id="xflag">' + (it.flag ? '★ Markierung entfernen' : '☆ Markieren') + '</button><button class="btn primary" id="xnext">' + (s.i < s.items.length - 1 ? 'Weiter →' : 'Zur Abgabe') + '</button></div></div>' +
    '<p class="muted small">Tasten: A–F Antwort wählen · → / Enter weiter · ← zurück · M markieren</p>';
  var root = $('#qc');
  function rer() { clearInterval(TIMER); TIMER = null; viewExamRun(); }
  bindQuestion(root, q, it, function () {
    save();
    var pb = $('.palette button[data-k="' + s.i + '"]'); if (pb) pb.classList.toggle('ans', isAnswered(q, it.ans));
    var na = s.items.filter(function (x) { return isAnswered(Q[x.id], x.ans); }).length;
    $('#xcnt').textContent = 'Beantwortet ' + na + '/' + s.items.length + ' · Markiert ' + s.items.filter(function (x) { return x.flag; }).length;
  });
  function goTo(k) { s.i = Math.max(0, Math.min(s.items.length - 1, k)); save(); rer(); window.scrollTo(0, 0); }
  $('#xprev').onclick = function () { goTo(s.i - 1); };
  $('#xnext').onclick = function () { if (s.i < s.items.length - 1) goTo(s.i + 1); else submitExam(); };
  $('#xflag').onclick = function () { it.flag = !it.flag; save(); rer(); };
  $('#xsubmit').onclick = submitExam;
  $('#paldet').addEventListener('toggle', function () { s.pal = this.open; save(); });
  $$('.palette button').forEach(function (b) { b.onclick = function () { goTo(+b.dataset.k); }; });
  KEYH = function (e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); $('#xnext').click(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (s.i > 0) goTo(s.i - 1); return; }
    if (e.key === 'm' || e.key === 'M') { e.preventDefault(); $('#xflag').click(); return; }
    if (keySelect(e, root)) e.preventDefault();
  };
  updateTimer(); TIMER = setInterval(updateTimer, 1000);
}
function submitExam() {
  var s = S.session; if (!s) return;
  var open = s.items.filter(function (x) { return !isAnswered(Q[x.id], x.ans); }).length;
  var flagged = s.items.filter(function (x) { return x.flag; }).length;
  var msg = 'Prüfung jetzt abgeben?' + (open ? '\n' + open + ' Frage(n) sind unbeantwortet.' : '') + (flagged ? '\n' + flagged + ' Frage(n) sind markiert.' : '');
  if (confirm(msg)) finishExam(false);
}
function finishExam(auto) {
  var s = S.session; if (!s) return;
  var correct = 0;
  var secs = s.sections.map(function (x) { return { name: x.name, pct: x.pct, total: 0, correct: 0 }; });
  s.items.forEach(function (x) {
    var q = Q[x.id], ok = q ? isCorrect(q, x.ans) : false;
    x.ok = ok; if (ok) correct++;
    var sc = secs[x.sec] || secs[0]; sc.total++; if (ok) sc.correct++;
    if (q && isAnswered(q, x.ans)) recordQ(x.id, ok); else if (q) { var r = S.q[x.id] || { n: 0, c: 0 }; r.n++; r.last = 0; r.t = Date.now(); S.q[x.id] = r; }
  });
  var total = s.items.length, p = pct(correct, total);
  var res = { code: s.code, title: s.title, date: Date.now(), total: total, correct: correct, pct: p, pass: p >= s.pass, passMark: s.pass, secs: Math.round((Math.min(Date.now(), s.end) - s.start) / 1000), sections: secs, auto: !!auto };
  S.exams.push(res); if (S.exams.length > 60) S.exams.shift();
  S.last = { res: res, items: s.items.map(function (x) { return { id: x.id, inst: x.inst, ans: x.ans, flag: x.flag, ok: x.ok, sec: x.sec }; }) };
  S.session = null; save();
  if (auto) toast('Die Zeit ist abgelaufen – die Prüfung wurde automatisch abgegeben.');
  go('#/pruefung/ergebnis');
}
function viewExamResult() {
  var L = S.last; if (!L) return go('#/pruefung');
  var r = L.res;
  main.innerHTML = '<h1>Ergebnis der Prüfungssimulation</h1><div class="card"><div style="display:flex;gap:28px;flex-wrap:wrap;align-items:center"><div><div class="result-big ' + (r.pass ? 'pass' : 'fail') + '">' + r.pct + ' %</div><div class="muted">' + r.correct + ' von ' + r.total + ' richtig · Bestehensgrenze ' + r.passMark + ' %</div></div>' +
    '<div><h2 class="' + (r.pass ? 'pass' : 'fail') + '" style="margin:0">' + (r.pass ? 'Bestanden ✔' : 'Nicht bestanden') + '</h2><div class="muted">' + esc(r.title) + ' · Dauer ' + mmss(r.secs * 1000) + (r.auto ? ' · automatisch abgegeben' : '') + '</div></div></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Ergebnis nach Prüfungsbereich</h3>' + r.sections.filter(function (x) { return x.total; }).map(function (x) {
      var pp = pct(x.correct, x.total);
      return '<div class="secrow"><div class="small">' + esc(x.name) + ' <span class="muted">(' + x.pct + ' %)</span></div><div class="bar ' + (pp < 63 ? 'bad' : '') + '"><span style="width:' + pp + '%"></span></div><div><b>' + x.correct + '/' + x.total + '</b></div></div>';
    }).join('') + '</div>' +
    '<div class="btnrow noprint"><button class="btn primary" id="rwrong">Falsche Fragen üben</button><a class="btn" href="#/pruefung">Neue Prüfung</a></div>' +
    '<h2 style="margin-top:22px">Alle Fragen mit Lösung</h2><div class="chips" id="rfilter" style="margin-bottom:10px"><button class="chip on" data-f="all">Alle</button><button class="chip" data-f="bad">Nur falsche</button><button class="chip" data-f="flag">Nur markierte</button></div><div id="rlist"></div>';
  function list(f) {
    $('#rlist').innerHTML = L.items.map(function (x, k) {
      var q = Q[x.id]; if (!q) return '';
      if (f === 'bad' && x.ok) return ''; if (f === 'flag' && !x.flag) return '';
      return '<details class="rv"><summary>' + (k + 1) + '. ' + (x.ok ? '✔' : '✘') + (x.flag ? ' ★' : '') + ' ' + esc(q.q.slice(0, 110)) + (q.q.length > 110 ? '…' : '') + '</summary>' + qHTML(q, x.inst, x.ans, 'review') + explHTML(q, x.ok) + '</details>';
    }).join('') || '<p class="muted">Keine Einträge.</p>';
  }
  list('all');
  $$('#rfilter .chip').forEach(function (b) { b.onclick = function () { $$('#rfilter .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); list(b.dataset.f); }; });
  $('#rwrong').onclick = function () { var w = L.items.filter(function (x) { return !x.ok && Q[x.id]; }).map(function (x) { return Q[x.id]; }); startRun(shuffle(w), 'Falsche Fragen der Prüfung', '#/pruefung/ergebnis'); };
}

/* ================= Karteikarten ================= */
var FC = { topics: TOPIC_KEYS.slice(), mode: 'due', size: '25', queue: null, i: 0, flipped: false, stats: null };
var IV = [0, 1, 3, 7, 14, 30];
function viewCards(p) {
  if (p[0]) { var pre = p[0].split('+').filter(function (t) { return TOPICS[t]; }); if (pre.length) { FC.topics = pre; FC.queue = null; } }
  if (FC.queue && FC.i < FC.queue.length) return cardSession();
  FC.queue = null;
  var boxes = [0, 0, 0, 0, 0, 0];
  CARDS.forEach(function (c) { var st = S.cards[c.id]; boxes[st ? st.box : 0]++; });
  main.innerHTML = '<h1>🃏 Karteikarten</h1><p class="muted">Leitner-System mit 5 Fächern: Richtig gewusste Karten wandern in höhere Fächer und kommen seltener (1, 3, 7, 14, 30 Tage), nicht gewusste starten wieder in Fach 1.</p>' +
    (FC.stats ? '<div class="callout remember">Runde beendet: ' + FC.stats.known + ' gewusst, ' + FC.stats.again + ' noch einmal. Weiter so!</div>' : '') +
    '<div class="card"><div class="boxes"><div><b>' + boxes[0] + '</b>Neu</div><div><b>' + boxes[1] + '</b>Fach 1</div><div><b>' + boxes[2] + '</b>Fach 2</div><div><b>' + boxes[3] + '</b>Fach 3</div><div><b>' + (boxes[4] + boxes[5]) + '</b>Fach 4–5</div></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Themen</h3><div class="btnrow" style="margin:0 0 10px"><button class="btn" data-sel="all">Alle</button><button class="btn" data-sel="none">Keine</button></div>' + topicChips(FC.topics, 'cchips').replace(/<span class="muted">\d+<\/span>/g, '') +
    '<div class="calc-grid" style="margin-top:12px"><label class="field">Auswahl<select id="cmode"><option value="due">Fällige und neue Karten</option><option value="all">Alle Karten</option><option value="gloss">Nur Glossarbegriffe</option><option value="hard">Nur Fach 1 (schwierige)</option></select></label>' +
    '<label class="field">Kartenzahl pro Runde<select id="csize"><option value="15">15</option><option value="25">25</option><option value="50">50</option><option value="999">Alle</option></select></label></div>' +
    '<p id="cavail" class="muted"></p><button class="btn primary" id="cstart">Runde starten</button></div>';
  $('#cmode').value = FC.mode; $('#csize').value = FC.size;
  function pool() {
    return CARDS.filter(function (c) {
      if (FC.topics.indexOf(c.t) < 0) return false;
      var st = S.cards[c.id];
      if (FC.mode === 'due') return isDue(c);
      if (FC.mode === 'gloss') return !!c.g;
      if (FC.mode === 'hard') return st && st.box === 1;
      return true;
    });
  }
  function upd() { $('#cavail').textContent = pool().length + ' Karten verfügbar.'; }
  bindTopicChips('cchips', FC.topics, upd);
  $$('[data-sel]').forEach(function (b) { b.onclick = function () { setTopicList(FC.topics, b.dataset.sel === 'all' ? TOPIC_KEYS : [], 'cchips'); upd(); }; });
  $('#cmode').onchange = function () { FC.mode = this.value; upd(); };
  $('#csize').onchange = function () { FC.size = this.value; };
  $('#cstart').onclick = function () {
    var list = shuffle(pool()).slice(0, +FC.size);
    if (!list.length) { toast('Keine Karten in dieser Auswahl – wähle „Alle Karten“.'); return; }
    FC.queue = list.map(function (c) { return c.id; }); FC.i = 0; FC.flipped = false; FC.stats = { known: 0, again: 0 };
    cardSession();
  };
  upd();
}
function cardSession() {
  var c = null; var id = FC.queue[FC.i];
  CARDS.forEach(function (x) { if (x.id === id) c = x; });
  if (!c) { FC.i++; if (FC.i < FC.queue.length) return cardSession(); FC.queue = null; return viewCards([]); }
  var st = S.cards[c.id];
  main.innerHTML = '<div class="run-head"><div><h2 style="margin-bottom:2px">Karteikarten</h2><div class="muted small">Karte ' + (FC.i + 1) + ' von ' + FC.queue.length + ' · ' + esc(topicName(c.t)) + ' · ' + (st ? 'Fach ' + st.box : 'neu') + ' · Leertaste umdrehen, 1–4 bewerten</div></div><button class="btn ghost" id="cend">Runde beenden</button></div>' +
    '<div class="progress"><span style="width:' + (FC.i / FC.queue.length * 100).toFixed(1) + '%"></span></div>' +
    '<div class="fc-wrap"><div class="flash' + (FC.flipped ? ' flipped' : '') + '" id="flash" tabindex="0" role="button" aria-label="Karte umdrehen"><div class="face front"><div class="term">' + esc(c.f) + '</div>' + (c.en ? '<div class="en">EN: ' + esc(c.en) + '</div>' : '') + '<div class="muted small" style="margin-top:14px">Klicken zum Umdrehen</div></div>' +
    '<div class="face back"><div class="def">' + esc(c.b) + '</div></div></div></div>' +
    '<div class="rate" id="rate" style="' + (FC.flipped ? '' : 'visibility:hidden') + '"><button class="btn" data-r="0">Nochmal<small>1 · zurück in Fach 1</small></button><button class="btn" data-r="1">Schwer<small>2 · morgen wieder</small></button><button class="btn primary" data-r="2">Gewusst<small>3 · nächstes Fach</small></button><button class="btn" data-r="3">Leicht<small>4 · zwei Fächer weiter</small></button></div>';
  function flip() { FC.flipped = !FC.flipped; $('#flash').classList.toggle('flipped', FC.flipped); $('#rate').style.visibility = FC.flipped ? '' : 'hidden'; }
  function rate(r) {
    var s2 = S.cards[c.id] || { box: 0, due: 0 }, box = s2.box || 0;
    if (r === 0) box = 1; else if (r === 1) box = Math.max(1, box); else if (r === 2) box = Math.min(5, Math.max(1, box + 1)); else box = Math.min(5, Math.max(2, box + 2));
    s2.box = box; s2.due = Date.now() + (r === 0 ? 0 : r === 1 ? DAY : IV[box] * DAY); s2.n = (s2.n || 0) + 1; S.cards[c.id] = s2;
    if (r === 0) { FC.queue.push(c.id); FC.stats.again++; } else FC.stats.known++;
    activity(); save();
    FC.i++; FC.flipped = false;
    if (FC.i >= FC.queue.length) { FC.queue = null; buildNav('karten'); return viewCards([]); }
    cardSession();
  }
  $('#flash').onclick = flip;
  $$('#rate [data-r]').forEach(function (b) { b.onclick = function () { rate(+b.dataset.r); }; });
  $('#cend').onclick = function () { FC.queue = null; viewCards([]); };
  KEYH = function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); return; }
    if (FC.flipped && /^[1-4]$/.test(e.key)) { e.preventDefault(); rate(+e.key - 1); }
  };
}

/* ================= Zuordnen ================= */
function viewMatch(p) {
  var sets = QB.filter(function (q) { return q.type === 'match'; });
  if (p[0] && Q[p[0]] && Q[p[0]].type === 'match') return playMatch(Q[p[0]], sets);
  main.innerHTML = '<h1>🔗 Zuordnen</h1><p class="muted">Klicke links einen Begriff und rechts die passende Beschreibung. Fehlversuche und Zeit werden gezählt – versuche, jedes Set fehlerfrei zu schaffen.</p><div class="btnrow"><button class="btn primary" id="mrand">Zufälliges Set</button></div>' +
    '<div class="grid wide" style="margin-top:12px">' + sets.map(function (q) {
      var b = S.mg[q.id];
      return '<a class="tile" href="#/zuordnen/' + q.id + '"><span class="t-title">' + esc(q.q) + '</span><span class="t-sub">' + q.pairs.length + ' Paare · ' + esc(topicName(q.t)) + '</span>' + (b ? '<span class="badge ' + (b.best === 0 ? 'ok' : '') + '">Bestes Ergebnis: ' + b.best + ' Fehler</span>' : '') + '</a>';
    }).join('') + '</div>';
  $('#mrand').onclick = function () { var s = sets[Math.floor(Math.random() * sets.length)]; go('#/zuordnen/' + s.id); };
}
function playMatch(q, sets) {
  var lefts = shuffle(q.pairs.map(function (pp, i) { return i; }));
  var rights = shuffle(q.pairs.map(function (pp, i) { return { t: pp[1], i: i }; }));
  var sel = -1, mistakes = 0, done = 0, t0 = Date.now();
  main.innerHTML = '<div class="small"><a href="#/zuordnen">← Alle Sets</a></div><h2>' + esc(q.q) + '</h2><p class="muted small" id="mstat">Fehler: 0 · Gelöst: 0/' + q.pairs.length + '</p>' +
    '<div class="mgame"><div class="col">' + lefts.map(function (i) { return '<button class="mtile" data-l="' + i + '">' + esc(q.pairs[i][0]) + '</button>'; }).join('') + '</div>' +
    '<div class="col">' + rights.map(function (r, k) { return '<button class="mtile" data-r="' + k + '">' + esc(r.t) + '</button>'; }).join('') + '</div></div><div id="mres"></div>';
  function stat() { $('#mstat').textContent = 'Fehler: ' + mistakes + ' · Gelöst: ' + done + '/' + q.pairs.length; }
  $$('[data-l]').forEach(function (b) {
    b.onclick = function () { if (b.classList.contains('done')) return; $$('[data-l]').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); sel = +b.dataset.l; };
  });
  $$('[data-r]').forEach(function (b) {
    b.onclick = function () {
      if (b.classList.contains('done')) return;
      if (sel < 0) { toast('Bitte zuerst links einen Begriff wählen.'); return; }
      var r = rights[+b.dataset.r];
      if (r.t === q.pairs[sel][1]) {
        b.classList.add('done'); b.disabled = true;
        var lb = $('[data-l="' + sel + '"]'); lb.classList.remove('sel'); lb.classList.add('done'); lb.disabled = true;
        sel = -1; done++; stat();
        if (done === q.pairs.length) finish();
      } else {
        mistakes++; stat(); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
      }
    };
  });
  function finish() {
    var secs = Math.round((Date.now() - t0) / 1000);
    var prev = S.mg[q.id]; S.mg[q.id] = { best: prev ? Math.min(prev.best, mistakes) : mistakes, t: Date.now() };
    recordQ(q.id, mistakes === 0); save();
    var others = sets.filter(function (x) { return x.id !== q.id; }); var nx = others[Math.floor(Math.random() * others.length)];
    $('#mres').innerHTML = '<div class="callout ' + (mistakes ? 'tip' : 'remember') + '" style="margin-top:16px"><b>' + (mistakes ? 'Geschafft mit ' + mistakes + ' Fehler(n)' : 'Perfekt – fehlerfrei!') + '</b> in ' + secs + ' Sekunden.<p style="margin-top:6px">' + esc(q.e) + '</p><div class="btnrow"><a class="btn primary" href="#/zuordnen/' + nx.id + '">Nächstes Set</a><button class="btn" id="mre">Nochmal</button><a class="btn" href="#/zuordnen">Übersicht</a></div></div>';
    $('#mre').onclick = function () { playMatch(q, sets); };
  }
}

/* ================= Lückentext ================= */
var CZ = { topic: 'all', bank: false, items: null, checked: false };
function parseCloze(s) {
  var parts = [], last = 0, re = /\[\[(.+?)\]\]/g, m;
  while ((m = re.exec(s))) { parts.push({ t: s.slice(last, m.index) }); parts.push({ b: m[1].split('|') }); last = re.lastIndex; }
  parts.push({ t: s.slice(last) });
  return parts;
}
function norm(x) { return String(x).toLowerCase().replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim().replace(/[.!]+$/, ''); }
function viewCloze() {
  var topics = []; CLOZE.forEach(function (c) { if (topics.indexOf(c.t) < 0) topics.push(c.t); });
  function newRound() {
    var pool = CLOZE.filter(function (c) { return CZ.topic === 'all' || c.t === CZ.topic; });
    CZ.items = shuffle(pool).slice(0, 8).map(function (c) { return { c: c, parts: parseCloze(c.s) }; }); CZ.checked = false;
  }
  if (!CZ.items) newRound();
  var bankWords = [];
  CZ.items.forEach(function (it) { it.parts.forEach(function (pp) { if (pp.b) bankWords.push(pp.b[0]); }); });
  main.innerHTML = '<h1>✏️ Lückentext</h1><p class="muted">Ergänze die fehlenden Begriffe und Zahlen. Groß-/Kleinschreibung spielt keine Rolle. Mit der Wortbank wird es leichter.</p>' +
    '<div class="card"><div class="calc-grid"><label class="field">Thema<select id="ztopic"><option value="all">Alle Themen</option>' + topics.map(function (t) { return '<option value="' + t + '">' + esc(topicName(t)) + '</option>'; }).join('') + '</select></label>' +
    '<label class="field">Hilfe<select id="zbank"><option value="0">Ohne Wortbank</option><option value="1">Mit Wortbank</option></select></label></div>' +
    (CZ.bank ? '<div class="wordbank">' + shuffle(bankWords).map(function (w) { return '<button class="chip" data-w="' + esc(w) + '">' + esc(w) + '</button>'; }).join('') + '</div>' : '') +
    '<div id="zlist">' + CZ.items.map(function (it, k) {
      var bi = 0;
      return '<div class="cloze-item">' + (k + 1) + '. ' + it.parts.map(function (pp) {
        if (pp.t != null) return esc(pp.t);
        var id = 'z' + k + '_' + (bi++);
        return '<input type="text" id="' + id + '" data-alt="' + esc(JSON.stringify(pp.b)) + '" autocomplete="off" aria-label="Lücke">';
      }).join('') + ' ' + topicBadge(it.c.t) + '</div>';
    }).join('') + '</div><div class="btnrow"><button class="btn primary" id="zcheck">Prüfen</button><button class="btn" id="znew">Neue Runde</button><button class="btn" id="zshow">Lösungen zeigen</button></div><p id="zres" class="muted" style="margin-top:10px"></p></div>';
  $('#ztopic').value = CZ.topic; $('#zbank').value = CZ.bank ? '1' : '0';
  $('#ztopic').onchange = function () { CZ.topic = this.value; newRound(); viewCloze(); };
  $('#zbank').onchange = function () { CZ.bank = this.value === '1'; viewCloze(); };
  var lastFocus = null;
  $$('#zlist input').forEach(function (inp) { inp.addEventListener('focus', function () { lastFocus = inp; }); });
  $$('[data-w]').forEach(function (b) { b.onclick = function () { var target = lastFocus || $$('#zlist input').filter(function (i) { return !i.value; })[0]; if (target) { target.value = b.dataset.w; target.focus(); } }; });
  function check(reveal) {
    var ok = 0, all = 0;
    $$('#zlist input').forEach(function (inp) {
      var alts = JSON.parse(inp.dataset.alt); all++;
      var good = alts.some(function (a) { return norm(a) === norm(inp.value); });
      inp.classList.toggle('ok', good); inp.classList.toggle('bad', !good);
      var sol = inp.nextElementSibling && inp.nextElementSibling.classList.contains('cloze-sol') ? inp.nextElementSibling : null;
      if (!good && (reveal || inp.value)) { if (!sol) { sol = document.createElement('span'); sol.className = 'cloze-sol'; inp.after(sol); } sol.textContent = '→ ' + alts[0]; }
      else if (sol) sol.remove();
      if (good) ok++;
    });
    $('#zres').textContent = ok + ' von ' + all + ' Lücken richtig.';
    if (!reveal && !CZ.checked) { CZ.checked = true; activity(); save(); }
  }
  $('#zcheck').onclick = function () { check(false); };
  $('#zshow').onclick = function () { check(true); };
  $('#znew').onclick = function () { newRound(); viewCloze(); };
}

/* ================= Fallstudien ================= */
function viewScenarios(p) {
  var scs = A.scenarios || [];
  if (p[0] && SCN[p[0]]) {
    var qs = QB.filter(function (q) { return q.sc === p[0]; });
    startRun(qs, 'Fallstudie: ' + SCN[p[0]].title, '#/szenarien');
    return;
  }
  main.innerHTML = '<h1>🏢 Fallstudien</h1><p class="muted">Szenariobasierte Fragen wie in den ASE-Prüfungen: Kundensituation lesen, Anforderungen erkennen, passende HPE-Lösung, Sizing und Validierung ableiten.</p><div class="grid wide">' +
    scs.map(function (s) {
      var n = QB.filter(function (q) { return q.sc === s.id; }).length;
      var done = QB.filter(function (q) { return q.sc === s.id && S.q[q.id] && S.q[q.id].last === 1; }).length;
      return '<a class="tile" href="#/szenarien/' + s.id + '"><span class="t-title">' + esc(s.title) + '</span><span class="t-sub">' + s.text.replace(/<[^>]+>/g, '').slice(0, 170) + '…</span><span>' + topicBadge(s.t) + '<span class="badge">' + n + ' Fragen</span>' + (done ? '<span class="badge ok">' + done + ' richtig</span>' : '') + '</span></a>';
    }).join('') + '</div>';
}

/* ================= Glossar ================= */
function viewGlossary() {
  var items = CARDS.filter(function (c) { return c.g; }).sort(function (a, b) { return a.f.localeCompare(b.f, 'de'); });
  main.innerHTML = '<h1>📖 Glossar</h1><p class="muted">' + items.length + ' Fachbegriffe mit englischer Bezeichnung – die echte Prüfung ist auf Englisch.</p>' +
    '<div class="card"><input type="search" id="gsearch" placeholder="Begriff suchen (deutsch oder englisch) …" style="width:100%"><div id="glist" style="margin-top:8px"></div></div>';
  function draw() {
    var term = norm($('#gsearch').value);
    var list = items.filter(function (c) { return !term || norm(c.f + ' ' + (c.en || '') + ' ' + c.b).indexOf(term) >= 0; });
    $('#glist').innerHTML = list.map(function (c) {
      return '<div class="gl-item"><h4>' + esc(c.f) + (c.en && c.en !== c.f ? '<span class="gl-en">EN: ' + esc(c.en) + '</span>' : '') + '</h4><div>' + esc(c.b) + '</div><div style="margin-top:4px">' + topicBadge(c.t) + '</div></div>';
    }).join('') || '<p class="muted">Kein Treffer.</p>';
  }
  $('#gsearch').addEventListener('input', draw);
  draw();
}

/* ================= Sizing-Rechner ================= */
function num(id) { var v = String($('#' + id).value).replace(',', '.'); var n = parseFloat(v); return isNaN(n) ? 0 : n; }
var CALCTASK = null;
function viewCalc() {
  main.innerHTML = '<h1>🧮 Sizing-Rechner</h1><p class="muted">Rechner für typische Sizing-Aufgaben und ein Generator für Übungsaufgaben. Die Formeln entsprechen dem Kapitel „Kundenumgebung bewerten und Sizing“.</p>' +
    '<div class="card"><h3 style="margin-top:0">🎲 Rechenaufgabe üben</h3><div id="ctask"></div></div>' +
    '<div class="card"><h3 style="margin-top:0">RAID- und Kapazitätsrechner</h3><div class="calc-grid">' +
    '<label class="field">Anzahl Laufwerke<input type="number" id="r_n" value="24" min="1"></label>' +
    '<label class="field">Kapazität je Laufwerk (TB)<input type="text" id="r_s" value="7,68"></label>' +
    '<label class="field">RAID<select id="r_t"><option value="6">RAID 6</option><option value="5">RAID 5</option><option value="10">RAID 1/10</option></select></label>' +
    '<label class="field">Set-Größe (Laufwerke je Set)<input type="number" id="r_set" value="12" min="2"></label>' +
    '<label class="field">Spare-Laufwerke<input type="number" id="r_sp" value="0" min="0"></label>' +
    '<label class="field">Datenreduktion (x:1)<input type="text" id="r_dr" value="4"></label></div><div class="calc-out" id="r_out"></div></div>' +
    '<div class="card"><h3 style="margin-top:0">IOPS- und Durchsatzrechner</h3><div class="calc-grid">' +
    '<label class="field">Front-end-IOPS<input type="number" id="i_f" value="10000"></label>' +
    '<label class="field">Leseanteil (%)<input type="number" id="i_r" value="70"></label>' +
    '<label class="field">Write Penalty<select id="i_p"><option value="2">2 (RAID 1/10)</option><option value="4">4 (RAID 5)</option><option value="6" selected>6 (RAID 6)</option></select></label>' +
    '<label class="field">IOPS je Laufwerk<select id="i_d"><option value="80">7.2K HDD ≈ 80</option><option value="150" selected>10K HDD ≈ 150</option><option value="180">15K HDD ≈ 180</option><option value="20000">SAS-SSD ≈ 20.000</option></select></label>' +
    '<label class="field">Blockgröße (KB)<input type="number" id="i_b" value="8"></label></div><div class="calc-out" id="i_out"></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Wachstum, Snapshots und Replikation</h3><div class="calc-grid">' +
    '<label class="field">Kapazität heute (TB)<input type="text" id="g_c" value="100"></label><label class="field">Wachstum pro Jahr (%)<input type="text" id="g_r" value="25"></label><label class="field">Jahre<input type="number" id="g_y" value="3"></label>' +
    '<label class="field">Änderungsrate pro Tag (%)<input type="text" id="s_c" value="5"></label><label class="field">Snapshot-Aufbewahrung (Tage)<input type="number" id="s_d" value="7"></label>' +
    '<label class="field">Änderungsmenge pro Tag (GB)<input type="text" id="p_g" value="500"></label><label class="field">Replikationsfenster (h)<input type="text" id="p_h" value="8"></label><label class="field">Overhead (%)<input type="text" id="p_o" value="25"></label></div><div class="calc-out" id="g_out"></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Verfügbarkeit</h3><div class="calc-grid"><label class="field">Verfügbarkeit (%)<input type="text" id="a_p" value="99,999"></label></div><div class="calc-out" id="a_out"></div></div>';
  function calc() {
    var n = num('r_n'), sz = num('r_s'), t = $('#r_t').value, set = Math.max(2, num('r_set')), sp = num('r_sp'), dr = Math.max(1, num('r_dr'));
    var avail = Math.max(0, n - sp), usable = 0, note = '';
    if (t === '10') { usable = Math.floor(avail / 2) * sz; note = 'Spiegelung: 50 % Effizienz.'; }
    else { var par = t === '6' ? 2 : 1; var sets = Math.floor(avail / set); usable = sets * (set - par) * sz; var rest = avail - sets * set; note = sets + ' Set(s) à ' + (set - par) + '+' + par + (rest ? ', ' + rest + ' Laufwerk(e) bleiben ungenutzt' : '') + '.'; }
    $('#r_out').innerHTML = 'Roh: <b>' + fmt(n * sz, 2) + ' TB</b> · Nutzbar: <b>' + fmt(usable, 2) + ' TB</b> (≈ ' + fmt(usable / 1.0995, 2) + ' TiB) · Effektiv bei ' + fmt(dr) + ':1: <b>' + fmt(usable * dr, 1) + ' TB</b><br><span class="muted small">' + note + ' Sizing-Tools ziehen zusätzlich Sparing, Metadaten und Headroom ab.</span>';
    var f = num('i_f'), rp = Math.min(100, Math.max(0, num('i_r'))) / 100, pen = +$('#i_p').value, d = +$('#i_d').value, bs = num('i_b');
    var be = f * rp + f * (1 - rp) * pen;
    $('#i_out').innerHTML = 'Back-end-IOPS: <b>' + fmt(be, 0) + '</b> (' + fmt(f * rp, 0) + ' Lesen + ' + fmt(f * (1 - rp), 0) + ' × ' + pen + ' Schreiben) · Laufwerke: <b>' + Math.ceil(be / d) + '</b> · Durchsatz: <b>' + fmt(f * bs / 1024, 1) + ' MB/s</b>';
    var c = num('g_c'), r = num('g_r') / 100, y = num('g_y');
    var rows = ''; for (var k = 1; k <= Math.min(10, y); k++) rows += 'Jahr ' + k + ': ' + fmt(c * Math.pow(1 + r, k), 1) + ' TB · ';
    var snap = c * num('s_c') / 100 * num('s_d');
    var mbit = num('p_g') * 1000 * 8 / (Math.max(0.1, num('p_h')) * 3600);
    $('#g_out').innerHTML = 'Kapazität nach ' + y + ' Jahren: <b>' + fmt(c * Math.pow(1 + r, y), 1) + ' TB</b><br><span class="small muted">' + rows.replace(/ · $/, '') + '</span><br>Snapshot-Reserve (heutige Kapazität): <b>' + fmt(snap, 1) + ' TB</b><br>Replikationsbandbreite: <b>' + fmt(mbit, 0) + ' Mbit/s</b> netto, mit Overhead <b>' + fmt(mbit * (1 + num('p_o') / 100), 0) + ' Mbit/s</b>';
    var ap = num('a_p') / 100, down = (1 - ap) * 525600;
    $('#a_out').innerHTML = 'Ausfallzeit pro Jahr: <b>' + (down >= 60 ? fmt(down / 60, 2) + ' h' : down >= 1 ? fmt(down, 2) + ' min' : fmt(down * 60, 1) + ' s') + '</b> · pro Monat: <b>' + fmt(down / 12, 2) + ' min</b> · pro Woche: <b>' + fmt(down / 52.14 * 60, 1) + ' s</b>';
  }
  $$('main input, main select').forEach(function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc(); newTask();
}
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function makeTask() {
  var type = rnd(['be', 'tp', 'gr', 'sn', 'r6', 'av', 'rep', 'eff']), t = {};
  if (type === 'be') { var f = rnd([5, 8, 10, 12, 15, 20, 25, 30]) * 1000, rd = rnd([50, 60, 70, 80]), pen = rnd([[2, 'RAID 10'], [4, 'RAID 5'], [6, 'RAID 6']]); t.q = f.toLocaleString('de-DE') + ' Front-end-IOPS, ' + rd + ' % Lesen, ' + pen[1] + '. Wie viele Back-end-IOPS entstehen?'; t.a = f * rd / 100 + f * (100 - rd) / 100 * pen[0]; t.u = 'IOPS'; t.how = 'Lesen ' + fmt(f * rd / 100, 0) + ' + Schreiben ' + fmt(f * (100 - rd) / 100, 0) + ' × ' + pen[0]; }
  if (type === 'tp') { var io = rnd([5, 10, 15, 20, 40, 50]) * 1000, bs = rnd([8, 16, 32, 64, 128, 256]); t.q = io.toLocaleString('de-DE') + ' IOPS mit ' + bs + ' KB Blockgröße. Welcher Durchsatz in MB/s (1 MB = 1024 KB)?'; t.a = io * bs / 1024; t.u = 'MB/s'; t.how = io + ' × ' + bs + ' KB ÷ 1024'; }
  if (type === 'gr') { var c = rnd([20, 50, 80, 100, 150, 200, 300]), r = rnd([10, 15, 20, 25, 30, 40]), y = rnd([2, 3, 4, 5]); t.q = c + ' TB wachsen ' + r + ' % pro Jahr. Wie viel Kapazität nach ' + y + ' Jahren (TB)?'; t.a = c * Math.pow(1 + r / 100, y); t.u = 'TB'; t.how = c + ' × ' + fmt(1 + r / 100, 2) + '^' + y; }
  if (type === 'sn') { var v = rnd([10, 20, 50, 80, 100, 200]), ch = rnd([2, 3, 4, 5, 8, 10]), d = rnd([3, 5, 7, 10, 14]); t.q = v + ' TB Daten, ' + ch + ' % tägliche Änderungsrate, Snapshots ' + d + ' Tage aufbewahrt. Snapshot-Kapazität (TB)?'; t.a = v * ch / 100 * d; t.u = 'TB'; t.how = v + ' × ' + ch + ' % × ' + d; }
  if (type === 'r6') { var nn = rnd([12, 24, 36, 48]), s = rnd([1.92, 3.84, 7.68, 15.36]); t.q = nn + ' SSDs à ' + fmt(s, 2) + ' TB in RAID 6 (10+2). Nutzkapazität vor Overhead (TB)?'; t.a = nn / 12 * 10 * s; t.u = 'TB'; t.how = (nn / 12) + ' Sets × 10 Datenlaufwerke × ' + fmt(s, 2) + ' TB'; }
  if (type === 'av') { var ap = rnd([99.9, 99.95, 99.99, 99.999]); t.q = 'Wie viele Minuten Ausfall pro Jahr erlaubt eine Verfügbarkeit von ' + fmt(ap, 3) + ' %?'; t.a = 525600 * (1 - ap / 100); t.u = 'min'; t.how = '525.600 min × ' + fmt(100 - ap, 3) + ' %'; }
  if (type === 'rep') { var g = rnd([100, 200, 500, 800, 1000, 2000]), h = rnd([4, 6, 8, 12, 24]); t.q = g + ' GB Änderungen pro Tag sollen in ' + h + ' Stunden repliziert werden. Benötigte Bandbreite ohne Overhead (Mbit/s, 1 GB = 1000 MB)?'; t.a = g * 1000 * 8 / (h * 3600); t.u = 'Mbit/s'; t.how = g + ' × 1000 × 8 ÷ (' + h + ' × 3600)'; }
  if (type === 'eff') { var e = rnd([100, 200, 300, 400, 600]), ratio = rnd([2, 3, 4, 5]); t.q = 'Ein Kunde braucht ' + e + ' TB effektive Kapazität bei ' + ratio + ':1 Datenreduktion. Wie viel nutzbare Kapazität (TB) ist nötig?'; t.a = e / ratio; t.u = 'TB'; t.how = e + ' ÷ ' + ratio; }
  return t;
}
function newTask() {
  CALCTASK = makeTask();
  $('#ctask').innerHTML = '<p><b>' + esc(CALCTASK.q) + '</b></p><div class="btnrow" style="align-items:center"><input type="text" id="t_in" placeholder="Ergebnis in ' + esc(CALCTASK.u) + '" style="width:200px"><button class="btn primary" id="t_ok">Prüfen</button><button class="btn" id="t_new">Neue Aufgabe</button></div><p id="t_res" style="margin-top:8px"></p>';
  function check() {
    var raw = String($('#t_in').value).trim().replace(/\s/g, ''), v;
    if (raw.indexOf(',') >= 0) v = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) v = parseFloat(raw.replace(/\./g, ''));
    else v = parseFloat(raw);
    if (isNaN(v)) { toast('Bitte eine Zahl eingeben.'); return; }
    var ok = Math.abs(v - CALCTASK.a) <= Math.max(0.05, Math.abs(CALCTASK.a) * 0.02);
    $('#t_res').innerHTML = (ok ? '<span class="pass"><b>✔ Richtig!</b></span>' : '<span class="fail"><b>✘ Nicht ganz.</b></span>') + ' Lösung: <b>' + fmt(CALCTASK.a, 2) + ' ' + esc(CALCTASK.u) + '</b> <span class="muted">(' + esc(CALCTASK.how) + ')</span>';
    activity(); save();
  }
  $('#t_ok').onclick = check;
  $('#t_in').addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
  $('#t_new').onclick = newTask;
}

/* ================= Spickzettel ================= */
function viewCheat() {
  main.innerHTML = '<div class="run-head"><h1>📝 Spickzettel</h1><button class="btn noprint" onclick="window.print()">Drucken / als PDF</button></div><p class="muted noprint">Die wichtigsten Zahlen und Fakten kompakt – ideal für die letzte Wiederholung vor der Prüfung.</p><div class="content">' +
    '<div class="card"><h3 style="margin-top:0">Prüfungen</h3><table><tr><th></th><th>HPE0-J82 Storage Architect</th><th>HPE0-J83 Storage Integrator Solutions</th></tr><tr><td>Fragen / Zeit / Bestehen</td><td>60 / 90 min / 63 %</td><td>60 / 90 min / 63 %</td></tr><tr><td>Schwerpunkt</td><td>40 % Kundenumgebung bewerten, 33 % HPE-Architekturen</td><td>Breit: Produkte 17 %, Trends/Sizing 18 %, Installation 13 %, Betrieb 10 %</td></tr><tr><td>Fragetypen</td><td>Matching, MC einfach/mehrfach, Point and Click</td><td>Szenariobasiertes MC, Matching, Point and Click</td></tr></table></div>' +
    '<div class="card"><h3 style="margin-top:0">B10000 in Zahlen</h3><table>' +
    '<tr><td>Modelle</td><td>Switchless: B10120 (8 Kerne, keine JBOFs), B10130 (16), B10140 (32), bis 2 JBOFs · Switched: B10230 (16), B10240 (32), bis 16 JBOFs, 2–4 Knoten (ab R6: 6)</td></tr>' +
    '<tr><td>Kapazität</td><td>15,36 TB bis ≈ 5,8 PB roh; effektiv bis ≈ 16,6 PB (4:1)</td></tr>' +
    '<tr><td>Laufwerke</td><td>min. 8 je Chassis, +2er-Schritte bis 24; TLC 1,92–15,36 TB (1,0 DWPD), QLC 15,36/30,72 TB (0,26 DWPD); nicht mischen</td></tr>' +
    '<tr><td>RAID/Daten</td><td>nur RAID 6 (10+2), 1-GiB-Chunklets, 16-KiB-Seiten, VV max. 64 TiB, write-through-Cache</td></tr>' +
    '<tr><td>Ports</td><td>Slot 3/4 Host (FC 32/64, 10/25GbE: iSCSI, NVMe/TCP, NFS), Slot 1/2 Backend 100GbE RoCEv2</td></tr>' +
    '<tr><td>Software</td><td>ArcusOS all-inclusive (Remote Copy, Peer Persistence, Peer Motion, Priority Optimization, Virtual Domains, Virtual Lock, 2FA); Encryption-LTU separat, nicht deaktivierbar</td></tr>' +
    '<tr><td>Garantien</td><td>100 % Verfügbarkeit, StoreMore 4:1 (R6: 5:1), Controller-Refresh, 30 Tage Zufriedenheit, Cyber Resiliency (30 min), Energy, Zero RTO/RPO</td></tr>' +
    '<tr><td>Gewährleistung</td><td>1 Jahr nur Teile; Self-Install nur switchless</td></tr></table></div>' +
    '<div class="card"><h3 style="margin-top:0">MSA Gen7</h3><table><tr><td>Hardware</td><td>2 Controller, 8 Host-Ports, 48 GB Cache, bis 9 Gehäuse, 240 SFF/120 LFF, 7,37 PB</td></tr><tr><td>Software</td><td>RAID 1/5/6/10/MSA-DP+ (RAID 0 nur Read Cache), 64 Snapshots (512 mit ADS), Remote Snap (Many-to-1 bis 4), Tiering mit ADS</td></tr><tr><td>Modelle</td><td>2070 (FC 16/32, iSCSI 10/25, 10GBase-T, SAS), Flash Bundles 23/46/92 TB, 2072 Hybrid inkl. ADS</td></tr></table></div>' +
    '<div class="card"><h3 style="margin-top:0">StoreOnce Gen5</h3><table><tr><td>3720</td><td>18–72 TB · 15 TB/h · Zweigstelle</td></tr><tr><td>3760</td><td>108–216 TB · 25 TB/h · Mid-Range</td></tr><tr><td>5720</td><td>144–576 TB · 70 TB/h · Enterprise</td></tr><tr><td>7700</td><td>92–552 TB · 300 TB/h · All-Flash</td></tr><tr><td>Fakten</td><td>4-KB-Chunks, Catalyst/VTL/NFS/SMB, Federation bis 40, IPsec nur Catalyst, Dual Authorization, Secure Erase, 3 Jahre Garantie</td></tr></table></div>' +
    '<div class="card"><h3 style="margin-top:0">Formeln und Faustwerte</h3><div class="formula">Back-end-IOPS = R + W × Penalty (RAID 10 = 2 · RAID 5 = 4 · RAID 6 = 6)<br>Durchsatz = IOPS × Blockgröße · Wachstum = C × (1 + r)^n<br>Snapshots = Daten × Änderung/Tag × Tage · Effektiv = Nutzbar × Reduktion<br>HDD-IOPS: 7.2K ≈ 80 · 10K ≈ 150 · 15K ≈ 180 · 1 TiB = 1,0995 TB<br>99,9 % ≈ 8,76 h · 99,99 % ≈ 52,6 min · 99,999 % ≈ 5,26 min · 99,9999 % ≈ 31,5 s</div></div>' +
    '<div class="card"><h3 style="margin-top:0">Wer macht was?</h3><table><tr><td>Zoning</td><td>FC-Switch (SANnav zentral, Smart SAN automatisch)</td></tr><tr><td>LUN-Masking/SSP</td><td>Array (Host + Export)</td></tr><tr><td>MPIO/DSM</td><td>Betriebssystem</td></tr><tr><td>Setup Service</td><td>Ersteinrichtung, Blueprints</td></tr><tr><td>Data Ops Manager</td><td>Systeme, Hosts, Hardware, Updates, Performance-Insights</td></tr><tr><td>Block Storage</td><td>Volumes, Volume Sets, Protection Policies, intent-basiert</td></tr><tr><td>createsralertcrit</td><td>Performance-Alerts (System Reporter, CLI)</td></tr><tr><td>SPOCK · Ninja · SAF · OCA · PSNow</td><td>Kompatibilität · Sizing · Datensammlung · Angebot · Dokumente</td></tr></table></div></div>';
}

/* ================= Fortschritt ================= */
function viewProgress() {
  var st = topicStats();
  var boxes = [0, 0, 0, 0, 0, 0]; CARDS.forEach(function (c) { var s2 = S.cards[c.id]; boxes[s2 ? s2.box : 0]++; });
  var days = Object.keys(S.days).length;
  main.innerHTML = '<h1>📊 Fortschritt</h1><p class="muted">Alle Daten werden nur lokal in diesem Browser gespeichert. Über Export/Import kannst du sie auf ein anderes Gerät übertragen.</p>' +
    '<div class="card"><div class="statrow"><div class="stat"><b>' + Object.keys(S.q).length + '</b><span>Fragen bearbeitet</span></div><div class="stat"><b>' + streak() + '</b><span>Lerntage in Folge</span></div><div class="stat"><b>' + days + '</b><span>Lerntage insgesamt</span></div><div class="stat"><b>' + S.exams.length + '</b><span>Prüfungssimulationen</span></div></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Themen</h3>' + st.map(function (t) {
      var a = Math.round(t.acc * 100);
      return '<div class="secrow"><div class="small">' + esc(topicName(t.t)) + ' <span class="muted">(' + t.seen + '/' + t.total + ' bearbeitet)</span></div><div class="bar ' + (t.n && a < 63 ? 'bad' : t.n && a < 80 ? 'warn' : '') + '"><span style="width:' + (t.n ? a : 0) + '%"></span></div><div class="small"><b>' + (t.n ? a + ' %' : '–') + '</b></div></div>';
    }).join('') + '</div>' +
    '<div class="card"><h3 style="margin-top:0">Karteikarten</h3><div class="boxes"><div><b>' + boxes[0] + '</b>Neu</div><div><b>' + boxes[1] + '</b>Fach 1</div><div><b>' + boxes[2] + '</b>Fach 2</div><div><b>' + boxes[3] + '</b>Fach 3</div><div><b>' + (boxes[4] + boxes[5]) + '</b>Fach 4–5</div></div></div>' +
    '<div class="card"><h3 style="margin-top:0">Prüfungsverlauf</h3>' + (S.exams.length ? '<div style="display:flex;align-items:flex-end;gap:6px;height:130px;border-bottom:1px solid var(--border);padding-bottom:4px">' + S.exams.slice(-20).map(function (r) {
      return '<div title="' + esc(r.code) + ': ' + r.pct + ' %" style="flex:1;max-width:36px;height:' + Math.max(4, r.pct) + '%;background:' + (r.pass ? 'var(--ok)' : 'var(--bad)') + ';border-radius:4px 4px 0 0"></div>';
    }).join('') + '</div><p class="muted small">Letzte ' + Math.min(20, S.exams.length) + ' Simulationen (grün = bestanden).</p>' : '<p class="muted">Noch keine Simulation durchgeführt.</p>') + '</div>' +
    '<div class="card"><h3 style="margin-top:0">Daten</h3><div class="btnrow"><button class="btn" id="pexp">Fortschritt exportieren</button><label class="btn">Fortschritt importieren<input type="file" id="pimp" accept="application/json" hidden></label><button class="btn danger" id="preset">Alles zurücksetzen</button></div></div>';
  $('#pexp').onclick = function () {
    var blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ase-trainer-fortschritt-' + dayKey() + '.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };
  $('#pimp').onchange = function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { var d = JSON.parse(rd.result); if (!d || typeof d !== 'object' || !d.q) throw new Error('Format'); S = Object.assign(blank(), d); save(); toast('Fortschritt importiert.'); render(); }
      catch (e) { toast('Die Datei konnte nicht gelesen werden.'); }
    };
    rd.readAsText(f);
  };
  $('#preset').onclick = function () { if (confirm('Wirklich den gesamten Lernfortschritt löschen?')) { S = blank(); save(); toast('Fortschritt zurückgesetzt.'); render(); } };
}

/* ================= Infos & Quellen ================= */
function viewInfo() {
  main.innerHTML = '<h1>ℹ️ Prüfungsinfos und Quellen</h1>' +
    ['J82', 'J83', 'J81'].map(function (code) {
      var ex = EXAMS[code];
      return '<div class="card content"><h2>' + esc(ex.code) + ' – ' + esc(ex.name) + '</h2><p><b>Zertifizierung:</b> ' + esc(ex.cert) + '<br><b>Format:</b> ' + ex.questions + ' Fragen, ' + ex.minutes + ' Minuten, Bestehensgrenze ' + ex.pass + ' %, Sprachen: ' + esc(ex.langs) + '<br><b>Fragetypen:</b> ' + ex.types.map(esc).join(', ') + '<br><b>Stand des Prüfungsguides:</b> ' + esc(ex.rev) + '</p><p>' + esc(ex.desc) + '</p><p class="muted small">Zielgruppe: ' + esc(ex.candidate) + '</p>' +
        '<table><thead><tr><th>Anteil</th><th>Prüfungsbereich und Ziele (Übersetzung)</th></tr></thead><tbody>' + ex.sections.map(function (s) {
          return '<tr><td><b>' + s.pct + ' %</b></td><td><b>' + esc(s.name) + '</b><ul>' + s.obj.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul></td></tr>';
        }).join('') + '</tbody></table><p><a href="' + esc(ex.url) + '" target="_blank" rel="noopener">Offizieller Exam Preparation Guide (HPE)</a></p></div>';
    }).join('') +
    '<div class="card content"><h2>Offizielle Quellen</h2><p>Die Inhalte dieser Lernhilfe stützen sich auf folgende öffentlich verfügbare HPE-Dokumente (sinngemäß zusammengefasst und übersetzt):</p><ul>' +
    Object.keys(SOURCES).map(function (k) { return '<li>' + srcLink(k) + '</li>'; }).join('') +
    '<li><a href="https://support.hpe.com/hpesc/public/docDisplay?docId=sd00003463en_us&page=dom_view_performance_dscc.html" target="_blank" rel="noopener">HPE Support: Using Data Ops Manager</a></li><li><a href="https://support.hpe.com/hpesc/public/docDisplay?docId=sd00002409en_us&page=GUID-347597CE-F00F-4CDF-B8FF-D2D65D304F2B.html" target="_blank" rel="noopener">HPE Alletra Storage MP B10000: CLI-Referenz</a></li><li><a href="https://www.hpe.com/psnow/doc/a50008302enw" target="_blank" rel="noopener">HPE Alletra Storage MP B10000 Architecture (Technical White Paper)</a></li></ul></div>' +
    '<div class="card content"><h2>Hinweise</h2><ul><li>Diese Seite ist eine <b>unabhängige Lernhilfe</b> und wurde nicht von Hewlett Packard Enterprise erstellt, geprüft oder autorisiert. HPE, Alletra, StoreOnce, StoreEver, InfoSight, GreenLake, Zerto und weitere Namen sind Marken der jeweiligen Inhaber.</li><li>Alle Fragen sind eigene Formulierungen auf Basis öffentlicher Dokumentation – es handelt sich <b>nicht</b> um Originalfragen aus der Prüfung.</li><li>Produktdetails ändern sich mit neuen Releases. Maßgeblich sind immer die aktuellen QuickSpecs und der gültige Prüfungsguide.</li><li>Dein Lernfortschritt wird ausschließlich lokal in deinem Browser gespeichert.</li></ul></div>';
}

/* ================= Start ================= */
ROUTES = { '': viewHome, kapitel: viewChapters, karten: viewCards, quiz: viewQuiz, fokus: viewFocus, ueben: viewRun, zuordnen: viewMatch, luecken: viewCloze,
  szenarien: viewScenarios, rechner: viewCalc, pruefung: viewExam, fehler: viewWeak, glossar: viewGlossary, spick: viewCheat, fortschritt: viewProgress, info: viewInfo };

var THEMES = ['auto', 'light', 'dark'], THEME_LABEL = { auto: '◐ Auto', light: '☀ Hell', dark: '☾ Dunkel' };
var theme = 'auto';
try { theme = localStorage.getItem('aseTrainer.theme') || 'auto'; } catch (e) { /* ignorieren */ }
function applyTheme() {
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', theme);
  $('#themeBtn').textContent = THEME_LABEL[theme] || THEME_LABEL.auto;
}
$('#themeBtn').onclick = function () { theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]; try { localStorage.setItem('aseTrainer.theme', theme); } catch (e) { /* ignorieren */ } applyTheme(); };
$('#menuBtn').onclick = function () { sidebar.classList.toggle('open'); };
applyTheme();
render();
})();

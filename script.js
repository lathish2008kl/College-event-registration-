'use strict';
const KEY_E = 'cep_events', KEY_R = 'cep_regs', KEY_ME = 'cep_me';
const $ = s => document.querySelector(s);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const dayOffset = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
const ICONS = { Competition: '💻', Symposium: '🔬', Cultural: '🎭', Workshop: '🛠️', Sports: '🏆' };

// ---------- Sample data (dates are relative to today so events are always upcoming) ----------
function seedEvents() {
  return [
    { id: 1, title: 'CodeSprint Coding Competition', category: 'Competition', date: dayOffset(5), time: '10:00', venue: 'Computer Lab 3', capacity: 60, registered: 42, description: 'A 3-hour algorithmic challenge in teams of two. Solve problems, climb the leaderboard and win cash prizes.' },
    { id: 2, title: 'TechNova Technical Symposium', category: 'Symposium', date: dayOffset(9), time: '09:30', venue: 'Main Auditorium', capacity: 200, registered: 148, description: 'Paper presentations, project expos and keynotes from industry speakers on AI, IoT and robotics.' },
    { id: 3, title: 'Rangoli Cultural Fest', category: 'Cultural', date: dayOffset(14), time: '16:00', venue: 'Open Air Theatre', capacity: 300, registered: 299, description: 'Dance, music, drama and fashion show. Two days of colour and performances from every department.' },
    { id: 4, title: 'Web Development Workshop', category: 'Workshop', date: dayOffset(3), time: '14:00', venue: 'Seminar Hall B', capacity: 40, registered: 18, description: 'Hands-on session: build and deploy a responsive website with HTML, CSS and JavaScript. Bring your laptop.' },
    { id: 5, title: 'Inter-Department Sports Meet', category: 'Sports', date: dayOffset(20), time: '08:00', venue: 'College Ground', capacity: 150, registered: 77, description: 'Athletics, cricket, football and volleyball. Represent your department and bag the championship trophy.' },
    { id: 6, title: 'AI & Machine Learning Workshop', category: 'Workshop', date: dayOffset(1), time: '11:00', venue: 'Seminar Hall A', capacity: 35, registered: 10, description: 'Train your first model with Python and scikit-learn. Starts tomorrow, so registrations close for cancellation.' }
  ];
}
let events = load(KEY_E, null);
if (!events) { events = seedEvents(); save(KEY_E, events); }
let regs = load(KEY_R, []);
let me = load(KEY_ME, '');

// ---------- Helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => new Date(d + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = t => { const [h, m] = t.split(':'); return `${(h % 12) || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`; };
const seatsLeft = e => e.capacity - e.registered;
const getEvent = id => events.find(e => e.id === +id);
const canCancel = e => new Date(`${e.date}T${e.time}`) - Date.now() > 24 * 3600 * 1000; // >24h before start
const persist = () => { save(KEY_E, events); save(KEY_R, regs); };

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 3800);
}

// ---------- Rendering ----------
function eventCard(e) {
  const left = seatsLeft(e), pct = Math.round(e.registered / e.capacity * 100);
  const cls = left === 0 ? 'full' : pct >= 80 ? 'low' : '';
  return `<article class="card event">
    <span class="cat">${ICONS[e.category] || '📅'} ${esc(e.category)}</span>
    <h3>${esc(e.title)}</h3>
    <div class="meta"><span>📅 ${fmtDate(e.date)}</span><span>🕒 ${fmtTime(e.time)}</span><span>📍 ${esc(e.venue)}</span></div>
    <p class="desc">${esc(e.description)}</p>
    <div class="bar"><i class="${cls}" style="width:${pct}%"></i></div>
    <div class="counts"><span>👥 ${e.registered} registered</span>
      <span class="${left === 0 ? 'badge-full' : ''}">${left === 0 ? 'Event full' : left + ' seats left'}</span></div>
    <div class="actions">
      <button class="btn small ghost-dark" data-details="${e.id}">View details</button>
      <button class="btn small gold" data-reg="${e.id}" ${left === 0 ? 'disabled' : ''}>${left === 0 ? 'Full' : 'Register Now'}</button>
    </div></article>`;
}
const emptyState = (icon, title, text) => `<div class="empty"><b>${icon}</b><h3>${title}</h3><p>${text}</p></div>`;

function renderHome() {
  const upcoming = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  $('#homeGrid').innerHTML = upcoming.length ? upcoming.map(eventCard).join('') : emptyState('📭', 'No upcoming events', 'Check back soon for new events.');
  $('#statEvents').textContent = events.length;
  $('#statRegs').textContent = events.reduce((s, e) => s + e.registered, 0);
  $('#statSeats').textContent = events.reduce((s, e) => s + seatsLeft(e), 0);
}

function renderEvents() {
  const q = $('#search').value.trim().toLowerCase(), cat = $('#category').value, date = $('#dateFilter').value;
  const list = events.filter(e => e.title.toLowerCase().includes(q) && (!cat || e.category === cat) && (!date || e.date === date))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  $('#eventGrid').innerHTML = list.length ? list.map(eventCard).join('')
    : emptyState('🔎', 'No events found', events.length ? 'Try a different name, category or date, or clear the filters.' : 'No events have been added yet.');
}

function renderMine() {
  $('#lookupEmail').value = me;
  const mine = me ? regs.filter(r => r.email === me) : [];
  $('#myCount').textContent = mine.length || '';
  if (!me) { $('#mineGrid').innerHTML = emptyState('✉️', 'Enter your email', 'Type the email you used to register to see your events.'); return; }
  if (!mine.length) { $('#mineGrid').innerHTML = emptyState('🎟️', 'No registrations yet', 'You haven\'t registered for any events. Browse events and grab a seat!'); return; }
  $('#mineGrid').innerHTML = mine.map(r => {
    const e = getEvent(r.eventId); if (!e) return '';
    const ok = canCancel(e);
    return `<article class="card event">
      <span class="cat">${ICONS[e.category] || '📅'} ${esc(e.category)}</span>
      <h3>${esc(e.title)}</h3>
      <div class="meta"><span>📅 ${fmtDate(e.date)} · ${fmtTime(e.time)}</span><span>📍 ${esc(e.venue)}</span>
        <span>👤 ${esc(r.name)} · ${esc(r.department)}, ${esc(r.college)}</span>
        <span>🗓️ Registered on ${new Date(r.registeredAt).toLocaleDateString('en-IN')}</span></div>
      <div class="actions"><button class="btn small ghost-dark" data-details="${e.id}">View details</button>
      <button class="btn small danger" data-cancel="${r.id}" ${ok ? '' : 'disabled title="Cancellation closes 24 hours before the event"'}>${ok ? 'Cancel registration' : 'Cancellation closed'}</button></div></article>`;
  }).join('');
}

function fillSelects() {
  const cats = [...new Set(events.map(e => e.category))];
  $('#category').innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
  $('#fEvent').innerHTML = '<option value="">Select an event</option>' +
    events.map(e => `<option value="${e.id}" ${seatsLeft(e) === 0 ? 'disabled' : ''}>${esc(e.title)} (${seatsLeft(e) === 0 ? 'full' : seatsLeft(e) + ' seats left'})</option>`).join('');
}

function refresh() {
  const prevCat = $('#category').value, prevEv = $('#fEvent').value;
  fillSelects(); $('#category').value = prevCat; $('#fEvent').value = prevEv;
  renderHome(); renderEvents(); renderMine();
}

// ---------- Navigation ----------
function show(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
  $('#nav').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-nav],[data-details],[data-reg],[data-cancel]'); if (!t) return;
  if (t.dataset.nav) { ev.preventDefault(); show(t.dataset.nav); }
  else if (t.dataset.details) openDetails(t.dataset.details);
  else if (t.dataset.reg) { $('#detailDialog').close(); show('register'); $('#fEvent').value = t.dataset.reg; clearErrors(); }
  else if (t.dataset.cancel) cancelReg(+t.dataset.cancel);
});
$('#menuBtn').onclick = () => $('#nav').classList.toggle('open');

// ---------- Event details ----------
function openDetails(id) {
  const e = getEvent(id), left = seatsLeft(e), d = $('#detailDialog');
  d.innerHTML = `<button class="close" aria-label="Close" onclick="this.closest('dialog').close()">×</button>
    <span class="cat card" style="display:inline-block;padding:.15rem .7rem;border-radius:99px">${ICONS[e.category] || '📅'} ${esc(e.category)}</span>
    <h2>${esc(e.title)}</h2><p>${esc(e.description)}</p>
    <div class="meta"><span>📅 <b>Date:</b> ${fmtDate(e.date)}</span><span>🕒 <b>Time:</b> ${fmtTime(e.time)}</span><span>📍 <b>Venue:</b> ${esc(e.venue)}</span>
      <span>🪑 <b>Capacity:</b> ${e.capacity} · <b>Registered:</b> ${e.registered} · <b>Seats left:</b> ${left}</span>
      <span>↩️ <b>Cancellation:</b> ${canCancel(e) ? 'Allowed until 24 hours before the event' : 'Closed (event starts in under 24 hours)'}</span></div>
    <button class="btn gold" data-reg="${e.id}" ${left === 0 ? 'disabled' : ''}>${left === 0 ? 'Event full' : 'Register Now'}</button>`;
  d.showModal();
}
$('#detailDialog').addEventListener('click', e => { if (e.target.id === 'detailDialog') e.target.close(); });

// ---------- Registration ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function setErr(id, msg) { document.querySelector(`[data-for=${id}]`).textContent = msg; $('#' + id).classList.toggle('invalid', !!msg); return !msg; }
function clearErrors() { ['fName', 'fEmail', 'fCollege', 'fDept', 'fEvent'].forEach(i => setErr(i, '')); }

$('#regForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = $('#fName').value.trim(), email = $('#fEmail').value.trim().toLowerCase(),
        college = $('#fCollege').value.trim(), dept = $('#fDept').value.trim(), eid = $('#fEvent').value;
  const checks = [
    setErr('fName', name.length < 2 ? 'Enter your full name.' : ''),
    setErr('fEmail', !email ? 'Enter your email address.' : !EMAIL_RE.test(email) ? 'Enter a valid email like name@college.edu.' : ''),
    setErr('fCollege', !college ? 'Enter your college name.' : ''),
    setErr('fDept', !dept ? 'Enter your department.' : ''),
    setErr('fEvent', !eid ? 'Select an event.' : '')
  ];
  if (checks.includes(false)) return toast('Please fix the highlighted fields.', 'error');

  const e = getEvent(eid);
  if (seatsLeft(e) <= 0) return toast(`Sorry, "${e.title}" is full.`, 'error');
  if (regs.some(r => r.eventId === e.id && r.email === email)) return toast('You have already registered for this event with this email.', 'error');

  regs.push({ id: Date.now(), eventId: e.id, name, email, college, department: dept, registeredAt: new Date().toISOString() });
  e.registered++; persist();
  me = email; save(KEY_ME, me);
  toast(`Registered for "${e.title}". See you there!`);
  $('#regForm').reset(); clearErrors(); refresh(); show('mine');
});

// ---------- Cancel ----------
function cancelReg(id) {
  const r = regs.find(x => x.id === id); if (!r) return;
  const e = getEvent(r.eventId);
  if (!canCancel(e)) return toast('Cancellation is closed within 24 hours of the event.', 'error');
  if (!confirm(`Cancel your registration for "${e.title}"?`)) return;
  regs = regs.filter(x => x.id !== id);
  e.registered = Math.max(0, e.registered - 1); persist();
  toast('Registration cancelled. Your seat has been released.'); refresh();
}

// ---------- Lookup & filters ----------
function lookup() {
  const v = $('#lookupEmail').value.trim().toLowerCase();
  if (!EMAIL_RE.test(v)) return toast('Enter a valid email address.', 'error');
  me = v; save(KEY_ME, me); renderMine();
}
$('#lookupBtn').onclick = lookup;
$('#lookupEmail').addEventListener('keydown', e => e.key === 'Enter' && lookup());
['search', 'category', 'dateFilter'].forEach(id => $('#' + id).addEventListener('input', renderEvents));
$('#clearFilters').onclick = () => { $('#search').value = $('#category').value = $('#dateFilter').value = ''; renderEvents(); };

refresh();

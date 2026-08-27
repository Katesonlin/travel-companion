// app.js — Travel Companion main logic
let currentTripId = null;
let currentDayId = null;
let currentDayIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await ensureSeeded();
  renderTripList();
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('show'); });
  });
});

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
}

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');
  if (tab === 'trips') backToList();
  else if (tab === 'settings') toast('设置功能开发中…');
}

function backToList() {
  currentTripId = null; currentDayId = null;
  showView('trips'); renderTripList();
}

async function renderTripList() {
  const trips = await getAllTrips();
  const el = document.getElementById('trip-list');
  if (!trips.length) {
    el.innerHTML = '<div class="empty-state"><div class="icon">🌍</div><p>还没有旅行计划</p></div>';
    return;
  }
  el.innerHTML = trips.map(t => {
    const days = daysBetween(t.startDate, t.endDate);
    return '<div class="trip-card" onclick="openTrip(\'' + t.id + '\')">' +
      '<div class="trip-title">' + esc(t.name) + '</div>' +
      '<div class="trip-meta"><span>📅 ' + t.startDate + ' → ' + t.endDate + '</span> <span>👥 ' + t.travelers + '人</span> <span>🕐 ' + days + '天</span></div>' +
      '<div class="trip-dest">📍 ' + esc(t.destination) + '</div></div>';
  }).join('');
}

async function openTrip(tripId) {
  currentTripId = tripId;
  const trip = await getTrip(tripId);
  const days = await getDays(tripId);
  document.getElementById('detail-title').textContent = trip.name;
  document.getElementById('detail-sub').textContent = trip.destination + ' · ' + trip.startDate + ' → ' + trip.endDate + ' · ' + trip.travelers + '人';

  let totalActs = 0, completed = 0;
  for (const d of days) {
    const acts = await getActivities(d.id);
    totalActs += acts.length;
    completed += acts.filter(a => a.isCompleted).length;
  }
  document.getElementById('trip-stats').innerHTML =
    '<div class="stat-card"><div class="stat-val">' + daysBetween(trip.startDate, trip.endDate) + '</div><div class="stat-label">天数</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + totalActs + '</div><div class="stat-label">活动</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + completed + '</div><div class="stat-label">已完成</div></div>';

  document.getElementById('day-tabs').innerHTML = days.map((d, i) => {
    var dt = new Date(d.date);
    return '<div class="day-tab ' + (i === 0 ? 'active' : '') + '" onclick="switchDay(' + i + ',\'' + d.id + '\')">' +
      '<span class="day-label">D' + (i + 1) + '</span><span class="day-date">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</span></div>';
  }).join('');

  showView('detail');
  if (days.length) switchDay(0, days[0].id);
}

async function switchDay(index, dayId) {
  currentDayIndex = index; currentDayId = dayId;
  document.querySelectorAll('.day-tab').forEach((t, i) => t.classList.toggle('active', i === index));

  var day = await dbGet(STORES.days, dayId);
  document.getElementById('day-notes-input').value = day.notes || '';

  var acts = await getActivities(dayId);
  var listEl = document.getElementById('activity-list');
  if (!acts.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:30px"><p style="color:var(--text-dim)">暂无活动，点击下方添加</p></div>';
    return;
  }
  var icons = { attraction: '🏖', restaurant: '🍜', transport: '🚗', hotel: '🏨', other: '📌' };
  listEl.innerHTML = acts.map(a =>
    '<li class="activity-item ' + (a.isCompleted ? 'completed' : '') + '" data-id="' + a.id + '" draggable="true" ondragstart="onDragStart(event)" ondragover="onDragOver(event)" ondrop="onDrop(event)" ondragend="onDragEnd(event)">' +
      '<div class="drag-handle">⠿</div>' +
      '<div class="activity-dot ' + a.type + '"></div>' +
      '<div class="activity-body" onclick="toggleComplete(\'' + a.id + '\')">' +
        '<div class="activity-name">' + (icons[a.type] || '📌') + ' ' + esc(a.name) + '</div>' +
        (a.startTime ? '<div class="activity-note">' + a.startTime + (a.endTime ? ' - ' + a.endTime : '') + '</div>' : '') +
        (a.location ? '<div class="activity-note">📍 ' + esc(a.location) + '</div>' : '') +
        (a.notes ? '<div class="activity-note">' + esc(a.notes) + '</div>' : '') +
      '</div>' +
      '<div class="activity-actions"><button class="btn-icon" onclick="editActivity(\'' + a.id + '\')">✏️</button></div>' +
    '</li>'
  ).join('');
}

async function toggleComplete(actId) {
  var act = await dbGet(STORES.activities, actId);
  act.isCompleted = !act.isCompleted;
  await saveActivity(act);
  switchDay(currentDayIndex, currentDayId);
  refreshStats();
}

var dragId = null;
function onDragStart(e) { dragId = e.currentTarget.dataset.id; e.currentTarget.classList.add('dragging'); }
function onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function onDragEnd(e) { e.currentTarget.classList.remove('dragging', 'drag-over'); }
async function onDrop(e) {
  e.preventDefault();
  var targetId = e.currentTarget.dataset.id;
  e.currentTarget.classList.remove('drag-over');
  if (!dragId || dragId === targetId) return;
  var acts = await getActivities(currentDayId);
  var dragIdx = acts.findIndex(a => a.id === dragId);
  var dropIdx = acts.findIndex(a => a.id === targetId);
  if (dragIdx < 0 || dropIdx < 0) return;
  var moved = acts.splice(dragIdx, 1)[0];
  acts.splice(dropIdx, 0, moved);
  for (var i = 0; i < acts.length; i++) { acts[i].order = i; await saveActivity(acts[i]); }
  switchDay(currentDayIndex, currentDayId);
}

function showAddActivityModal() {
  if (!currentDayId) return;
  document.getElementById('aa-name').value = '';
  document.getElementById('aa-start').value = '';
  document.getElementById('aa-end').value = '';
  document.getElementById('aa-type').value = 'attraction';
  document.getElementById('aa-location').value = '';
  document.getElementById('aa-notes').value = '';
  openModal('modal-add-activity');
}

async function addActivity() {
  var name = document.getElementById('aa-name').value.trim();
  if (!name) return toast('请输入活动名称');
  var acts = await getActivities(currentDayId);
  await saveActivity({
    id: uid(), dayId: currentDayId, name: name,
    startTime: document.getElementById('aa-start').value || null,
    endTime: document.getElementById('aa-end').value || null,
    type: document.getElementById('aa-type').value,
    location: document.getElementById('aa-location').value.trim() || null,
    notes: document.getElementById('aa-notes').value.trim() || null,
    isCompleted: false, order: acts.length
  });
  closeModal('modal-add-activity');
  switchDay(currentDayIndex, currentDayId);
  refreshStats();
  toast('已添加');
}

async function editActivity(actId) {
  var act = await dbGet(STORES.activities, actId);
  if (!act) return;
  document.getElementById('ea-id').value = act.id;
  document.getElementById('ea-name').value = act.name;
  document.getElementById('ea-start').value = act.startTime || '';
  document.getElementById('ea-end').value = act.endTime || '';
  document.getElementById('ea-type').value = act.type;
  document.getElementById('ea-location').value = act.location || '';
  document.getElementById('ea-notes').value = act.notes || '';
  openModal('modal-edit-activity');
}

async function saveEditActivity() {
  var id = document.getElementById('ea-id').value;
  var act = await dbGet(STORES.activities, id);
  if (!act) return;
  act.name = document.getElementById('ea-name').value.trim();
  act.startTime = document.getElementById('ea-start').value || null;
  act.endTime = document.getElementById('ea-end').value || null;
  act.type = document.getElementById('ea-type').value;
  act.location = document.getElementById('ea-location').value.trim() || null;
  act.notes = document.getElementById('ea-notes').value.trim() || null;
  await saveActivity(act);
  closeModal('modal-edit-activity');
  switchDay(currentDayIndex, currentDayId);
  toast('已保存');
}

async function deleteActivity() {
  var id = document.getElementById('ea-id').value;
  if (!confirm('确认删除此活动？')) return;
  await deleteActivityById(id);
  closeModal('modal-edit-activity');
  switchDay(currentDayIndex, currentDayId);
  refreshStats();
  toast('已删除');
}

var notesTimer = null;
async function saveDayNotes() {
  clearTimeout(notesTimer);
  notesTimer = setTimeout(async function() {
    if (!currentDayId) return;
    var day = await dbGet(STORES.days, currentDayId);
    day.notes = document.getElementById('day-notes-input').value;
    await saveDay(day);
  }, 500);
}

function showNewTripModal() {
  document.getElementById('nt-name').value = '';
  document.getElementById('nt-dest').value = '';
  document.getElementById('nt-start').value = '';
  document.getElementById('nt-end').value = '';
  document.getElementById('nt-travelers').value = '1';
  document.getElementById('nt-budget').value = '';
  openModal('modal-new-trip');
}

async function createTrip() {
  var name = document.getElementById('nt-name').value.trim();
  var start = document.getElementById('nt-start').value;
  var end = document.getElementById('nt-end').value;
  if (!name || !start || !end) return toast('请填写名称和日期');
  if (new Date(end) < new Date(start)) return toast('结束日期不能早于开始日期');
  var trip = {
    id: uid(), name: name,
    destination: document.getElementById('nt-dest').value.trim(),
    startDate: start, endDate: end,
    travelers: parseInt(document.getElementById('nt-travelers').value) || 1,
    budget: parseFloat(document.getElementById('nt-budget').value) || null,
    createdAt: new Date().toISOString()
  };
  await saveTrip(trip);
  var totalDays = daysBetween(start, end);
  for (var i = 0; i < totalDays; i++) {
    await saveDay({ id: uid(), tripId: trip.id, date: dateOffset(start, i), dateIndex: i, notes: '' });
  }
  closeModal('modal-new-trip');
  toast('计划已创建');
  openTrip(trip.id);
}

async function duplicateTrip() {
  var orig = await getTrip(currentTripId);
  if (!orig) return;
  var newTrip = Object.assign({}, orig, { id: uid(), name: orig.name + ' (副本)', createdAt: new Date().toISOString() });
  await saveTrip(newTrip);
  var days = await getDays(currentTripId);
  for (var d of days) {
    var newDay = Object.assign({}, d, { id: uid(), tripId: newTrip.id });
    await saveDay(newDay);
    var acts = await getActivities(d.id);
    for (var a of acts) {
      await saveActivity(Object.assign({}, a, { id: uid(), dayId: newDay.id }));
    }
  }
  toast('计划已复制');
  openTrip(newTrip.id);
}

async function refreshStats() {
  if (!currentTripId) return;
  var days = await getDays(currentTripId);
  var totalActs = 0, completed = 0;
  for (var d of days) {
    var acts = await getActivities(d.id);
    totalActs += acts.length;
    completed += acts.filter(a => a.isCompleted).length;
  }
  document.getElementById('trip-stats').innerHTML =
    '<div class="stat-card"><div class="stat-val">' + days.length + '</div><div class="stat-label">天数</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + totalActs + '</div><div class="stat-label">活动</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + completed + '</div><div class="stat-label">已完成</div></div>';
}

// app.js — 旅行伴侣主逻辑
var currentTripId = null;
var currentDayId = null;
var currentDayIndex = 0;

document.addEventListener('DOMContentLoaded', async function() {
  await ensureSeeded();
  renderTripList();
  document.querySelectorAll('.modal-overlay').forEach(function(el) {
    el.addEventListener('click', function(e) { if (e.target === el) el.classList.remove('show'); });
  });
});

// ---- 视图切换 ----
function showView(name) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  var el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  // 滚回顶部
  var content = document.getElementById('main-content');
  if (content) content.scrollTop = 0;
}

function switchTab(tab) {
  // 更新底部 tab 高亮
  document.querySelectorAll('.bottom-nav .tab-item').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  // 更新顶部标题
  var titles = { trips: '旅行伴侣', route: '路线导航', english: '场景英语', settings: '设置' };
  document.getElementById('header-title').textContent = titles[tab] || '旅行伴侣';
  if (tab === 'trips') {
    backToList();
  } else {
    showView(tab);
  }
}

function backToList() {
  currentTripId = null;
  currentDayId = null;
  showView('trips');
  renderTripList();
}

// ---- 搜索 ----
function onSearch(q) {
  renderTripList(q.trim().toLowerCase());
}

// ---- 行程列表 ----
async function renderTripList(query) {
  var trips = await getAllTrips();
  var el = document.getElementById('trip-list');
  if (query) {
    trips = trips.filter(function(t) {
      return (t.name + t.destination).toLowerCase().indexOf(query) >= 0;
    });
  }
  if (!trips.length) {
    el.innerHTML = '<div class="empty-state"><div class="icon">🌍</div><p>还没有旅行计划</p><p class="sub">点击上方「新建计划」开始创建</p></div>';
    return;
  }
  el.innerHTML = trips.map(function(t) {
    var totalDays = daysBetween(t.startDate, t.endDate);
    return '<div class="trip-card" onclick="openTrip(\'' + t.id + '\')">' +
      '<div class="trip-card-header">' +
        '<div class="trip-card-title">' + esc(t.name) + '</div>' +
        '<div class="trip-card-badge">进行中</div>' +
      '</div>' +
      '<div class="trip-card-meta">' +
        '<span>📅 ' + t.startDate + ' → ' + t.endDate + '</span>' +
        '<span>👥 ' + t.travelers + '人</span>' +
        '<span>🕐 ' + totalDays + '天</span>' +
      '</div>' +
      '<div class="trip-card-dest">📍 ' + esc(t.destination) + '</div>' +
      '<div class="trip-card-progress"><div class="bar" style="width:0%"></div></div>' +
    '</div>';
  }).join('');
  // 更新进度条
  for (var i = 0; i < trips.length; i++) {
    updateTripProgress(trips[i].id);
  }
}

async function updateTripProgress(tripId) {
  var days = await getDays(tripId);
  var totalActs = 0, completed = 0;
  for (var d of days) {
    var acts = await getActivities(d.id);
    totalActs += acts.length;
    completed += acts.filter(function(a) { return a.isCompleted; }).length;
  }
  var pct = totalActs > 0 ? Math.round(completed / totalActs * 100) : 0;
  var cards = document.querySelectorAll('.trip-card');
  cards.forEach(function(card) {
    if (card.getAttribute('onclick').indexOf(tripId) >= 0) {
      var bar = card.querySelector('.bar');
      if (bar) bar.style.width = pct + '%';
      var badge = card.querySelector('.trip-card-badge');
      if (badge) {
        if (pct >= 100) { badge.textContent = '已完成'; badge.style.background = '#E8F5E9'; badge.style.color = '#388E3C'; }
        else if (pct > 0) { badge.textContent = pct + '%'; }
        else { badge.textContent = '未开始'; badge.style.background = '#FFF3E0'; badge.style.color = '#F57C00'; }
      }
    }
  });
}

// ---- 打开行程详情 ----
async function openTrip(tripId) {
  currentTripId = tripId;
  var trip = await getTrip(tripId);
  var days = await getDays(tripId);
  document.getElementById('detail-title').textContent = trip.name;
  document.getElementById('detail-sub').textContent = trip.destination + ' · ' + trip.startDate + ' → ' + trip.endDate + ' · ' + trip.travelers + '人';

  var totalActs = 0, completed = 0;
  for (var d of days) {
    var acts = await getActivities(d.id);
    totalActs += acts.length;
    completed += acts.filter(function(a) { return a.isCompleted; }).length;
  }
  document.getElementById('trip-stats').innerHTML =
    '<div class="stat-card"><div class="stat-val">' + daysBetween(trip.startDate, trip.endDate) + '</div><div class="stat-label">总天数</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + totalActs + '</div><div class="stat-label">活动数</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + completed + '</div><div class="stat-label">已完成</div></div>';

  document.getElementById('day-tabs').innerHTML = days.map(function(d, i) {
    var dt = new Date(d.date);
    return '<div class="day-tab ' + (i === 0 ? 'active' : '') + '" onclick="switchDay(' + i + ',\'' + d.id + '\')">' +
      '<span class="day-label">D' + (i + 1) + '</span>' +
      '<span class="day-date">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</span></div>';
  }).join('');

  showView('detail');
  if (days.length) switchDay(0, days[0].id);
}

// ---- 切换日期 ----
async function switchDay(index, dayId) {
  currentDayIndex = index;
  currentDayId = dayId;
  document.querySelectorAll('.day-tab').forEach(function(t, i) { t.classList.toggle('active', i === index); });

  var day = await dbGet(STORES.days, dayId);
  document.getElementById('day-notes-input').value = day.notes || '';

  var acts = await getActivities(dayId);
  var listEl = document.getElementById('activity-list');
  if (!acts.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:30px"><p style="color:var(--text-light)">暂无活动，点击下方添加</p></div>';
    return;
  }
  var icons = { attraction: '🏖', restaurant: '🍜', transport: '🚗', hotel: '🏨', other: '📌' };
  listEl.innerHTML = acts.map(function(a) {
    return '<li class="activity-item ' + (a.isCompleted ? 'completed' : '') + '" data-id="' + a.id + '" draggable="true" ondragstart="onDragStart(event)" ondragover="onDragOver(event)" ondrop="onDrop(event)" ondragend="onDragEnd(event)">' +
      '<div class="drag-handle">⠿</div>' +
      '<div class="activity-dot ' + a.type + '"></div>' +
      '<div class="activity-body" onclick="toggleComplete(\'' + a.id + '\')">' +
        '<div class="activity-name">' + (icons[a.type] || '📌') + ' ' + esc(a.name) + '</div>' +
        (a.startTime ? '<div class="activity-note">🕐 ' + a.startTime + (a.endTime ? ' - ' + a.endTime : '') + '</div>' : '') +
        (a.location ? '<div class="activity-note">📍 ' + esc(a.location) + '</div>' : '') +
        (a.notes ? '<div class="activity-note">' + esc(a.notes) + '</div>' : '') +
      '</div>' +
      '<div class="activity-actions"><button class="btn-icon" onclick="event.stopPropagation();editActivity(\'' + a.id + '\')">✏️</button></div>' +
    '</li>';
  }).join('');
}

// ---- 完成切换 ----
async function toggleComplete(actId) {
  var act = await dbGet(STORES.activities, actId);
  act.isCompleted = !act.isCompleted;
  await saveActivity(act);
  switchDay(currentDayIndex, currentDayId);
  refreshStats();
}

// ---- 拖拽排序 ----
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
  var dragIdx = acts.findIndex(function(a) { return a.id === dragId; });
  var dropIdx = acts.findIndex(function(a) { return a.id === targetId; });
  if (dragIdx < 0 || dropIdx < 0) return;
  var moved = acts.splice(dragIdx, 1)[0];
  acts.splice(dropIdx, 0, moved);
  for (var i = 0; i < acts.length; i++) { acts[i].order = i; await saveActivity(acts[i]); }
  switchDay(currentDayIndex, currentDayId);
}

// ---- 添加活动 ----
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

// ---- 编辑活动 ----
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

// ---- 备注自动保存 ----
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

// ---- 新建计划 ----
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

// ---- 复制计划 ----
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

// ---- 刷新统计 ----
async function refreshStats() {
  if (!currentTripId) return;
  var days = await getDays(currentTripId);
  var totalActs = 0, completed = 0;
  for (var d of days) {
    var acts = await getActivities(d.id);
    totalActs += acts.length;
    completed += acts.filter(function(a) { return a.isCompleted; }).length;
  }
  document.getElementById('trip-stats').innerHTML =
    '<div class="stat-card"><div class="stat-val">' + days.length + '</div><div class="stat-label">天数</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + totalActs + '</div><div class="stat-label">活动</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + completed + '</div><div class="stat-label">已完成</div></div>';
}

// app.js — 旅行伴侣主逻辑（完整版）
var currentTripId = null;
var currentDayId = null;
var currentDayIndex = 0;
var currentLocationFilter = 'all';
var currentPhraseFilter = 'all';
var phraseSearchQuery = '';

document.addEventListener('DOMContentLoaded', async function() {
  await ensureSeeded();
  renderTripList();
  document.querySelectorAll('.modal-overlay').forEach(function(el) {
    el.addEventListener('click', function(e) { if (e.target === el) el.classList.remove('show'); });
  });
});

/* ── 视图切换 ── */
function showView(name) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  var el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  var content = document.getElementById('main-content');
  if (content) content.scrollTop = 0;
}

function switchTab(tab) {
  document.querySelectorAll('.bottom-nav .tab-item').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  var titles = { trips: '旅行伴侣', route: '路线导航', english: '场景英语', settings: '设置' };
  document.getElementById('header-title').textContent = titles[tab] || '旅行伴侣';
  document.getElementById('header-action').style.display = tab === 'trips' ? '' : 'none';
  if (tab === 'trips') { backToList(); }
  else if (tab === 'route') { showView('route'); renderLocations(); }
  else if (tab === 'english') { showView('english'); renderPhrases(); }
  else { showView(tab); }
}

function backToList() {
  currentTripId = null;
  currentDayId = null;
  showView('trips');
  renderTripList();
}

/* ── 搜索 ── */
function onSearch(q) { renderTripList(q.trim().toLowerCase()); }

/* ── 行程状态判断 ── */
function getTripStatus(trip) {
  var today = new Date().toISOString().split('T')[0];
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'completed';
  return 'in-progress';
}

function getStatusBadge(status) {
  if (status === 'upcoming') return { text: '未开始', bg: '#FFF3E0', color: '#F57C00' };
  if (status === 'completed') return { text: '已完成', bg: '#E8F5E9', color: '#388E3C' };
  return { text: '进行中', bg: '#E3F2FD', color: '#1976D2' };
}

/* ── 行程列表 ── */
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
    var status = getTripStatus(t);
    var badge = getStatusBadge(status);
    return '<div class="trip-card" onclick="openTrip(\'' + t.id + '\')">' +
      '<div class="trip-card-header">' +
        '<div class="trip-card-title">' + esc(t.name) + '</div>' +
        '<div class="trip-card-badge" style="background:' + badge.bg + ';color:' + badge.color + '">' + badge.text + '</div>' +
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
  for (var i = 0; i < trips.length; i++) { updateTripProgress(trips[i].id); }
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
      if (pct >= 100) {
        var badge = card.querySelector('.trip-card-badge');
        if (badge) { badge.textContent = '已完成'; badge.style.background = '#E8F5E9'; badge.style.color = '#388E3C'; }
      }
    }
  });
}

/* ── 打开行程详情 ── */
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

/* ── 切换日期 ── */
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

/* ── 完成切换 ── */
async function toggleComplete(actId) {
  var act = await dbGet(STORES.activities, actId);
  act.isCompleted = !act.isCompleted;
  await saveActivity(act);
  switchDay(currentDayIndex, currentDayId);
  refreshStats();
}

/* ── 拖拽排序 ── */
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

/* ── 添加活动 ── */
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

/* ── 编辑活动 ── */
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

/* ── 备注自动保存 ── */
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

/* ── 新建计划 ── */
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

/* ── 编辑计划 ── */
async function showEditTripModal() {
  var trip = await getTrip(currentTripId);
  if (!trip) return;
  document.getElementById('et-id').value = trip.id;
  document.getElementById('et-name').value = trip.name;
  document.getElementById('et-dest').value = trip.destination;
  document.getElementById('et-start').value = trip.startDate;
  document.getElementById('et-end').value = trip.endDate;
  document.getElementById('et-travelers').value = trip.travelers;
  document.getElementById('et-budget').value = trip.budget || '';
  openModal('modal-edit-trip');
}

async function saveEditTrip() {
  var id = document.getElementById('et-id').value;
  var trip = await getTrip(id);
  if (!trip) return;
  trip.name = document.getElementById('et-name').value.trim();
  trip.destination = document.getElementById('et-dest').value.trim();
  trip.startDate = document.getElementById('et-start').value;
  trip.endDate = document.getElementById('et-end').value;
  trip.travelers = parseInt(document.getElementById('et-travelers').value) || 1;
  trip.budget = parseFloat(document.getElementById('et-budget').value) || null;
  await saveTrip(trip);
  closeModal('modal-edit-trip');
  openTrip(trip.id);
  toast('已保存');
}

/* ── 删除计划 ── */
async function deleteTrip() {
  if (!currentTripId) return;
  if (!confirm('确认删除此旅行计划？所有行程数据将被删除。')) return;
  var days = await getDays(currentTripId);
  for (var d of days) {
    var acts = await getActivities(d.id);
    for (var a of acts) { await deleteActivityById(a.id); }
    await deleteDayById(d.id);
  }
  await deleteTripById(currentTripId);
  toast('已删除');
  backToList();
}

/* ── 复制计划 ── */
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

/* ── 行程分享（Canvas 长图） ── */
async function shareTrip() {
  var trip = await getTrip(currentTripId);
  if (!trip) return;
  var days = await getDays(currentTripId);
  var canvas = document.getElementById('share-canvas');
  var ctx = canvas.getContext('2d');
  var W = 750, padding = 40, y = 0;

  // 计算总高度
  var totalH = 200; // header
  for (var d of days) {
    var acts = await getActivities(d.id);
    totalH += 60 + acts.length * 36 + 20;
  }
  totalH += 100; // footer
  canvas.height = totalH;
  canvas.width = W;

  // 背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, totalH);

  // 渐变头
  var grad = ctx.createLinearGradient(0, 0, W, 160);
  grad.addColorStop(0, '#6DDFFF');
  grad.addColorStop(1, '#91E3FA');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 160);

  // 标题
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Inter, -apple-system, sans-serif';
  ctx.fillText(trip.name, padding, 60);
  ctx.font = '18px Inter, -apple-system, sans-serif';
  ctx.fillText('📍 ' + trip.destination + '  📅 ' + trip.startDate + ' → ' + trip.endDate + '  👥 ' + trip.travelers + '人', padding, 100);
  ctx.font = '14px Inter, -apple-system, sans-serif';
  ctx.fillText('有网做攻略，无网也能走 · 旅行伴侣', padding, 135);
  y = 180;

  // 每日行程
  for (var i = 0; i < days.length; i++) {
    var day = days[i];
    var dt = new Date(day.date);
    var acts = await getActivities(day.id);

    // 日期标题
    ctx.fillStyle = '#6DDFFF';
    ctx.beginPath();
    ctx.roundRect(padding, y, W - padding * 2, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter, -apple-system, sans-serif';
    ctx.fillText('Day ' + (i + 1) + ' · ' + (dt.getMonth() + 1) + '月' + dt.getDate() + '日', padding + 12, y + 27);
    y += 50;

    // 活动列表
    ctx.fillStyle = '#2C3539';
    ctx.font = '15px Inter, -apple-system, sans-serif';
    for (var j = 0; j < acts.length; j++) {
      var a = acts[j];
      var prefix = (a.startTime || '') + (a.startTime ? ' ' : '');
      var text = prefix + a.name + (a.location ? ' · ' + a.location : '');
      var check = a.isCompleted ? '✅ ' : '⬜ ';
      ctx.fillText(check + text, padding + 8, y + 20);
      y += 36;
    }
    y += 20;
  }

  // 页脚
  y += 10;
  ctx.fillStyle = '#A0A3A6';
  ctx.font = '12px Inter, -apple-system, sans-serif';
  ctx.fillText('Generated by 旅行伴侣 · ' + new Date().toLocaleDateString(), padding, y);

  openModal('modal-share');
}

function downloadShareImage() {
  var canvas = document.getElementById('share-canvas');
  var link = document.createElement('a');
  link.download = '行程分享.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('图片已保存');
}

/* ── 刷新统计 ── */
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

/* ══════════════════════════════════════════
   模块二：路线导航
   ══════════════════════════════════════════ */

function filterLocations(cat) {
  currentLocationFilter = cat;
  document.querySelectorAll('#location-filters .filter-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  renderLocations();
}

async function renderLocations() {
  var locs = await getAllLocations();
  if (currentLocationFilter !== 'all') {
    locs = locs.filter(function(l) { return l.category === currentLocationFilter; });
  }
  var el = document.getElementById('location-list');
  if (!locs.length) {
    el.innerHTML = '<div class="empty-state"><div class="icon">📍</div><p>暂无收藏地点</p><p class="sub">点击右上角添加</p></div>';
    return;
  }
  var catIcons = { attraction: '🏖', restaurant: '🍜', hotel: '🏨', transport: '🚗', other: '📌' };
  el.innerHTML = locs.map(function(l) {
    var mapLink = l.lat && l.lng
      ? 'https://www.google.com/maps?q=' + l.lat + ',' + l.lng
      : 'https://www.google.com/maps/search/' + encodeURIComponent(l.name + ' ' + l.address);
    return '<div class="location-card">' +
      '<div class="location-header" onclick="showEditLocationModal(\'' + l.id + '\')">' +
        '<div class="location-icon">' + (catIcons[l.category] || '📌') + '</div>' +
        '<div class="location-info">' +
          '<div class="location-name">' + esc(l.name) + '</div>' +
          '<div class="location-addr">' + esc(l.address) + '</div>' +
          (l.notes ? '<div class="location-notes">' + esc(l.notes) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<a class="btn-map" href="' + mapLink + '" target="_blank" rel="noopener">🗺️ 导航</a>' +
    '</div>';
  }).join('');
}

function showAddLocationModal() {
  document.getElementById('al-name').value = '';
  document.getElementById('al-address').value = '';
  document.getElementById('al-category').value = 'attraction';
  document.getElementById('al-notes').value = '';
  document.getElementById('al-lat').value = '';
  document.getElementById('al-lng').value = '';
  openModal('modal-add-location');
}

async function addLocation() {
  var name = document.getElementById('al-name').value.trim();
  if (!name) return toast('请输入地点名称');
  await saveLocation({
    id: uid(), name: name,
    address: document.getElementById('al-address').value.trim(),
    category: document.getElementById('al-category').value,
    notes: document.getElementById('al-notes').value.trim() || null,
    lat: parseFloat(document.getElementById('al-lat').value) || null,
    lng: parseFloat(document.getElementById('al-lng').value) || null,
    tripId: null,
    createdAt: new Date().toISOString()
  });
  closeModal('modal-add-location');
  renderLocations();
  toast('已添加');
}

async function showEditLocationModal(locId) {
  var loc = await getLocation(locId);
  if (!loc) return;
  document.getElementById('el-id').value = loc.id;
  document.getElementById('el-name').value = loc.name;
  document.getElementById('el-address').value = loc.address || '';
  document.getElementById('el-category').value = loc.category;
  document.getElementById('el-notes').value = loc.notes || '';
  document.getElementById('el-lat').value = loc.lat || '';
  document.getElementById('el-lng').value = loc.lng || '';
  openModal('modal-edit-location');
}

async function saveEditLocation() {
  var id = document.getElementById('el-id').value;
  var loc = await getLocation(id);
  if (!loc) return;
  loc.name = document.getElementById('el-name').value.trim();
  loc.address = document.getElementById('el-address').value.trim();
  loc.category = document.getElementById('el-category').value;
  loc.notes = document.getElementById('el-notes').value.trim() || null;
  loc.lat = parseFloat(document.getElementById('el-lat').value) || null;
  loc.lng = parseFloat(document.getElementById('el-lng').value) || null;
  await saveLocation(loc);
  closeModal('modal-edit-location');
  renderLocations();
  toast('已保存');
}

async function deleteLocation() {
  var id = document.getElementById('el-id').value;
  if (!confirm('确认删除此地点？')) return;
  await deleteLocationById(id);
  closeModal('modal-edit-location');
  renderLocations();
  toast('已删除');
}

/* ══════════════════════════════════════════
   模块三：场景英语
   ══════════════════════════════════════════ */

function filterPhrases(cat) {
  currentPhraseFilter = cat;
  document.querySelectorAll('#phrase-filters .filter-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  renderPhrases();
}

function onPhraseSearch(q) {
  phraseSearchQuery = q.trim().toLowerCase();
  renderPhrases();
}

async function renderPhrases() {
  var phrases = await getAllPhrases();
  var catNames = { airport: '机场', hotel: '酒店', restaurant: '餐厅', transport: '交通', shopping: '购物', emergency: '紧急情况' };
  var catIcons = { airport: '✈️', hotel: '🏨', restaurant: '🍜', transport: '🚗', shopping: '🛍️', emergency: '🆘' };

  // 过滤
  if (currentPhraseFilter === 'favorites') {
    phrases = phrases.filter(function(p) { return p.isFavorite; });
  } else if (currentPhraseFilter !== 'all') {
    phrases = phrases.filter(function(p) { return p.category === currentPhraseFilter; });
  }

  // 搜索
  if (phraseSearchQuery) {
    phrases = phrases.filter(function(p) {
      return p.zh.toLowerCase().indexOf(phraseSearchQuery) >= 0 ||
             p.en.toLowerCase().indexOf(phraseSearchQuery) >= 0;
    });
  }

  var el = document.getElementById('phrase-list');
  if (!phrases.length) {
    el.innerHTML = '<div class="empty-state"><div class="icon">🗣️</div><p>暂无短语</p></div>';
    return;
  }

  // 按分类分组显示
  var groups = {};
  phrases.forEach(function(p) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });

  var html = '';
  for (var cat in groups) {
    html += '<div class="phrase-group"><div class="phrase-group-title">' + (catIcons[cat] || '📖') + ' ' + (catNames[cat] || cat) + '</div>';
    groups[cat].forEach(function(p) {
      html += '<div class="phrase-card" onclick="toggleFavorite(\'' + p.id + '\')">' +
        '<div class="phrase-content">' +
          '<div class="phrase-en">' + esc(p.en) + '</div>' +
          '<div class="phrase-zh">' + esc(p.zh) + '</div>' +
        '</div>' +
        '<div class="phrase-fav">' + (p.isFavorite ? '⭐' : '☆') + '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

async function toggleFavorite(phraseId) {
  var p = await getPhrase(phraseId);
  if (!p) return;
  p.isFavorite = !p.isFavorite;
  await savePhrase(p);
  renderPhrases();
}

/* ══════════════════════════════════════════
   设置页
   ══════════════════════════════════════════ */

async function exportData() {
  var data = await exportAllData();
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'travel-companion-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('数据已导出');
}

async function importData(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = async function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!confirm('导入将覆盖现有所有数据，确认继续？')) return;
      await importAllData(data);
      toast('数据已导入，刷新页面生效');
      setTimeout(function() { location.reload(); }, 1500);
    } catch (err) {
      toast('导入失败：文件格式错误');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function clearData() {
  if (!confirm('确认清除所有数据？此操作不可恢复。')) return;
  if (!confirm('再次确认：删除所有行程、收藏地点和英语短语数据？')) return;
  await clearAllData();
  toast('数据已清除，刷新页面');
  setTimeout(function() { location.reload(); }, 1500);
}

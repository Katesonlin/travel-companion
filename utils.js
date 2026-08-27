// utils.js — helper functions
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function daysBetween(start, end) {
  var s = new Date(start), e = new Date(end);
  return Math.round((e - s) / 86400000) + 1;
}

function dateOffset(start, i) {
  var d = new Date(start);
  d.setDate(d.getDate() + i);
  return d.toISOString().split('T')[0];
}

function esc(s) {
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function openModal(id) {
  document.getElementById(id).classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function toast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2200);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

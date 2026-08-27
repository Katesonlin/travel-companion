/* db.js — IndexedDB wrapper for Travel Companion */
const DB_NAME = 'travel-companion';
const DB_VER = 2;
const STORES = {
  trips: 'trips',
  days: 'days',
  activities: 'activities',
  locations: 'locations',
  phrases: 'phrases'
};

let _db = null;

function dbOpen() {
  if (_db) return Promise.resolve(_db);
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.trips)) {
        var s = db.createObjectStore(STORES.trips, { keyPath: 'id' });
        s.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(STORES.days)) {
        var s = db.createObjectStore(STORES.days, { keyPath: 'id' });
        s.createIndex('tripId', 'tripId');
      }
      if (!db.objectStoreNames.contains(STORES.activities)) {
        var s = db.createObjectStore(STORES.activities, { keyPath: 'id' });
        s.createIndex('dayId', 'dayId');
      }
      if (!db.objectStoreNames.contains(STORES.locations)) {
        var s = db.createObjectStore(STORES.locations, { keyPath: 'id' });
        s.createIndex('category', 'category');
        s.createIndex('tripId', 'tripId');
      }
      if (!db.objectStoreNames.contains(STORES.phrases)) {
        var s = db.createObjectStore(STORES.phrases, { keyPath: 'id' });
        s.createIndex('category', 'category');
        s.createIndex('isFavorite', 'isFavorite');
      }
    };
    req.onsuccess = function(e) { _db = e.target.result; resolve(_db); };
    req.onerror = function(e) { reject(e.target.error); };
  });
}

function dbGet(store, id) {
  return dbOpen().then(function(db) {
    return new Promise(function(res, rej) {
      var r = db.transaction(store, 'readonly').objectStore(store).get(id);
      r.onsuccess = function() { res(r.result); };
      r.onerror = function(e) { rej(e.target.error); };
    });
  });
}

function dbPut(store, val) {
  return dbOpen().then(function(db) {
    return new Promise(function(res, rej) {
      var r = db.transaction(store, 'readwrite').objectStore(store).put(val);
      r.onsuccess = function() { res(r.result); };
      r.onerror = function(e) { rej(e.target.error); };
    });
  });
}

function dbDel(store, id) {
  return dbOpen().then(function(db) {
    return new Promise(function(res, rej) {
      var r = db.transaction(store, 'readwrite').objectStore(store).delete(id);
      r.onsuccess = function() { res(); };
      r.onerror = function(e) { rej(e.target.error); };
    });
  });
}

function dbGetAll(store) {
  return dbOpen().then(function(db) {
    return new Promise(function(res, rej) {
      var r = db.transaction(store, 'readonly').objectStore(store).getAll();
      r.onsuccess = function() { res(r.result || []); };
      r.onerror = function(e) { rej(e.target.error); };
    });
  });
}

function dbGetByIndex(store, idxName, key) {
  return dbOpen().then(function(db) {
    return new Promise(function(res, rej) {
      var r = db.transaction(store, 'readonly').objectStore(store).index(idxName).getAll(key);
      r.onsuccess = function() { res(r.result || []); };
      r.onerror = function(e) { rej(e.target.error); };
    });
  });
}

function dbClearStore(store) {
  return dbOpen().then(function(db) {
    return new Promise(function(res, rej) {
      var r = db.transaction(store, 'readwrite').objectStore(store).clear();
      r.onsuccess = function() { res(); };
      r.onerror = function(e) { rej(e.target.error); };
    });
  });
}

/* ── Domain helpers ── */
function getAllTrips() { return dbGetAll(STORES.trips); }
function getTrip(id) { return dbGet(STORES.trips, id); }
function saveTrip(t) { return dbPut(STORES.trips, t); }
function deleteTripById(id) { return dbDel(STORES.trips, id); }

async function getDays(tripId) {
  var days = await dbGetByIndex(STORES.days, 'tripId', tripId);
  return days.sort(function(a, b) { return (a.dateIndex || 0) - (b.dateIndex || 0); });
}
function saveDay(d) { return dbPut(STORES.days, d); }
function deleteDayById(id) { return dbDel(STORES.days, id); }

async function getActivities(dayId) {
  var acts = await dbGetByIndex(STORES.activities, 'dayId', dayId);
  return acts.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
}
function saveActivity(a) { return dbPut(STORES.activities, a); }
function deleteActivityById(id) { return dbDel(STORES.activities, id); }

function getAllLocations() { return dbGetAll(STORES.locations); }
function getLocation(id) { return dbGet(STORES.locations, id); }
function saveLocation(l) { return dbPut(STORES.locations, l); }
function deleteLocationById(id) { return dbDel(STORES.locations, id); }

function getAllPhrases() { return dbGetAll(STORES.phrases); }
function getPhrase(id) { return dbGet(STORES.phrases, id); }
function savePhrase(p) { return dbPut(STORES.phrases, p); }

async function clearAllData() {
  await dbClearStore(STORES.trips);
  await dbClearStore(STORES.days);
  await dbClearStore(STORES.activities);
  await dbClearStore(STORES.locations);
  await dbClearStore(STORES.phrases);
}

async function exportAllData() {
  return {
    version: DB_VER,
    exportedAt: new Date().toISOString(),
    trips: await dbGetAll(STORES.trips),
    days: await dbGetAll(STORES.days),
    activities: await dbGetAll(STORES.activities),
    locations: await dbGetAll(STORES.locations),
    phrases: await dbGetAll(STORES.phrases)
  };
}

async function importAllData(data) {
  if (!data || !data.trips) throw new Error('无效的备份文件');
  await clearAllData();
  for (var i = 0; i < (data.trips || []).length; i++) await saveTrip(data.trips[i]);
  for (var i = 0; i < (data.days || []).length; i++) await saveDay(data.days[i]);
  for (var i = 0; i < (data.activities || []).length; i++) await saveActivity(data.activities[i]);
  for (var i = 0; i < (data.locations || []).length; i++) await saveLocation(data.locations[i]);
  for (var i = 0; i < (data.phrases || []).length; i++) await savePhrase(data.phrases[i]);
}

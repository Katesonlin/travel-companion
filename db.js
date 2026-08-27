/* db.js — IndexedDB wrapper */
const DB_NAME = 'travel-companion';
const DB_VER = 1;
const STORES = { trips: 'trips', days: 'days', activities: 'activities' };

let _db = null;

function dbOpen() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.trips)) {
        const s = db.createObjectStore(STORES.trips, { keyPath: 'id' });
        s.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(STORES.days)) {
        const s = db.createObjectStore(STORES.days, { keyPath: 'id' });
        s.createIndex('tripId', 'tripId');
      }
      if (!db.objectStoreNames.contains(STORES.activities)) {
        const s = db.createObjectStore(STORES.activities, { keyPath: 'id' });
        s.createIndex('dayId', 'dayId');
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = e => reject(e.target.error);
  });
}

function dbGet(store, id) {
  return dbOpen().then(db => new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).get(id);
    r.onsuccess = () => res(r.result);
    r.onerror = e => rej(e.target.error);
  }));
}

function dbPut(store, val) {
  return dbOpen().then(db => new Promise((res, rej) => {
    const r = db.transaction(store, 'readwrite').objectStore(store).put(val);
    r.onsuccess = () => res(r.result);
    r.onerror = e => rej(e.target.error);
  }));
}

function dbDel(store, id) {
  return dbOpen().then(db => new Promise((res, rej) => {
    const r = db.transaction(store, 'readwrite').objectStore(store).delete(id);
    r.onsuccess = () => res();
    r.onerror = e => rej(e.target.error);
  }));
}

function dbGetAll(store) {
  return dbOpen().then(db => new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = e => rej(e.target.error);
  }));
}

function dbGetByIndex(store, idxName, key) {
  return dbOpen().then(db => new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).index(idxName).getAll(key);
    r.onsuccess = () => res(r.result || []);
    r.onerror = e => rej(e.target.error);
  }));
}

/* Domain helpers */
function getAllTrips() { return dbGetAll(STORES.trips); }
function getTrip(id) { return dbGet(STORES.trips, id); }
function saveTrip(t) { return dbPut(STORES.trips, t); }
function deleteTripById(id) { return dbDel(STORES.trips, id); }

async function getDays(tripId) {
  const days = await dbGetByIndex(STORES.days, 'tripId', tripId);
  return days.sort((a, b) => (a.dateIndex || 0) - (b.dateIndex || 0));
}
function saveDay(d) { return dbPut(STORES.days, d); }

async function getActivities(dayId) {
  const acts = await dbGetByIndex(STORES.activities, 'dayId', dayId);
  return acts.sort((a, b) => (a.order || 0) - (b.order || 0));
}
function saveActivity(a) { return dbPut(STORES.activities, a); }
function deleteActivityById(id) { return dbDel(STORES.activities, id); }

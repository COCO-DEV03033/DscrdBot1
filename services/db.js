const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "db.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { links: {}, profiles: {}, storage: {} };
  }
  const raw = fs.readFileSync(DB_PATH, "utf8");
  const db = JSON.parse(raw || "{}");
  db.links ||= {};
  db.profiles ||= {};
  db.storage ||= {};
  return db;
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function ensureProfile(db, discordId) {
  db.profiles[discordId] ||= {
    coins: 0,
    tier: "free",
    lastDaily: 0
  };
  return db.profiles[discordId];
}

function ensureStorage(db, discordId) {
  db.storage[discordId] ||= [];
  return db.storage[discordId];
}

function getLinkedSteamId(db, discordId) {
  return db.links[discordId]?.steamId || null;
}

function setLink(db, discordId, steamId) {
  db.links[discordId] = { steamId: String(steamId) };
}

module.exports = {
  loadDB,
  saveDB,
  ensureProfile,
  ensureStorage,
  getLinkedSteamId,
  setLink
};

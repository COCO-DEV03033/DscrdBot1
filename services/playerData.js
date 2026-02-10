const fs = require("fs");

function readPlayerJson(playerJsonPath) {
  if (!playerJsonPath) throw new Error("PLAYER_JSON_PATH not set");
  if (!fs.existsSync(playerJsonPath)) throw new Error(`player.json not found: ${playerJsonPath}`);

  console.log("📄 Using PLAYER_JSON_PATH:", playerJsonPath);


  const raw = fs.readFileSync(playerJsonPath, "utf8");
  const data = JSON.parse(raw);

  if (!data || !Array.isArray(data.players)) {
    throw new Error("Invalid player.json format (missing players[])");
  }
  return data;
}

function findOnlinePlayerBySteamId(playerJson, steamId) {
  const sid = String(steamId);
  return playerJson.players.find(p => String(p.PlayerID) === sid) || null;
}

function normalize01(x) {
  const n = Number(x);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function getVitals(player) {
  return {
    growth: normalize01(player.Growth),
    hunger: normalize01(player.Hunger),
    thirst: normalize01(player.Thirst),
    hp: normalize01(player.HP),
    stamina: normalize01(player.Stamina)
  };
}

module.exports = {
  readPlayerJson,
  findOnlinePlayerBySteamId,
  getVitals
};

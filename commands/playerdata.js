const { loadDB, ensureProfile, getLinkedSteamId } = require("../services/db");
const { readPlayerJson, findOnlinePlayerBySteamId, getVitals } = require("../services/playerData");

function pct(x) {
  return `${Math.round((Number(x) || 0) * 100)}%`;
}

function fmtNum(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "N/A";
  return v.toFixed(1);
}

module.exports = {
  name: "playerdata",
  description: "📡 Show your current live PlayerData from the server",

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const db = loadDB();
      ensureProfile(db, interaction.user.id);

      const steamId = getLinkedSteamId(db, interaction.user.id);
      if (!steamId) {
        return interaction.editReply("❌ You must /link your SteamID first.");
      }

      const playerJson = readPlayerJson(process.env.PLAYER_JSON_PATH);
      const online = findOnlinePlayerBySteamId(playerJson, steamId);

      if (!online) {
        return interaction.editReply(
          `❌ You are not currently listed as online in player.json.\n` +
          `✅ Join the server in-game, then run /playerdata again.\n` +
          `🔗 Linked SteamID: **${steamId}**`
        );
      }

      const v = getVitals(online);

      const msg =
        `📡 **Live PlayerData**\n` +
        `🔗 SteamID: **${steamId}**\n` +
        `🦖 Class: \`${online.Class}\`\n` +
        `🌱 Growth: **${pct(v.growth)}**\n` +
        `🍖 Hunger: **${pct(v.hunger)}**\n` +
        `💧 Thirst: **${pct(v.thirst)}**\n` +
        `❤️ HP: **${pct(v.hp)}**\n` +
        `⚡ Stamina: **${pct(v.stamina)}**\n\n` +
        `📍 Position: X **${fmtNum(online.X)}** | Y **${fmtNum(online.Y)}** | Z **${fmtNum(online.Z)}**\n` +
        `📶 Ping: **${online.Ping ?? "N/A"}**\n` +
        `👥 GroupID: **${online.GroupID ?? "N/A"}**`;

      return interaction.editReply(msg);
    } catch (err) {
      console.error(err);
      try {
        return interaction.editReply(`❌ Error reading PlayerData: ${err.message}`);
      } catch {}
    }
  }
};

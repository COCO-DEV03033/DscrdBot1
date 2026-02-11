const { loadDB, saveDB, ensureProfile, ensureStorage, getLinkedSteamId } = require("../services/db");
const { setGrowth, setVitalsFull } = require("../services/serverCommands");
const { readPlayerJson, findOnlinePlayerBySteamId } = require("../services/playerData");

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isDry() {
  return String(process.env.DRY_RUN_SERVER_COMMANDS || "") === "1";
}

module.exports = {
  name: "restore",
  description: "🧬 Restore a stored dino (staged growth + vitals fill)",
  options: [
    {
      name: "dino_name",
      type: 3,
      description: "Name of the stored dino to restore",
      required: true
    }
  ],


  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const dinoName = interaction.options.getString("dino_name");

      const db = loadDB();
      const profile = ensureProfile(db, interaction.user.id);
      const storage = ensureStorage(db, interaction.user.id);

      const steamId = getLinkedSteamId(db, interaction.user.id);
      if (!steamId) {
        return interaction.editReply("❌ You must /link your SteamID first! 🔗");
      }

      // Find stored dino
      const idx = storage.findIndex(d => (d?.name || "").toLowerCase() === dinoName.toLowerCase());
      if (idx === -1) {
        return interaction.editReply(`❌ Dino "${dinoName}" not found in your storage. 📦`);
      }

      const stored = storage[idx];

      // Optional: verify player is online and class matches (only if you want strict)
      // If PLAYER_JSON_PATH exists, we can enforce "must be logged in as same class"
      if (process.env.PLAYER_JSON_PATH) {
        try {
          const playerJson = readPlayerJson(process.env.PLAYER_JSON_PATH);
          const online = findOnlinePlayerBySteamId(playerJson, steamId);

          if (!online) {
            return interaction.editReply(
              `❌ You are not listed as online right now.\n` +
              `🎮 Join the server in-game, then try /restore again.\n` +
              `🔗 SteamID: **${steamId}**`
            );
          }

          if (stored.class && online.Class && stored.class !== online.Class) {
            return interaction.editReply(
              `❌ Wrong dino in-game.\n` +
              `🦖 Stored: \`${stored.class}\`\n` +
              `🎮 Current: \`${online.Class}\`\n\n` +
              `➡️ Log in as the correct dino type, then run /restore again.`
            );
          }
        } catch (e) {
          // If local file missing or parsing fails, do not block restore
          console.log("⚠️ player.json check skipped:", e.message);
        }
      }

      function progressBar(step, total) {
        const filled = Math.round((step / total) * 10);
        return "█".repeat(filled) + "░".repeat(10 - filled);
      }

      const loadingEmbed = {
        title: "🧬 Restoring Dino...",
        description: "Please wait while growth stages are applied.",
        image: {
          url: "./data/loading.gif"
        },
        color: 0x00ff99
      };

      // await interaction.editReply({ embeds: [loadingEmbed] });


      // Pull staged growth settings from env (defaults)
      const g1 = Number(process.env.RESTORE_GROWTH_1 || 0.33);
      const g2 = Number(process.env.RESTORE_GROWTH_2 || 0.54);
      const g3 = Number(process.env.RESTORE_GROWTH_3 || 0.65);
      const delayMs = Number(process.env.RESTORE_STEP_DELAY_SEC || 30) * 1000;

      // Show progress (users hate waiting without feedback)
      await interaction.editReply(
        `🧬 **Restoring ${stored.name}**... \n⏳ ${progressBar(1, 4)}`, { embeds: [loadingEmbed] }
      );

      await setGrowth(steamId, g1);
      await sleep(delayMs);

      await interaction.editReply(
        `🧬 **Restoring ${stored.name}**... \n⏳ ${progressBar(2, 4)}`, { embeds: [loadingEmbed] }
      );

      await setGrowth(steamId, g2);
      await sleep(delayMs);

      await interaction.editReply(
        `🧬 **Restoring ${stored.name}**... \n⏳ ${progressBar(3, 4)}`, { embeds: [loadingEmbed] }
      );

      await setGrowth(steamId, g2);
      await sleep(delayMs);

      await interaction.editReply(
        `🧬 **Restoring ${stored.name}**... \n⏳ ${progressBar(4, 4)}`, { embeds: [loadingEmbed] }
      );

      await setVitalsFull(steamId);
      await sleep(delayMs);

      await interaction.editReply(
        `✅ **${stored.name} restored!** 🧬\n⏳ ${progressBar(5, 4)}`
      );
      await setVitalsFull(steamId);

      // Remove from storage
      storage.splice(idx, 1);
      db.storage[interaction.user.id] = storage;
      saveDB(db);

      // Final message
      if (isDry()) {
        return interaction.editReply(`✅ Restored **${stored.name}** 🧬 (TEST MODE).\n🧪 Server commands were skipped.\n📦 Removed from storage.`);
      }

      return interaction.editReply(`✅ Restored **${stored.name}** 🧬 (growth staged + vitals filled). 🎉\n📦 Removed from storage.`);
    } catch (err) {
      console.error(err);
      try {
        return interaction.editReply(`❌ Restore failed: ${err.message}`);
      } catch { }
    }
  }
};

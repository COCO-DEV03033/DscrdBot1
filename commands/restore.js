const { loadDB, saveDB, ensureProfile, ensureStorage, getLinkedSteamId } = require("../services/db");
const { setGrowth, setVitalsFull, runDietFull } = require("../services/serverCommands");
const { readPlayerJson, findOnlinePlayerBySteamId } = require("../services/playerData");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isDry() {
  return String(process.env.DRY_RUN_SERVER_COMMANDS || "") === "1";
}

function progressBar(step, total) {
  const filled = Math.round((step / total) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

module.exports = {
  name: "restore",
  description: "🧬 Restore a stored dino (staged growth + vitals + diet fill)",
  options: [
    {
      name: "dino_name",
      type: 3,
      description: "Name of the stored dino to restore",
      required: true
    }
  ],

  async execute(interaction) {
    // ✅ always defer immediately (prevents Unknown interaction)
    await interaction.deferReply({ flags: 64 });

    try {
      const dinoName = interaction.options.getString("dino_name");

      const db = loadDB();
      ensureProfile(db, interaction.user.id);
      const storage = ensureStorage(db, interaction.user.id);

      const steamId = getLinkedSteamId(db, interaction.user.id);
      if (!steamId) {
        return interaction.editReply({ content: "❌ You must /link your SteamID first! 🔗" });
      }

      // Find stored dino
      const idx = storage.findIndex((d) => (d?.name || "").toLowerCase() === dinoName.toLowerCase());
      if (idx === -1) {
        return interaction.editReply({ content: `❌ Dino "${dinoName}" not found in your storage. 📦` });
      }

      const stored = storage[idx];

      // Optional: verify player is online and class matches
      if (process.env.PLAYER_JSON_PATH) {
        try {
          const playerJson = readPlayerJson(process.env.PLAYER_JSON_PATH);
          const online = findOnlinePlayerBySteamId(playerJson, steamId);

          if (!online) {
            return interaction.editReply({
              content:
                `❌ You are not listed as online right now.\n` +
                `🎮 Join the server in-game, then try /restore again.\n` +
                `🔗 SteamID: **${steamId}**`
            });
          }

          if (stored.class && online.Class && stored.class !== online.Class) {
            return interaction.editReply({
              content:
                `❌ Wrong dino in-game.\n` +
                `🦖 Stored: \`${stored.class}\`\n` +
                `🎮 Current: \`${online.Class}\`\n\n` +
                `➡️ Log in as the correct dino type, then run /restore again.`
            });
          }
        } catch (e) {
          console.log("⚠️ player.json check skipped:", e.message);
        }
      }

      // Growth settings
      const g1 = Number(process.env.RESTORE_GROWTH_1 || 0.33);
      const g2 = Number(process.env.RESTORE_GROWTH_2 || 0.54);
      const g3 = Number(process.env.RESTORE_GROWTH_3 || 0.65);

      const delayMs = Number(process.env.RESTORE_STEP_DELAY_SEC || 30) * 1000;
      const vitalDelayMs = Number(process.env.RESTORE_VITAL_DELAY_SEC || 5) * 1000; // ✅ client: 5 sec

      // Progress updates
      await interaction.editReply({
        content: `🧬 **Restoring ${stored.name}**...\n⏳ ${progressBar(1, 5)}  (Growth ${Math.round(g1 * 100)}%)`
      });
      await setGrowth(steamId, g1);
      await sleep(delayMs);

      await interaction.editReply({
        content: `🧬 **Restoring ${stored.name}**...\n⏳ ${progressBar(2, 5)}  (Growth ${Math.round(g2 * 100)}%)`
      });
      await setGrowth(steamId, g2);
      await sleep(delayMs);

      await interaction.editReply({
        content: `🧬 **Restoring ${stored.name}**...\n⏳ ${progressBar(3, 5)}  (Growth ${Math.round(g3 * 100)}%)`
      });
      await setGrowth(steamId, g3);
      await sleep(delayMs);

      await interaction.editReply({
        content: `🍖 Filling vitals for **${stored.name}**...\n⏳ ${progressBar(4, 5)}`
      });

      await setVitalsFull(steamId);

      // ✅ client: wait 5 seconds after vitals
      await sleep(vitalDelayMs);

      // ✅ client: run diet raw command right after vitals delay
      await runDietFull(steamId);

      // Remove from storage after successful restore
      storage.splice(idx, 1);
      db.storage[interaction.user.id] = storage;
      saveDB(db);

      if (isDry()) {
        return interaction.editReply({
          content:
            `✅ Restored **${stored.name}** 🧬 (TEST MODE)\n` +
            `🧪 Server commands were skipped.\n` +
            `📦 Removed from storage.`
        });
      }

      return interaction.editReply({
        content:
          `✅ Restored **${stored.name}** 🧬 (growth staged + vitals + diet filled). 🎉\n` +
          `📦 Removed from storage.\n` +
          `⏳ ${progressBar(5, 5)}`
      });
    } catch (err) {
      console.error(err);
      return interaction.editReply({ content: `❌ Restore failed: ${err.message}` });
    }
  }
};

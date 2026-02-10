const { loadDB, saveDB, ensureProfile, ensureStorage, getLinkedSteamId } = require("../services/db");
const { readPlayerJson, findOnlinePlayerBySteamId, getVitals } = require("../services/playerData");
const { getSlotLimit, getMinGrowth, getTier } = require("../services/slots");
const { killDino } = require("../services/serverCommands");
const classMap = require("../config/classMap");

module.exports = {
  name: "store",
  description: "🦖 Store your current in-game dino (tier perks apply)",
  options: [
    {
      name: "name",
      type: 3,
      description: "Optional name for this stored dino (ex: Rex1)",
      required: false
    }
  ],

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const db = loadDB();
      const profile = ensureProfile(db, interaction.user.id);
      const steamId = getLinkedSteamId(db, interaction.user.id);

      if (!steamId) {
        return interaction.editReply("❌ You must /link your SteamID first.");
      }

      const storage = ensureStorage(db, interaction.user.id);
      const limit = getSlotLimit(profile);

      if (storage.length >= limit) {
        return interaction.editReply(`❌ Storage full. Slots: **${storage.length} / ${limit}** 📦`);
      }

      const playerJson = readPlayerJson(process.env.PLAYER_JSON_PATH);
      const online = findOnlinePlayerBySteamId(playerJson, steamId);

      if (!online) {
        return interaction.editReply("❌ You are not found online in `player.json`.\n✅ Please join the server in-game, then try again.");
      }

      const { growth, hunger, thirst, hp } = getVitals(online);
      const minGrowth = getMinGrowth(profile);
      const tier = getTier(profile);

      // Basic v1 requirements (edit thresholds if needed)
      if (growth < minGrowth) {
        return interaction.editReply(
          `❌ Not grown enough to store.\n⭐ Tier: **${tier}** requires **${Math.round(minGrowth * 100)}%** growth.\nCurrent: **${Math.round(growth * 100)}%**`
        );
      }
      if (hunger < 0.9 || thirst < 0.9) {
        return interaction.editReply(
          `❌ Vitals too low to store.\n🍖 Hunger: **${Math.round(hunger * 100)}%** (need 90%)\n💧 Thirst: **${Math.round(thirst * 100)}%** (need 90%)`
        );
      }
      if (hp < 0.5) {
        return interaction.editReply(`❌ HP too low to store.\n❤️ HP: **${Math.round(hp * 100)}%** (need 50%)`);
      }

      const dinoClass = String(online.Class || "UnknownClass");
      const friendly = classMap[dinoClass] || dinoClass.replace(/^BP_/, "").replace(/_C$/, "");
      const requestedName = interaction.options.getString("name");

      // Ensure unique name per user storage
      let name = (requestedName && requestedName.trim()) ? requestedName.trim() : friendly;
      const existingNames = new Set(storage.map(d => d.name));
      if (existingNames.has(name)) {
        let n = 2;
        while (existingNames.has(`${name} #${n}`)) n++;
        name = `${name} #${n}`;
      }

      storage.push({
        id: `${Date.now()}`,
        name,
        class: dinoClass,
        steamId: String(steamId),
        storedAt: Date.now()
      });

      saveDB(db);

      // Kill dino on server (per client logic)
      // 
      const isDry = String(process.env.DRY_RUN_SERVER_COMMANDS || "") === "1";

      if (!isDry) {
        await killDino(steamId);
        return interaction.editReply(`✅ Stored **${name}** 🦖 and removed it from the server (killed). 📦`);
      }

      return interaction.editReply(`✅ Stored **${name}** 🦖 locally (TEST MODE). 📦\n🧪 Server kill command skipped.`);

    } catch (err) {
      console.error(err);
      return interaction.editReply(`❌ Store failed: ${err.message}`);
    }
  }
};

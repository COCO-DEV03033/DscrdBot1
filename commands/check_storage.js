const { loadDB, ensureProfile, ensureStorage } = require("../services/db");
const { getSlotLimit, getTier, getMinGrowth } = require("../services/slots");

module.exports = {
  name: "check_storage",
  description: "📦 Check your stored dinos, details, and open slots",

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const db = loadDB();
      const profile = ensureProfile(db, interaction.user.id);
      const list = ensureStorage(db, interaction.user.id);

      const tier = getTier(profile);
      const limit = getSlotLimit(profile);
      const minGrowth = getMinGrowth(profile);

      const header =
        `📦 **Your Storage**\n` +
        `⭐ Tier: **${tier}**\n` +
        `🧺 Slots: **${list.length} / ${limit}** (Open: **${Math.max(0, limit - list.length)}**)\n` +
        `🌱 Store requirement: **${Math.round(minGrowth * 100)}%** growth\n`;

      if (!list || list.length === 0) {
        return interaction.editReply(header + `\n🫙 Storage is empty.`);
      }

      const lines = list.map((d, i) => {
        const storedWhen = d.storedAt ? `<t:${Math.floor(d.storedAt / 1000)}:R>` : "unknown";
        const steam = d.steamId ? `🔗 Steam: \`${d.steamId}\`` : "";
        return (
          `**${i + 1}.** 🦖 **${d.name}**\n` +
          `   🧬 Class: \`${d.class}\`\n` +
          (steam ? `   ${steam}\n` : "") +
          `   🕒 Stored: ${storedWhen}`
        );
      });

      return interaction.editReply(`${header}\n${lines.join("\n\n")}`);
    } catch (err) {
      console.error(err);
      try {
        return interaction.editReply("❌ Error reading storage.");
      } catch {}
    }
  }
};

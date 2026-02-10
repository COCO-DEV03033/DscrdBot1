const { loadDB, ensureProfile, ensureStorage } = require("../services/db");
const { getSlotLimit, getTier } = require("../services/slots");

module.exports = {
  name: "storage",
  description: "📦 Check your stored dinos and slots",

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const db = loadDB();
    const profile = ensureProfile(db, interaction.user.id);
    const list = ensureStorage(db, interaction.user.id);

    const tier = getTier(profile);
    const limit = getSlotLimit(profile);

    if (list.length === 0) {
      return interaction.editReply(`📦 Storage is empty.\n⭐ Tier: **${tier}**\nSlots: **0 / ${limit}**`);
    }

    const lines = list.map((d, i) => `**${i + 1}.** 🦖 **${d.name}** (${d.class})`);
    return interaction.editReply(
      `📦 **Your Storage**\n${lines.join("\n")}\n\n⭐ Tier: **${tier}**\nSlots: **${list.length} / ${limit}**`
    );
  }
};

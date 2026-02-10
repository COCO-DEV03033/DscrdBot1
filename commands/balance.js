const { loadDB, ensureProfile } = require("../services/db");

module.exports = {
  name: "balance",
  description: "💰 Check your coin balance",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const db = loadDB();
    const profile = ensureProfile(db, interaction.user.id);

    return interaction.editReply(`💰 You have **${profile.coins || 0}** coins.`);
  }
};

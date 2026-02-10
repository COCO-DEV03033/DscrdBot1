const { loadDB, saveDB, ensureProfile, setLink } = require("../services/db");

module.exports = {
  name: "link",
  description: "🔗 Link your Discord account to your SteamID",
  options: [
    {
      name: "steamid",
      type: 3,
      description: "Enter your SteamID (7656...)",
      required: true
    }
  ],

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const steamId = interaction.options.getString("steamid");
    if (!steamId || !/^\d{10,20}$/.test(steamId)) {
      return interaction.editReply("❌ Invalid SteamID format.");
    }

    const db = loadDB();
    ensureProfile(db, interaction.user.id);
    setLink(db, interaction.user.id, steamId);
    saveDB(db);

    return interaction.editReply(`✅ Linked Discord account to SteamID **${steamId}** 🔗`);
  }
};

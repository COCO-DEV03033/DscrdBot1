const { loadDB, saveDB, ensureStorage } = require("../services/db");

module.exports = {
  name: "clear_storage",
  description: "🧹 Clear your stored dinos (testing / admin use)",

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.editReply("❌ Admin only command.");
      }
      
      await interaction.deferReply({ ephemeral: true });

      const db = loadDB();
      const storage = ensureStorage(db, interaction.user.id);

      if (storage.length === 0) {
        return interaction.editReply("📦 Storage already empty.");
      }

      const count = storage.length;
      db.storage[interaction.user.id] = [];
      saveDB(db);

      return interaction.editReply(`🧹 Cleared **${count}** stored dinos successfully.`);
    } catch (err) {
      console.error(err);
      try {
        return interaction.editReply("❌ Failed to clear storage.");
      } catch { }
    }
  }
};

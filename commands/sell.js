const { loadDB, saveDB, ensureProfile, ensureStorage } = require("../services/db");
const { addCoins } = require("../services/economy");
const prices = require("../config/dinoPrices");

module.exports = {
  name: "sell",
  description: "💰 Sell a stored dino to the bot (permanent)",
  options: [
    {
      name: "dino_name",
      type: 3,
      description: "Name of the stored dino to sell",
      required: true
    }
  ],

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const dinoName = interaction.options.getString("dino_name");
    const db = loadDB();
    const profile = ensureProfile(db, interaction.user.id);
    const storage = ensureStorage(db, interaction.user.id);

    const idx = storage.findIndex(d => d.name.toLowerCase() === dinoName.toLowerCase());
    if (idx === -1) {
      return interaction.editReply(`❌ Dino "${dinoName}" is not in your storage.`);
    }

    const dino = storage[idx];
    const price = prices[dino.class] || prices[(dino.class || "").split(" #")[0]] || 100;

    // Remove permanently
    storage.splice(idx, 1);
    addCoins(profile, price);

    saveDB(db);

    return interaction.editReply(`✅ Sold **${dino.name}** 🦖 for **${price}** 💰. Dino is gone forever.`);
  }
};


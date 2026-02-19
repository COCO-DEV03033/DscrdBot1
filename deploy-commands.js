const { REST, Routes } = require("discord.js");
require("dotenv").config();

const commands = [
  { name: "ping", description: "🏓 Check if bot is online" },

  {
    name: "link",
    description: "🔗 Link your Discord account to your SteamID",
    options: [
      { name: "steamid", type: 3, description: "Enter your SteamID (7656...)", required: true }
    ]
  },
  { name: "check_storage", description: "📦 Check your stored dinos and open slots" },

  { name: "balance", description: "💰 Check your coin balance" },

  { name: "storage", description: "📦 Check your stored dinos and slots" },

  { name: "playerdata", description: "📡 Show your current live PlayerData from the server" },

  { name: "clear_storage", description: "🧹 Clear your stored dinos (testing)" },

  {
    name: "price",
    description: "🏷️ Show dino sell prices",
    options: [
      {
        name: "dino_type",
        type: 3,
        description: "Optional: check one dino type (e.g. Tyrannosaurus)",
        required: false
      }
    ]
  },

  {
    name: "store",
    description: "🦖 Store your current in-game dino (tier perks apply)",
    options: [
      { name: "name", type: 3, description: "Optional name for this stored dino", required: false }
    ]
  },

  {
    name: "restore",
    description: "🧬 Restore a stored dino (must be logged in as correct dino type)",
    options: [
      { name: "dino_name", type: 3, description: "Name of the stored dino to restore", required: true }
    ]
  },

  {
    name: "sell",
    description: "💰 Sell a stored dino to the bot (permanent)",
    options: [
      { name: "dino_name", type: 3, description: "Name of the stored dino to sell", required: true }
    ]
  }
];

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error("❌ Missing DISCORD_TOKEN / CLIENT_ID / GUILD_ID in .env");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered successfully!");
  } catch (err) {
    console.error("❌ Deploy failed:", err);
  }
})();


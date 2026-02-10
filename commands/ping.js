module.exports = {
  name: "ping",
  description: "🏓 Check if the bot is online",
  async execute(interaction) {
    await interaction.reply("🏓 Pong! Bot is working.");
  }
};

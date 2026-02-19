const PRICES = require("../config/dinoPrices");

function prettyCoins(n) {
  return `${Number(n || 0).toLocaleString()} 💰`;
}

function titleCase(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/(^|\s|_|\-)\w/g, (m) => m.toUpperCase())
    .replace(/[\s_-]/g, "");
}

// Map normalized -> canonical key
function buildIndex() {
  const idx = {};
  for (const k of Object.keys(PRICES)) {
    idx[k.toLowerCase()] = k;
  }
  return idx;
}

module.exports = {
  name: "price",
  description: "🏷️ Show sell prices for dinos (bot buyback)",

  options: [
    {
      name: "dino_type",
      type: 3,
      description: "Optional: check one dino type (e.g. Tyrannosaurus)",
      required: false
    }
  ],

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      const query = interaction.options.getString("dino_type");
      const index = buildIndex();

      // ✅ Single dino lookup
      if (query) {
        const key = index[String(query).trim().toLowerCase()];
        if (!key) {
          return interaction.editReply({
            content:
              `❌ Unknown dino type: **${query}**\n` +
              `💡 Try /price without input to see the full list.`
          });
        }

        const value = PRICES[key];
        if (value <= 0) {
          return interaction.editReply({
            content:
              `⚠️ **${key}** sell price is not set yet.\n` +
              `🛠️ Admin must update the price list.`
          });
        }

        return interaction.editReply({
          content: `🏷️ **${key}** sells for **${prettyCoins(value)}** to the bot. ✅`
        });
      }

      // ✅ Full list
      const entries = Object.entries(PRICES)
        .sort((a, b) => Number(b[1]) - Number(a[1])); // highest first

      const lines = entries.map(([name, price]) => {
        if (Number(price) <= 0) return `⚠️ ${name}: **NOT SET**`;
        return `🦖 ${name}: **${prettyCoins(price)}**`;
      });

      // Split if too long (Discord message safe)
      const header = "🏷️ **Dino Sell Price List (to bot)**\n";
      const body = lines.join("\n");

      const msg = header + body;

      // If message too long, trim (rare with this list but safe)
      if (msg.length > 1900) {
        return interaction.editReply({
          content: header + lines.slice(0, 40).join("\n") + "\n…"
        });
      }

      return interaction.editReply({ content: msg });
    } catch (err) {
      console.error(err);
      return interaction.editReply({ content: `❌ /price failed: ${err.message}` });
    }
  }
};
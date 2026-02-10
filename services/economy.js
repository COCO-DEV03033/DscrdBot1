function addCoins(profile, amount) {
  const a = Number(amount) || 0;
  profile.coins = Number(profile.coins || 0) + a;
  if (profile.coins < 0) profile.coins = 0;
  return profile.coins;
}

function canAfford(profile, amount) {
  return Number(profile.coins || 0) >= Number(amount || 0);
}

module.exports = { addCoins, canAfford };

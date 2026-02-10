const tiers = require("../config/tiers");

function getTier(profile) {
  return (profile?.tier && tiers[profile.tier]) ? profile.tier : "free";
}

function getSlotLimit(profile) {
  return tiers[getTier(profile)].slots;
}

function getMinGrowth(profile) {
  return tiers[getTier(profile)].minGrowth;
}

module.exports = { getTier, getSlotLimit, getMinGrowth };

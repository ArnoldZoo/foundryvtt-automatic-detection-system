// ============================================================================
// Passive Detection System (ADS)
// Module Settings + Pre-Roll Manager UI
// ============================================================================

import { ADS, adsDebug } from "./ads.js";

// Namespace for player roll storage
const ROLL_FLAG = "ads-prerolls";

// Default options for new tiles
export const ADS_DEFAULTS = {
  dc: 12,
  primarySkill: "prc",
  delay: 5,
  radius: 10,
  rollMode: "auto",
  playerSelect: "highest"
};

// ============================================================================
// REGISTER MODULE SETTINGS
// ============================================================================
export function registerADSSettings() {

  // Debug Mode
  game.settings.register(ADS.ID, "debugMode", {
    name: "ADS Debug Mode",
    hint: "Log detailed debug information to the console.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => ADS.DEBUG = value
  });

  // Pre-Roll Manager Button
  game.settings.registerMenu(ADS.ID, "prerollManager", {
    name: "Pre-Roll Manager",
    label: "Open Manager",
    icon: "fas fa-dice-d20",
    type: ADSPrerollManager,
    restricted: true
  });

  // Default DC
  game.settings.register(ADS.ID, "defaultDC", {
    name: "Default DC",
    hint: "Default Difficulty Class for new detection tiles.",
    scope: "world",
    config: true,
    type: Number,
    default: ADS_DEFAULTS.dc
  });

  // Default Primary Skill
  game.settings.register(ADS.ID, "defaultPrimarySkill", {
    name: "Default Primary Skill",
    scope: "world",
    config: true,
    type: String,
    choices: {
      prc: "Perception",
      inv: "Investigation",
      arc: "Arcana",
      his: "History",
      rel: "Religion",
      sur: "Survival",
      dettrap: "Detect Trap",
      detdoor: "Detect Secret Door",
      detpanel: "Detect Hidden Panel",
      detmagic: "Detect Magic Residue",
      detcreature: "Detect Creature Presence"
    },
    default: ADS_DEFAULTS.primarySkill
  });

  // Default Delay
  game.settings.register(ADS.ID, "defaultDelay", {
    name: "Default Delay (seconds)",
    scope: "world",
    config: true,
    type: Number,
    default: ADS_DEFAULTS.delay
  });

  // Default Radius
  game.settings.register(ADS.ID, "defaultRadius", {
    name: "Default Proximity Radius (ft)",
    scope: "world",
    config: true,
    type: Number,
    default: ADS_DEFAULTS.radius
  });

  // Default Roll Mode
  game.settings.register(ADS.ID, "defaultRollMode", {
    name: "Default Roll Mode",
    scope: "world",
    config: true,
    type: String,
    choices: {
      auto: "Auto Roll (Blind)",
      preroll: "Use Pre-Rolls",
      highest: "All Players (Highest Roll)"
    },
    default: ADS_DEFAULTS.rollMode
  });

  // Default Player Selection
  game.settings.register(ADS.ID, "defaultPlayerSelection", {
    name: "Default Player Selection Method",
    scope: "world",
    config: true,
    type: String,
    choices: {
      highest: "Highest Modifier",
      scout: "Scout (Best Token)",
      group: "All Players"
    },
    default: ADS_DEFAULTS.playerSelect
  });
}

// ============================================================================
// PRE-ROLL MANAGER APPLICATION
// ============================================================================
class ADSPrerollManager extends FormApplication {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "ads-preroll-manager",
      title: "ADS Pre-Roll Manager",
      template: `modules/${ADS.ID}/templates/ads-preroll-manager.html`,
      width: 400,
      height: "auto",
      closeOnSubmit: false
    });
  }

  getData() {
    const data = super.getData();
    data.players = game.users.players;
    data.rolls = {};

    for (let u of game.users.players) {
      data.rolls[u.id] = game.settings.get(ADS.ID, `${ROLL_FLAG}-${u.id}`) || [];
    }
    return data;
  }

  async _updateObject(event, formData) {
    return;
  }

  // Add rolls (comma-separated)
  async addRolls(userId, rollCSV) {
    const rolls = rollCSV.split(",").map(r => Number(r.trim())).filter(n => !isNaN(n));
    const existing = game.settings.get(ADS.ID, `${ROLL_FLAG}-${userId}`) || [];
    const updated = existing.concat(rolls);

    await game.settings.set(ADS.ID, `${ROLL_FLAG}-${userId}`, updated);
    this.render();
  }

  // Replace rolls for a user
  async replaceRolls(userId, rollCSV) {
    const rolls = rollCSV.split(",").map(r => Number(r.trim())).filter(n => !isNaN(n));
    await game.settings.set(ADS.ID, `${ROLL_FLAG}-${userId}`, rolls);
    this.render();
  }

  // Clear rolls for a user
  async clearRolls(userId) {
    await game.settings.set(ADS.ID, `${ROLL_FLAG}-${userId}`, []);
    this.render();
  }
}

// ============================================================================
// ACCESSOR FOR ENGINE
// ============================================================================
export function consumePreroll(userId) {
  const key = `${ROLL_FLAG}-${userId}`;
  const list = game.settings.get(ADS.ID, key) || [];
  if (!list.length) return null;

  const next = list.shift();
  game.settings.set(ADS.ID, key, list);
  return next;
}

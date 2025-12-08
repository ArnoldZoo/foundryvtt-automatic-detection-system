// ============================================================================
// Passive Detection System (ADS)
// Master Entry Script
// ============================================================================

// Namespace
export const ADS = {
  ID: "ads-detection-triggers",
  FLAGS: "ads-detection-triggers",
  DEBUG: false
};


// ============================================================================
// SETTINGS INITIALIZATION
// ============================================================================
import { registerADSSettings } from "./ads-settings.js";

// ============================================================================
// UI: TILE CONFIG TAB
// ============================================================================
import { registerADSTileConfig } from "./ads-ui.js";

// ============================================================================
// DETECTION ENGINE
// ============================================================================
import { initializeADSEngine } from "./ads-engine.js";

// ============================================================================
// REVEAL SYSTEM
// ============================================================================
import { ADSRevealSystem } from "./ads-reveal.js";

// ============================================================================
// GM HUD BUTTON
// ============================================================================
import { registerADSHud } from "./ads-hud.js";

// ============================================================================
// UTILITY LIBRARY
// ============================================================================
import * as ADSUtil from "./ads-util.js";

// ============================================================================
// MODULE INIT
// ============================================================================
Hooks.once("init", () => {
  console.log("ADS | Initializing Passive Detection System");

  // Load settings
  registerADSSettings();
});

// ============================================================================
// MODULE READY (canvas available)
// ============================================================================
Hooks.once("ready", () => {
  console.log("ADS | Ready");

  // Load Tile Config UI
  registerADSTileConfig();

  // Initialize detection engine
  initializeADSEngine();

  // Register GM HUD Button
  registerADSHud();

  // Debug flag sync
  ADS.DEBUG = game.settings.get(ADS.ID, "debugMode");
});

// ============================================================================
// Convenient Debug Logger
// ============================================================================
export function adsDebug(...args) {
  if (ADS.DEBUG) console.log("ADS DEBUG |", ...args);
}

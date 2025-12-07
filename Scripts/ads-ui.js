// ============================================================================
// Passive Detection System (ADS)
// Tile Configuration UI Injection
// ============================================================================

import { ADS, adsDebug } from "./ads.js";
import { ADS_DEFAULTS } from "./ads-settings.js";

// ============================================================================
// REGISTER TILE CONFIG UI
// ============================================================================
export function registerADSTileConfig() {

  Hooks.on("renderTileConfig", (sheet, html) => {
    const tile = sheet.document;

    // Insert a new tab called "Passive Detection"
    const tabs = html.find(".sheet-tabs");
    const contents = html.find(".sheet-body");

    const newTab = `
      <a class="item" data-tab="ads-detection">
        <i class="fas fa-eye"></i> Passive Detection
      </a>
    `;
    tabs.append(newTab);

    const newPanel = $(`<div class="tab" data-tab="ads-detection"></div>`);
    contents.append(newPanel);

    // Load template asynchronously
    const templatePath = `modules/${ADS.ID}/templates/ads-tile-config.html`;

    renderTemplate(templatePath, getTileFlagData(tile)).then(templateHTML => {
      newPanel.html(templateHTML);

      // Enable collapsible sections
      newPanel.find(".ads-collapse-header").on("click", ev => {
        const parent = ev.currentTarget.closest(".ads-collapse");
        parent.classList.toggle("open");
      });

      // Bind Test Detection button
      newPanel.find("button[name='ads.testDetection']").on("click", () => {
        ui.notifications.info("ADS: Test Detection will be implemented in Phase 9.");
      });
    });

    // Intercept the update to save ADS flags
    const original = sheet._updateObject.bind(sheet);
    sheet._updateObject = async function(event, formData) {
      const adsFlags = {};

      // Extract ADS.* fields
      for (const [key, value] of Object.entries(formData)) {
        if (key.startsWith("ads.")) {
          const flagName = key.substring(4);
          adsFlags[flagName] = normalizeValue(value);
          delete formData[key];
        }
      }

      // Merge flags instead of overwriting
      const existing = tile.getFlag(ADS.FLAGS) || {};
      const merged = foundry.utils.mergeObject(existing, adsFlags, { inplace: false });

      await tile.setFlag(ADS.FLAGS, merged);

      return original(event, formData);
    };
  });
}

// ============================================================================
// Prepare data for template
// ============================================================================
function getTileFlagData(tile) {
  const flags = tile.getFlag(ADS.FLAGS) || {};

  return {
    ads: {
      revealTag: flags.revealTag || "",
      primarySkill: flags.primarySkill || ADS_DEFAULTS.primarySkill,
      secondarySkill: flags.secondarySkill || "none",
      dc: flags.dc ?? ADS_DEFAULTS.dc,
      revealDelay: flags.revealDelay ?? ADS_DEFAULTS.delay,
      triggerMode: flags.triggerMode || "overlap",
      radius: flags.radius ?? ADS_DEFAULTS.radius,
      includeNPCs: flags.includeNPCs ?? false,
      scoutMode: flags.scoutMode ?? false,
      rollMode: flags.rollMode || ADS_DEFAULTS.rollMode,
      useHighest: flags.useHighest ?? false,
      clue4: flags.clue4 || "",
      clue3: flags.clue3 || "",
      clue2: flags.clue2 || "",
      clue1: flags.clue1 || "",
      clue0: flags.clue0 || "",
      overrideFog: flags.overrideFog ?? true,
      autoDoor: flags.autoDoor ?? true,
      playSound: flags.playSound ?? false,
      soundFile: flags.soundFile || "",
      debug: flags.debug ?? false,

      // Skill and mode options for dropdowns
      skillOptions: {
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

      triggerModes: {
        overlap: "Overlap (Tile Bounds)",
        proximity: "Proximity (Radius)"
      },

      rollModes: {
        auto: "Auto Roll (Blind)",
        preroll: "Use Pre-Rolls",
        highest: "All Players (Highest Result)"
      }
    }
  };
}

// ============================================================================
// Normalize HTML Form Values
// ============================================================================
function normalizeValue(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  if (!isNaN(val) && val !== "") return Number(val);
  return val;
}

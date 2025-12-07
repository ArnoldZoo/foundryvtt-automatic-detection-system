// ============================================================================
// Passive Detection System (ADS)
// Core Detection Engine — Movement Hooks, Rolls, Tiers, Popups, Reveal
// ============================================================================

import { ADS, adsDebug } from "./ads.js";
import { ADSRevealSystem } from "./ads-reveal.js";
import {
  tileOnCooldown, setTileCooldown,
  getValidSceneTokens, resolveScout, getHighestModToken,
  tokenOverlapsTile, tokenInProximity,
  percentOfDC, getSkillMod
} from "./ads-util.js";
import { consumePreroll } from "./ads-settings.js";


// ============================================================================
// PUBLIC ENTRY — called from ads.js on ready()
// ============================================================================
export function initializeADSEngine() {
  registerMovementHooks();
}


// ============================================================================
// MOVEMENT HOOK — updateToken
// ============================================================================
function registerMovementHooks() {

  Hooks.on("updateToken", async (doc, change, options, userId) => {

    // Only react to position changes
    if (!("x" in change) && !("y" in change)) return;

    // Respect combat suppression (spec)
    if (canvas.combat?.started) return;

    const token = canvas.tokens.get(doc.id);
    if (!token) return;

    const tiles = canvas.tiles.placeables;

    for (const tile of tiles) {
      const flags = tile.document.getFlag(ADS.FLAGS);
      if (!flags) continue; // not a detection tile

      // Cooldown protection
      if (tileOnCooldown(tile.id)) continue;

      // Determine if triggered
      const trigger = flags.triggerMode || "overlap";
      let fired = false;

      if (trigger === "overlap") {
        fired = tokenOverlapsTile(token, tile);
      } else {
        fired = tokenInProximity(token, tile, flags.radius ?? 10);
      }

      if (fired) {
        setTileCooldown(tile.id);
        await runTileDetection(tile, token, { manual: false });
      }
    }
  });
}


// ============================================================================
// MAIN DETECTION ENTRY
// tile: Tile object
// token: Token object (null if manual override)
// options.manual: GM override
// ============================================================================
export async function runTileDetection(tile, token, options = {}) {

  const flags = tile.document.getFlag(ADS.FLAGS) || {};
  adsDebug("Run detection:", { tile: tile.id, flags });

  // Acquire valid tokens
  const includeNPCs = flags.includeNPCs ?? false;
  const tokens = getValidSceneTokens(includeNPCs);

  // Choose token source
  let sourceToken = token;

  // Manual override — treat as “group trigger”
  if (options.manual) {
    sourceToken = null;
  }

  // Determine player token to evaluate
  let actorToken = null;

  // Scout logic
  if (flags.scoutMode) {
    actorToken = resolveScout(tokens, flags.primarySkill);
  }

  // Highest modifier logic
  else if (flags.useHighest) {
    actorToken = getHighestModToken(tokens, flags.primarySkill);
  }

  // Default: token that triggered
  else {
    actorToken = sourceToken;
  }

  if (!actorToken) {
    ui.notifications.warn("ADS: No valid token found for detection.");
    return;
  }

  const actor = actorToken.actor;

  // ========================================================================
  // ROLL ACQUISITION
  // ========================================================================

  let rollPrimary = null;
  let rollSecondary = null;
  let finalPct = 0;
  let finalSkill = flags.primarySkill;

  // Pre-roll mode
  if (flags.rollMode === "preroll") {
    rollPrimary = consumePreroll(actorToken.document._id);

    if (rollPrimary === null) {
      ui.notifications.warn(`ADS: No pre-rolls remaining for ${actor.name}.`);
      return;
    }
  }

  // Auto roll mode
  else {
    rollPrimary = await performSkillRoll(actor, flags.primarySkill);
  }

  // Secondary skill logic (take better %)
  if (flags.secondarySkill && flags.secondarySkill !== "none") {
    rollSecondary = await performSkillRoll(actor, flags.secondarySkill);

    const pctPrimary = percentOfDC(rollPrimary, flags.dc);
    const pctSecondary = percentOfDC(rollSecondary, flags.dc);

    if (pctSecondary > pctPrimary) {
      finalPct = pctSecondary;
      finalSkill = flags.secondarySkill;
    } else {
      finalPct = pctPrimary;
      finalSkill = flags.primarySkill;
    }

  } else {
    finalPct = percentOfDC(rollPrimary, flags.dc);
  }

  // ========================================================================
  // TIER CALCULATIONS
  // ========================================================================
  const tier = determineTier(finalPct);

  adsDebug("Detection Result:", {
    skill: finalSkill,
    pct: finalPct,
    tier,
    rollPrimary,
    rollSecondary
  });

  // ========================================================================
  // OUTPUT POPUPS
  // ========================================================================
  showGMPopup(tile, finalSkill, finalPct, tier, flags);

  if (tier === 4) {
    showPlayerPopup(tile, flags);
  }

  // ========================================================================
  // REVEAL PROCESS
  // ========================================================================
  await ADSRevealSystem.reveal(tile, flags, tier);
}


// ============================================================================
// ROLL A SKILL
// ============================================================================
async function performSkillRoll(actor, skillId) {
  const skill = actor.system?.skills?.[skillId];
  if (!skill) return 0;

  const mod = skill.total;
  const roll = await (new Roll(`${mod}`)).roll({ async: true });
  return roll.total;
}


// ============================================================================
// DETERMINE TIER FROM PERCENT
// ============================================================================
function determineTier(pct) {
  if (pct >= 100) return 4;
  if (pct >= 75) return 3;
  if (pct >= 50) return 2;
  if (pct >= 25) return 1;
  return 0;
}


// ============================================================================
// GM POPUP
// ============================================================================
function showGMPopup(tile, skillId, pct, tier, flags) {

  const tileName = tile.document.name;
  const dc = flags.dc;

  const tierHeaders = {
    4: "FOUND!",
    3: "CLUE: High",
    2: "CLUE: Medium",
    1: "CLUE: Low",
    0: "FAILED"
  };

  const clueKey = `clue${tier}`;
  const clueText = flags[clueKey] || "";

  ui.notifications.info(
    `ADS | ${tileName}\n` +
    `${tierHeaders[tier]}\n` +
    `${skillId.toUpperCase()} — ${pct.toFixed(0)}% of DC ${dc}\n` +
    `${clueText}`
  );
}


// ============================================================================
// PLAYER POPUP — Tier 4 Only
// ============================================================================
function showPlayerPopup(tile, flags) {

  const clueText = flags.clue4 || "Something has been revealed.";
  const tileName = tile.document.name;

  const html = `
    <div class="ads-player-popup">
      <strong>Detected!</strong><br>
      ${tileName}<br>
      ${clueText}
    </div>
  `;

  ChatMessage.create({
    content: html,
    whisper: game.users.players.map(u => u.id)
  });
}

// ============================================================================
// Passive Detection System (ADS)
// Utility Library — Math, Token Filters, Cooldowns, Helpers
// ============================================================================

import { ADS, adsDebug } from "./ads.js";

// ============================================================================
// COOL DOWN TRACKER (Prevents spam / double firing)
// ============================================================================

const tileCooldownMap = new Map();   // tileId -> timestamp in ms
const COOLDOWN_MS = 500;

// Prevent spam on rapid movement updates
export function tileOnCooldown(tileId) {
  const now = Date.now();
  const until = tileCooldownMap.get(tileId) || 0;
  return now < until;
}

export function setTileCooldown(tileId) {
  tileCooldownMap.set(tileId, Date.now() + COOLDOWN_MS);
}

// ============================================================================
// BASIC DELAY / PAUSE
// ============================================================================
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

// Grid distance (in feet)
export function gridDistance(token, tile) {
  const t = token.center;
  const c = tile.center;
  const dx = t.x - c.x;
  const dy = t.y - c.y;
  const distPixels = Math.hypot(dx, dy);

  const pxPerGrid = canvas.dimensions.size;
  const ftPerGrid = canvas.dimensions.distance;

  return (distPixels / pxPerGrid) * ftPerGrid;
}

// Convert feet → pixels
export function feetToPixels(ft) {
  const pxPerGrid = canvas.dimensions.size;
  const ftPerGrid = canvas.dimensions.distance;
  return (ft / ftPerGrid) * pxPerGrid;
}

// Percent of DC calculation
export function percentOfDC(roll, dc) {
  if (dc <= 0) return 0;
  return (roll / dc) * 100;
}

// ============================================================================
// TOKEN VALIDATION & FILTERING
// ============================================================================

// Determine if a token is a valid participant per spec
export function isValidToken(token) {
  const actor = token.actor;
  if (!actor) return false;

  // Ignore tokens without owners (unless NPC mode enabled separately)
  if (!actor.hasPlayerOwner) return false;

  // Ignore unconscious/dead/incapacitated
  const effects = actor.effects.map(e => e.statuses).flat();
  if (effects.includes("dead")) return false;
  if (effects.includes("unconscious")) return false;
  if (effects.includes("incapacitated")) return false;

  return true;
}

// Collect all valid tokens on scene (player-owned only)
export function getValidSceneTokens(includeNPCs = false) {
  return canvas.tokens.placeables.filter(t => {
    if (includeNPCs) return true;
    return isValidToken(t);
  });
}

// ============================================================================
// SCOUT & MODIFIER RESOLUTION
// ============================================================================

// Get skill modifier for actor
export function getSkillMod(actor, skillId) {
  return actor?.system?.skills?.[skillId]?.total ?? null;
}

// Choose token with best modifier
export function getHighestModToken(tokens, skillId) {
  let best = null;
  let bestVal = -999;
  for (const t of tokens) {
    const mod = getSkillMod(t.actor, skillId);
    if (mod !== null && mod > bestVal) {
      bestVal = mod;
      best = t;
    }
  }
  return best;
}

// Scout mode: choose the best-skill token
export function resolveScout(tokens, skillId) {
  return getHighestModToken(tokens, skillId);
}

// ============================================================================
// TRIGGER GEOMETRY — OVERLAP & PROXIMITY
// ============================================================================

// Overlap check uses **token center** only (per spec)
export function tokenOverlapsTile(token, tile) {
  const center = token.center;
  const b = tile.bounds;

  return (
    center.x >= b.x &&
    center.x <= b.x + b.width &&
    center.y >= b.y &&
    center.y <= b.y + b.height
  );
}

// Proximity radius + elevation-safe check
export function tokenInProximity(token, tile, radiusFt) {
  const horizFt = gridDistance(token, tile);
  if (horizFt > radiusFt) return false;

  // Elevation difference ≤ 5 ft per spec
  const dz = Math.abs(token.document.elevation - tile.document.elevation);
  return dz <= 5;
}

// ============================================================================
// TILE FLAG ACCESS HELPERS
// ============================================================================
export function getTileFlags(tile) {
  return tile.document.getFlag(ADS.FLAGS) || {};
}

export function mergeTileFlags(tile, newData) {
  const existing = getTileFlags(tile);
  const merged = foundry.utils.mergeObject(existing, newData, { inplace: false });
  return tile.document.setFlag(ADS.FLAGS, merged);
}

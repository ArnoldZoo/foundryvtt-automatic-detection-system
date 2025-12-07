// ============================================================================
// Passive Detection System (ADS)
// GM HUD Override Button — Manual Trigger
// ============================================================================

import { ADS, adsDebug } from "./ads.js";
import { initializeADSEngine, runTileDetection } from "./ads-engine.js";

// ============================================================================
// REGISTER TILE HUD BUTTON
// ============================================================================
export function registerADSHud() {

  Hooks.on("renderTileHUD", (hud, html, tile) => {
    if (!game.user.isGM) return; // GM-only

    const btn = $(`
      <div class="control-icon ads-hud-trigger" title="Trigger Detection">
        <i class="fas fa-bolt"></i>
      </div>
    `);

    // Inject into HUD
    html.find(".col.right").append(btn);

    // Manual trigger handler
    btn.on("click", async () => {
      adsDebug("HUD override trigger for tile:", tile.id);

      // Force detection (no movement needed)
      await runTileDetection(tile, null, { manual: true });
    });
  });
}

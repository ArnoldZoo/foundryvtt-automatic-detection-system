// ============================================================================
// Passive Detection System (ADS)
// Reveal Engine — Tagger Scan, Animation, Secret Door Conversion
// ============================================================================

import { ADS, adsDebug } from "./ads.js";
import { wait } from "./ads-util.js";

// ============================================================================
// MAIN REVEAL FUNCTION
// ============================================================================
export const ADSRevealSystem = {

  async reveal(tile, flags, tier) {

    // Only Tier 4 reveals anything
    if (tier !== 4) {
      adsDebug("Reveal skipped — tier not 4");
      return;
    }

    const tag = flags.revealTag;
    if (!tag || tag.trim() === "") {
      adsDebug("Reveal skipped — no revealTag set");
      return;
    }

    adsDebug("Reveal initiated for tag:", tag);

    // Respect delay
    const delay = Number(flags.revealDelay) || 0;
    if (delay > 0) {
      adsDebug(`Applying reveal delay: ${delay}s`);
      await wait(delay * 1000);
    }

    // Pull all tagged objects in the current scene
    const sceneId = canvas.scene.id;

    const tiles = canvas.tiles.placeables.filter(t => t.document.getFlag("tagger", "tags")?.includes(tag));
    const walls = canvas.walls.placeables.filter(w => w.document.getFlag("tagger", "tags")?.includes(tag));
    const notes = canvas.notes.placeables.filter(n => n.document.getFlag("tagger", "tags")?.includes(tag));
    const drawings = canvas.drawings.placeables.filter(d => d.document.getFlag("tagger", "tags")?.includes(tag));
    const lights = canvas.lighting.placeables.filter(l => l.document.getFlag("tagger", "tags")?.includes(tag));
    const sounds = canvas.sounds?.placeables.filter(s => s.document.getFlag("tagger", "tags")?.includes(tag)) || [];

    adsDebug("Reveal scan results:", { tiles, walls, notes, drawings, lights, sounds });

    // Convert secret doors if enabled
    if (flags.autoDoor) {
      for (const w of walls) {
        if (w.document.door === 2) {
          adsDebug("Converting secret door → normal door:", w.id);
          await w.document.update({ door: 1, ds: 0 });
        }
      }
    }

    // Reveal ALL tag-matched objects
    await this._revealObjects([...tiles, ...notes, ...drawings, ...lights, ...sounds]);

    // Apply pulse glow animation
    this._animateReveal([...tiles, ...notes, ...drawings, ...lights, ...sounds]);

    // Override Fog-of-War for these objects
    if (flags.overrideFog) {
      this._overrideFog([...tiles, ...notes, ...drawings, ...lights, ...sounds]);
    }

    adsDebug("Reveal complete");
  },

  // ========================================================================
  // Reveal Objects (Visibility Update)
  // ========================================================================
  async _revealObjects(objects) {
    for (const obj of objects) {
      if (obj.document.hidden) {
        await obj.document.update({ hidden: false });
      }
    }
  },

  // ========================================================================
  // Fog-of-War Override
  // ========================================================================
  _overrideFog(objects) {
    for (const obj of objects) {
      // Just making visible is often enough; FOW respects visibility
      // Optional hook: could force light or tint here
      adsDebug("Fog override applied to:", obj.id);
    }
  },

  // ========================================================================
  // Reveal Animation — Pulse Glow
  // ========================================================================
  _animateReveal(objects) {
    for (const obj of objects) {
      const html = obj.object?.layer?.preview || obj.object?.layer?._draw();
      if (!html) continue;

      // Pulse via CSS filter
      const sprite = obj.object?.sprite;
      if (!sprite) continue;

      sprite.filters = [
        new PIXI.filters.GlowFilter({
          distance: 10,
          outerStrength: 2,
          innerStrength: 0,
          color: 0xffffff,
          quality: 0.2
        })
      ];

      setTimeout(() => {
        sprite.filters = [];
      }, 400);
    }
  }
};

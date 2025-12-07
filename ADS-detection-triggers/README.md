# Passive Detection System (ADS)

Automated passive detection for Foundry VTT.  
Reveal traps, secret doors, hidden panels, magic residue, creature traces, and other hidden features **automatically** when tokens move near them.

---

## ➤ Features

### Tile-Based Trigger System
- Overlap or proximity radius
- Scout mode (best skill)
- Highest-modifier mode
- Pre-roll consumption (FIFO)
- Delay before reveal
- NPC inclusion toggle
- Once-per-token cooldown protection

### Tier System (Based on % of DC)
- Tier 4 — **Detected!** (Reveal + Player popup)
- Tier 3 — High Clue
- Tier 2 — Medium Clue
- Tier 1 — Low Clue
- Tier 0 — No Clue

### Reveal Integration
Uses **Tagger** to link triggers to:
- Tiles
- Walls
- Notes
- Drawings
- Lights
- Ambient Sounds

Tier 4 automatically reveals all linked objects.

### UI & Popups
- New **Passive Detection** tab in Tile Config
- Collapsible sections
- Tier text fields
- Player popup for Tier 4
- GM-only HUD override button
- Debug mode

---

## ➤ Installation

Place this folder in:


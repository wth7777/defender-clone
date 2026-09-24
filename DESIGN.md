# Green Lantern: Ultima Odyssey

## Overview
A top-down 2D open-world RPG combining the open-world exploration and meaningful choices of Ultima with the Green Lantern Corps' willpower-based power ring, emotional spectrum, and intergalactic duty. Players assume the role of a rookie Green Lantern tasked with restoring balance to a sector of space threatened by the emotional spectrum's imbalance.

## Core Pillars
1. **Exploration**: Seamless open-world with diverse planets, space stations, and alien landscapes.
2. **Choice & Consequence**: Dialogue choices and actions affect reputation, story outcomes, and the emotional spectrum balance.
3. **Willpower Mechanics**: The Green Lantern ring's power is fueled by willpower, managed as a resource that regenerates slowly and can be boosted by overcoming fears.
4. **Emotional Spectrum**: Encounter embodiments of different emotions (Rage, Fear, Hope, etc.) that affect gameplay and story.
5. **Corps Duty**: Uphold the Green Lantern oath, complete missions for the Guardians, and make judgments that affect your standing.

## World Map & Major Locations
- **Oa**: Headquarters of the Green Lantern Corps. Contains the Central Power Battery, Guardian's Chamber, and Hall of Great Service.
- **Sector 2814 (Earth)**: A protected world with various regions (coastal city, desert, jungle, arctic) each with unique challenges and emotional imbalances.
- **Qward**: Antimatter universe, home of the Sinestro Corps and weapon developers.
- **Zamaron**: Homeworld of the Star Sapphires, a planet of crystal cities and violet light.
- **Ysmault**: Red Lantern homeworld, a hostile planet of blood and rage.
- **Okaara**: Orange Lantern homeworld, a planet of greed and vast deserts.
- **Maltus**: Ancient homeworld of the Guardians, now a forbidden planet with ancient secrets.
- **The Bleed**: Interdimensional space that allows travel between universes, filled with exotic phenomena.

## Core Loop
1. **Explore**: Travel the sector map, discover locations, scan for anomalies, and encounter random events.
2. **Investigate**: At locations, interact with NPCs, examine objects, and uncover clues or threats.
3. **Resolve**: Use the ring to construct objects, engage in combat, or use dialogue choices to resolve situations.
4. **Report**: Return to Oa or use the ring to communicate with the Guardians for mission updates, power upgrades, and story progression.
5. **Upgrade**: Earn experience and willpower to unlock new ring constructs and abilities.

## Story Outline (Act 1)
- **Prologue**: The player recruits on Oa, receives their power ring, and is briefed on a disturbance in Sector 2814.
- **Arrival on Earth**: Investigate strange phenomena (constructs appearing from fear, hope, etc.) causing panic.
- **Emotional Spectrum Imbalance**: Discover that the emotional spectrum is out of balance, with certain emotions manifesting as destructive energy.
- **First Confrontation**: Face a minor threat (e.g., a Fear-induced construct) and learn to use the ring to combat emotional manifestations.
- **Call to Oa**: Report findings, receive commendation, and be tasked with restoring balance to the emotional spectrum across the sector.
- **Exploration Begins**: Player is free to explore the sector, starting with Earth and nearby planets, to locate and correct emotional imbalances.

## Gameplay Systems

### Movement
- **Overworld**: Tap-to-move on the sector map (point and click). On planets, use virtual joystick (bottom left) for 8-directional movement.
- **Spaceship**: Travel between planets via a starmap (tap to select destination, then confirm jump).

### Conversation
- Dialogue trees with portrait avatars. Choices affect:
  - Reputation with factions (e.g., Sinestro Corps, Star Sapphires)
  - Emotional spectrum alignment (temporarily boosts or drains willpower based on emotion)
  - Quest outcomes and available constructs.

### Inventory
- Limited slots for:
  - Power Batteries (temporary willpower boosts)
  - Emotional Artifacts (items attuned to specific emotions, granting special abilities)
  - Quest Items
  - Cosmic Map Fragments (unlock new areas of the sector map)
- Access via pause menu (tap top-right icon).

### Combat
- **Real-time with pause** (tap to pause, issue commands, then resume).
- **Ring Constructs**: Player taps a construct button (e.g., Shield, Sword, Grenade, Cage) and then taps on the target location to create it.
- **Willpower Cost**: Each construct costs willpower. If willpower reaches zero, the ring fades and the player is vulnerable until it regenerates (slowly over time or by finding a Power Battery).
- **Enemy Types**: Emotional manifestations (e.g., Fear Parasites, Rage Berserkers, Hope Sirens) each with weaknesses to certain emotions or construct types.

## Mobile UI Considerations
- **Touch-First**: All interactions designed for tap and drag. No reliance on precise cursor or keyboard.
- **Clear Visual Feedback**: Buttons highlight on press, constructs show a preview before placement, willpower bar is prominent.
- **Minimal HUD**: Only essential information shown (willpower, health, equipped construct). Other menus accessed via icons.
- **Screen Layout**:
  - Top Left: Mini-map (tap to expand to sector map)
  - Top Right: Menu icon (inventory, journal, options)
  - Bottom Left: Virtual joystick (for on-foot movement)
  - Bottom Right: Action buttons (constructs, attack, interact)
  - Center: Game world

## Green Lantern-Themed Content
- **Oath**: Recitable at Power Batteries for a temporary willpower boost and alignment reset.
- **Ring Constructs**: Based on classic Green Lantern abilities (fist, shield, sword, grenade, cage, etc.) and emotional spectrum variants (e.g., Fear constructs cause terror, Hope constructs inspire allies).
- **Emotional Spectrum**: Locations and events tied to each color (Red, Orange, Yellow, Green, Blue, Indigo, Violet). Player's actions and choices affect the local emotional balance.
- **Corps Hierarchy**: Interact with iconic Lanterns (Hal Jordan, John Stewart, Guy Gardner, Kilowog, etc.) and Guardians.
- **Power Battery**: Scattered across worlds; interacting fully recharges willpower and grants a temporary shield.

## Technical Approach (Prototype)
- **Engine**: Custom HTML5 Canvas game with vanilla JavaScript.
- **Assets**: Use placeholder graphics (colored shapes) for prototype, focusing on mechanics.
- **Scalability**: Design systems to be data-driven for easy expansion of content.

## Phase 1 Goals
- [ ] Design document completed (this file)
- [ ] Project structure set up
- [ ] Basic game loop with canvas rendering
- [ ] Sector map with travel between planets (simple tap-to-move on starmap)
- [ ] Player sprite that can move on a planet tilemap with touch joystick
- [ ] Basic UI frame (health, willpower, mini-map placeholder)
- [ ] Placeholder for interaction (tap on NPC to show dialogue box)

## Next Steps (Phase 2)
- Implement dialogue system with choices
- Add willpower resource and construct system
- Create first planet (Earth) with a few NPCs and a simple quest
- Integrate emotional spectrum effects
- Polish mobile UI and touch controls
- Prepare for deployment to GitHub Pages

Let's begin by setting up the project.
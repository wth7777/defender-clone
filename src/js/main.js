// ============================================================================
// Green Lantern: Ultima Odyssey - Main Game File
// ============================================================================

'use strict';

// Configuration
const CONFIG = {
    // Display
    LOGICAL_WIDTH: 320,
    LOGICAL_HEIGHT: 240,
    SCALE: window.devicePixelRatio || 1,
    // Game states
    STATE: {
        BOOT: 0,
        SECTOR_MAP: 1,
        PLANET_SURFACE: 2,
        DIALOGUE: 3,
        COMBAT: 4,
        MENU: 5
    },
    // Willpower regen per second (points per second)
    WILLPOWER_REGEN: 5,
    // Tile size for planet surface
    TILE_SIZE: 16,
    // Construct definitions
    CONSTRUCTS: [
        { name: 'Fist', cost: 5, damage: 10, description: 'A simple energy fist.' },
        { name: 'Shield', cost: 10, damage: 0, description: 'Protectorial barrier. Reduces incoming damage.' }, // We'll implement effect later
        { name: 'Sword', cost: 15, damage: 20, description: 'Energy blade.' },
        { name: 'Grenade', cost: 20, damage: 30, description: 'Explosive projectile.' },
        { name: 'Cage', cost: 25, damage: 0, description: 'Traps the enemy. Prevents action for one turn.' } // We'll implement effect later
    ]
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.LOGICAL_WIDTH * CONFIG.SCALE;
canvas.height = CONFIG.LOGICAL_HEIGHT * CONFIG.SCALE;
ctx.imageSmoothingEnabled = false; // For pixel art look

// Game state
let gameState = {
    currentState: CONFIG.STATE.BOOT,
    sectorMap: null,
    planetSurface: null,
    dialogue: null,
    combat: null,
    player: null,
    ui: null,
    input: null,
    lastTime: 0
};

// ============================================================================
// SECTOR MAP
// ============================================================================
class SectorMap {
    constructor() {
        this.planets = [
            { name: 'Oa', x: 100, y: 80, color: '#00ffff' },
            { name: 'Earth', x: 200, y: 120, color: '#00ff00' },
            { name: 'Qward', x: 50, y: 180, color: '#ff00ff' },
            { name: 'Zamaron', x: 250, y: 50, color: '#ff00ff' }
        ];
        this.selected = 0;
    }
    
    update() {
        // No continuous update needed; input handled via touch
    }
    
    render() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);
        
        // Draw planet names
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        this.planets.forEach((p, i) => {
            ctx.fillText(p.name, p.x, p.y);
            if (i === this.selected) {
                ctx.strokeStyle = p.color;
                ctx.strokeRect(p.x - 4, p.y - 16, ctx.measureText(p.name).width + 8, 20);
            }
        });
        
        // Draw title
        ctx.fillStyle = '#0ff';
        ctx.textAlign = 'center';
        ctx.fillText('GREEN LANTERN: SECTOR MAP', CONFIG.LOGICAL_WIDTH / 2, 20);
        ctx.textAlign = 'left';
    }
    
    // Handle touch for planet selection
    handleTouch(touchX, touchY) {
        this.planets.forEach((p, i) => {
            const dist = Math.hypot(touchX - p.x, touchY - p.y);
            if (dist < 20) {
                this.selected = i;
                return p; // return selected planet
            }
        });
        return null;
    }
}

// ============================================================================
// PLAYER
// ============================================================================
class Player {
    constructor() {
        this.x = CONFIG.LOGICAL_WIDTH / 2;
        this.y = CONFIG.LOGICAL_HEIGHT / 2;
        this.maxWillpower = 100;
        this.willpower = this.maxWillpower;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.direction = 0; // 0: up, 1: right, 2: down, 3: left
        this.moving = false;
        // Inventory placeholder
        this.inventory = [];
        // Equipped construct index (for quick select)
        this.equippedConstruct = 0; // index into CONFIG.CONSTRUCTS
    }
    
    update(deltaTime) {
        // Willpower regen
        if (this.willpower < this.maxWillpower) {
            this.willpower = Math.min(this.maxWillpower, this.willpower + CONFIG.WILLPOWER_REGEN * (deltaTime / 1000));
        }
        
        // Movement handled via input system
    }
    
    render() {
        // Draw player as a green circle
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw direction indicator (a line)
        const len = 6;
        let dx = 0, dy = 0;
        switch (this.direction) {
            case 0: dy = -len; break; // up
            case 1: dx = len; break;  // right
            case 2: dy = len; break;  // down
            case 3: dx = -len; break; // left
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + dx, this.y + dy);
        ctx.stroke();
    }
    
    // Simple movement attempt (to be called by input)
    tryMove(dx, dy, collisionCallback) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (!collisionCallback || !collisionCallback(newX, newY)) {
            this.x = newX;
            this.y = newY;
            // Update direction based on movement
            if (dx < 0) this.direction = 3;
            else if (dx > 0) this.direction = 1;
            else if (dy < 0) this.direction = 0;
            else if (dy > 0) this.direction = 2;
            return true;
        }
        return false;
    }
    
    // Check if player has enough willpower for a construct
    canUseConstruct(constructIndex) {
        const construct = CONFIG.CONSTRUCTS[constructIndex];
        return this.willpower >= construct.cost;
    }
    
    // Use a construct, deduct willpower
    useConstruct(constructIndex) {
        const construct = CONFIG.CONSTRUCTS[constructIndex];
        if (this.willpower >= construct.cost) {
            this.willpower -= construct.cost;
            return construct;
        }
        return null;
    }
}

// ============================================================================
// PLANET SURFACE
// ============================================================================
class PlanetSurface {
    constructor(planetName) {
        this.name = planetName;
        // For simplicity, we'll use a small fixed map: 20x15 tiles
        this.width = 20;
        this.height = 15;
        this.tiles = []; // 0: grass, 1: water, 2: wall, etc.
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Simple pattern: grass with some water
                if (x < 5 || x >= this.width - 5 || y < 3 || y >= this.height - 3) {
                    this.tiles[y][x] = 0; // grass
                } else {
                    this.tiles[y][x] = 1; // water
                }
            }
        }
        // Place some NPCs
        this.npcs = [
            new NPC(this.width * CONFIG.TILE_SIZE / 2, this.height * CONFIG.TILE_SIZE / 2 - 30, 
                    ["Greetings, Lantern.", "The sector is in turmoil. Fear spreads in the north.", 
                     "Will you help restore balance?"],
                    [{ text: "Yes, I will help.", action: () => { console.log("Quest accepted"); } },
                     { text: "Not now.", action: () => { console.log("Quest declined"); } }]),
            new NPC(this.width * CONFIG.TILE_SIZE / 2 + 50, this.height * CONFIG.TILE_SIZE / 2 + 20, 
                    ["I am a scientist from Oa.", "Power fluctuations detected near the crystal spires.", 
                     "Be cautious."],
                    [{ text: "Thank you for the warning.", action: () => {} }])
        ];
        // Place some enemies (Fear Parasites) - more in the north (higher y? actually north is up, so lower y)
        // We'll place a few enemies at specific locations for now
        this.enemies = [
            new FearParasite(this.width * CONFIG.TILE_SIZE / 2 - 40, this.height * CONFIG.TILE_SIZE / 2 - 50),
            new FearParasite(this.width * CONFIG.TILE_SIZE / 2 + 60, this.height * CONFIG.TILE_SIZE / 2 + 30)
        ];
    }
    
    update(deltaTime) {
        // Update NPCs if needed
        this.npcs.forEach(npc => npc.update(deltaTime));
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime));
    }
    
    render() {
        // Draw tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileType = this.tiles[y][x];
                let color = '#006400'; // default grass dark green
                if (tileType === 1) color = '#00008b'; // water dark blue
                ctx.fillStyle = color;
                ctx.fillRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, 
                             CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            }
        }
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.render());
        
        // Draw NPCs
        this.npcs.forEach(npc => npc.render());
    }
    
    // Check if position is walkable (not water)
    isWalkable(x, y) {
        const tileX = Math.floor(x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(y / CONFIG.TILE_SIZE);
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return false;
        }
        return this.tiles[tileY][tileX] === 0; // 0 is grass (walkable)
    }
    
    // Handle touch for movement and interaction
    handleTouch(touchX, touchY, player) {
        // Convert touch coordinates to game coordinates (already in logical coords)
        const targetX = touchX;
        const targetY = touchY;
        
        // Check if tapping near an enemy to start combat
        for (const enemy of this.enemies) {
            if (!enemy.isDefeated()) {
                const dist = Math.hypot(targetX - enemy.x, targetY - enemy.y);
                if (dist < 20) { // interaction radius
                    // Start combat with this enemy
                    return { action: 'startCombat', enemy: enemy };
                }
            }
        }
        
        // Check if tapping near an NPC to start dialogue
        for (const npc of this.npcs) {
            const dist = Math.hypot(targetX - npc.x, targetY - npc.y);
            if (dist < 20) { // interaction radius
                // Start dialogue with this NPC
                return { action: 'startDialogue', npc: npc };
            }
        }
        
        // Otherwise, attempt to move player towards touch point
        // We'll move in steps; for simplicity, we'll just try to move one step towards touch
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            const step = 2; // pixels per touch (adjust as needed)
            const moveX = (dx / dist) * step;
            const moveY = (dy / dist) * step;
            player.tryMove(moveX, moveY, (nx, ny) => !this.isWalkable(nx, ny));
            // Update direction based on movement
            if (moveX < 0) player.direction = 3;
            else if (moveX > 0) player.direction = 1;
            else if (moveY < 0) player.direction = 0;
            else if (moveY > 0) player.direction = 2;
        }
        return null; // no dialogue or combat started
    }
}

// ============================================================================
// NPC
// ============================================================================
class NPC {
    constructor(x, y, lines, options = []) {
        this.x = x;
        this.y = y;
        this.lines = lines; // array of strings for dialogue
        this.options = options; // array of {text, action}
        this.currentLine = 0;
        this.showingOptions = false;
    }
    
    update(deltaTime) {
        // Nothing for now
    }
    
    render() {
        // Draw NPC as a blue circle
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Optionally, draw an exclamation mark if has dialogue
        ctx.fillStyle = '#ff0';
        ctx.font = '12px monospace';
        ctx.fillText('!', this.x - 4, this.y - 8);
    }
    
    // Get current dialogue line
    getCurrentLine() {
        return this.lines[this.currentLine];
    }
    
    // Advance dialogue
    advance() {
        if (this.showingOptions) {
            // If options are showing, advancing should select an option? We'll handle via input.
            return;
        }
        this.currentLine++;
        if (this.currentLine >= this.lines.length) {
            this.currentLine = 0;
            this.showingOptions = true; // show options after last line
        }
    }
    
    // Select an option by index
    selectOption(index) {
        if (index >= 0 && index < this.options.length) {
            const action = this.options[index].action;
            if (action) action();
        }
        this.showingOptions = false;
        this.currentLine = 0;
    }
}

// ============================================================================
// DIALOGUE SYSTEM
// ============================================================================
class Dialogue {
    constructor(npc) {
        this.npc = npc;
        this.active = false;
        this.selectedOption = 0;
    }
    
    start(npc) {
        this.npc = npc;
        this.active = true;
        this.selectedOption = 0;
        this.npc.currentLine = 0;
        this.npc.showingOptions = false;
    }
    
    update() {
        // No continuous update
    }
    
    render() {
        if (!this.active) return;
        
        // Draw dialogue box
        const padding = 10;
        const boxWidth = CONFIG.LOGICAL_WIDTH - 2 * padding;
        const boxHeight = 80;
        const boxX = padding;
        const boxY = CONFIG.LOGICAL_HEIGHT - boxHeight - padding;
        
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw NPC portrait placeholder (left side)
        ctx.fillStyle = '#00f';
        ctx.fillRect(boxX + padding, boxY + padding, 32, 32);
        
        // Draw dialogue text
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        const textX = boxX + padding + 40;
        const textY = boxY + padding + 20;
        ctx.fillText(this.npc.getCurrentLine(), textX, textY);
        
        // If showing options, draw them
        if (this.npc.showingOptions) {
            const optionStartY = textY + 20;
            this.npc.options.forEach((opt, i) => {
                const y = optionStartY + i * 20;
                if (i === this.selectedOption) {
                    ctx.fillStyle = '#0f0'; // highlight selected
                } else {
                    ctx.fillStyle = '#fff';
                }
                ctx.fillText(opt.text, textX, y);
            });
        }
    }
    
    // Handle input for dialogue (called from main input handling)
    handleInput(action) {
        if (!this.active) return false;
        if (action === 'confirm') {
            if (this.npc.showingOptions) {
                // Select the highlighted option
                this.npc.selectOption(this.selectedOption);
                this.active = false;
                return true; // dialogue ended
            } else {
                // Advance to next line or show options
                this.npc.advance();
                return false; // dialogue continues
            }
        } else if (action === 'up') {
            if (this.npc.showingOptions) {
                this.selectedOption = (this.selectedOption - 1 + this.npc.options.length) % this.npc.options.length;
                return true;
            }
        } else if (action === 'down') {
            if (this.npc.showingOptions) {
                this.selectedOption = (this.selectedOption + 1) % this.npc.options.length;
                return true;
            }
        }
        return false;
    }
}

// ============================================================================
// ENEMY: Fear Parasite
// ============================================================================
class FearParasite {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 30;
        this.health = this.maxHealth;
        this.attackDamage = 5;
        this.attackCooldown = 0; // ticks until next attack
        this.attackCooldownMax = 60; // 1 second at 60 FPS
        this.isDefeatedFlag = false;
        this.direction = 0; // 0: up, 1: right, 2: down, 3: left (for visual)
        // Weakness: weak to Hope constructs (we'll implement later)
    }
    
    update(deltaTime) {
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= (deltaTime / 1000) * 60; // assume 60 FPS, convert ms to seconds then multiply by 60 to get ticks
            if (this.attackCooldown < 0) this.attackCooldown = 0;
        }
        // Simple AI: if player is close and cooldown is zero, attack
        // We'll need access to player; we'll handle this in combat state instead
        // For now, we'll just do nothing in update; combat state will manage turns
    }
    
    render() {
        // Draw enemy as a red circle (fear)
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw a minus sign to indicate enemy
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('-', this.x - 3, this.y + 3);
    }
    
    isDefeated() {
        return this.isDefeatedFlag || this.health <= 0;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isDefeatedFlag = true;
            this.health = 0;
        }
    }
    
    // For simplicity, we'll let combat state handle attacking the player
}

// ============================================================================
// COMBAT SYSTEM
// ============================================================================
class Combat {
    constructor(player, enemy) {
        this.player = player;
        this.enemy = enemy;
        this.state = 'playerTurn'; // or 'enemyTurn', 'victory', 'defeat'
        this.message = '';
        this.selectedConstructIndex = 0; // index into CONFIG.CONSTRUCTS
        this.constructNames = CONFIG.CONSTRUCTS.map(c => c.name);
    }
    
    update() {
        // No continuous update; we'll handle via input
    }
    
    render() {
        // Draw a semi-transparent background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);
        
        // Draw player and enemy avatars (placeholders)
        ctx.fillStyle = '#0f0';
        ctx.fillRect(50, CONFIG.LOGICAL_HEIGHT / 2 - 20, 40, 40); // player
        ctx.fillStyle = '#f00';
        ctx.fillRect(CONFIG.LOGICAL_WIDTH - 90, CONFIG.LOGICAL_HEIGHT / 2 - 20, 40, 40); // enemy
        
        // Draw health bars
        ctx.fillStyle = '#f00';
        ctx.fillRect(50, CONFIG.LOGICAL_HEIGHT / 2 + 25, 40 * (this.player.health / this.player.maxHealth), 5);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(CONFIG.LOGICAL_WIDTH - 90, CONFIG.LOGICAL_HEIGHT / 2 + 25, 40 * (this.enemy.health / this.enemy.maxHealth), 5);
        
        // Draw labels
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText('Player', 50, CONFIG.LOGICAL_HEIGHT / 2 - 30);
        ctx.fillText('Enemy', CONFIG.LOGICAL_WIDTH - 90, CONFIG.LOGICAL_HEIGHT / 2 - 30);
        
        // Draw message
        ctx.fillStyle = '#ff0';
        ctx.font = '16px monospace';
        ctx.fillText(this.message, CONFIG.LOGICAL_WIDTH / 2 - ctx.measureText(this.message).width / 2, 50);
        
        // If player's turn, show construct selection
        if (this.state === 'playerTurn') {
            ctx.fillStyle = '#fff';
            ctx.font = '14px monospace';
            ctx.fillText('Select Construct:', 20, CONFIG.LOGICAL_HEIGHT - 80);
            this.constructNames.forEach((name, i) => {
                const construct = CONFIG.CONSTRUCTS[i];
                const canUse = this.player.canUseConstruct(i);
                if (i === this.selectedConstructIndex) {
                    ctx.fillStyle = '#0f0'; // highlight selected
                } else if (!canUse) {
                    ctx.fillStyle = '#666'; // dim if not enough willpower
                } else {
                    ctx.fillStyle = '#fff';
                }
                ctx.fillText(`${name} (${construct.cost} WP)`, 20, CONFIG.LOGICAL_HEIGHT - 60 + i * 20);
            });
            ctx.fillStyle = '#fff';
            ctx.fillText('WP: ' + Math.floor(this.player.willpower), 20, CONFIG.LOGICAL_HEIGHT - 20);
        }
    }
    
    // Handle input for combat
    handleInput(action) {
        if (this.state === 'playerTurn') {
            if (action === 'confirm') {
                // Use the selected construct
                const construct = this.player.useConstruct(this.selectedConstructIndex);
                if (construct) {
                    // Apply construct effect
                    this.message = `You used ${construct.name}!`;
                    if (construct.damage > 0) {
                        this.enemy.takeDamage(construct.damage);
                        this.message += ` It dealt ${construct.damage} damage.`;
                        if (this.enemy.isDefeated()) {
                            this.state = 'victory';
                            this.message = 'You have defeated the enemy!';
                            return true; // combat ended
                        }
                    } else {
                        // Implement effects for shield, cage, etc.
                        // For now, just a placeholder
                        this.message += ` (effect pending)`;
                    }
                    // After player action, enemy turns
                    this.state = 'enemyTurn';
                    // We'll process enemy turn after a short delay or immediately; we'll do it now for simplicity
                    setTimeout(() => this.enemyTurn(), 500); // delay to show player action
                    return false; // combat continues
                } else {
                    this.message = 'Not enough willpower!';
                    return false;
                }
            } else if (action === 'up') {
                this.selectedConstructIndex = (this.selectedConstructIndex - 1 + CONFIG.CONSTRUCTS.length) % CONFIG.CONSTRUCTS.length;
                return false;
            } else if (action === 'down') {
                this.selectedConstructIndex = (this.selectedConstructIndex + 1) % CONFIG.CONSTRUCTS.length;
                return false;
            }
        }
        // For other states, we just wait for the enemy turn to finish or for victory/defeat to be handled in the game loop
        return false;
    }
    
    enemyTurn() {
        if (this.enemy.isDefeated()) {
            this.state = 'victory';
            this.message = 'You have defeated the enemy!';
            return;
        }
        // Enemy attacks if cooldown is ready
        if (this.enemy.attackCooldown <= 0) {
            this.player.health -= this.enemy.attackDamage;
            this.enemy.attackCooldown = this.enemy.attackCooldownMax;
            this.message = `The Fear Parasite attacks you for ${this.enemy.attackDamage} damage!`;
            if (this.player.health <= 0) {
                this.state = 'defeat';
                this.message = 'You have been defeated...';
                return;
            }
        } else {
            this.message = 'The Fear Parasite prepares to attack...';
        }
        // After enemy turn, back to player
        this.state = 'playerTurn';
    }
}

// ============================================================================
// UI
// ============================================================================
class UI {
    render(player) {
        // Draw willpower and health bars
        const barWidth = 100;
        const barHeight = 8;
        const barX = 10;
        const barY = 10;
        
        // Willpower bar (blue)
        ctx.fillStyle = '#00f';
        ctx.fillRect(barX, barY, barWidth * (player.willpower / player.maxWillpower), barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health bar (red)
        ctx.fillStyle = '#f00';
        ctx.fillRect(barX, barY + barHeight + 4, barWidth * (player.health / player.maxHealth), barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(barX, barY + barHeight + 4, barWidth, barHeight);
        
        // Text labels
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`WP: ${Math.floor(player.willpower)}/${player.maxWillpower}`, barX + 2, barY + 10);
        ctx.fillText(`HP: ${player.health}/${player.maxHealth}`, barX + 2, barY + barHeight + 4 + 10);
        
        // Draw mini-map placeholder (top-left)
        const miniSize = 60;
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 40, miniSize, miniSize);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(10, 40, miniSize, miniSize);
        // Draw a dot for player position (simplified)
        ctx.fillStyle = '#0f0';
        ctx.fillRect(10 + miniSize/2 - 1, 40 + miniSize/2 - 1, 2, 2);
    }
}

// ============================================================================
// INPUT HANDLER (for touch and keyboard)
// ============================================================================
class InputHandler {
    constructor() {
        this.keys = {};
        this.keyJustPressed = {};
        this.keyPrev = {};
        this.touchStartPos = null;
        this.lastTapPos = null;
        this.tapHandled = false;
        this.setupListeners();
    }
    
    setupListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch for movement and interaction
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX / CONFIG.SCALE;
            const y = (touch.clientY - rect.top) * scaleY / CONFIG.SCALE;
            this.touchStartPos = { x, y };
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            // We'll treat touchend as a tap/click for interaction
            if (this.touchStartPos) {
                const touch = e.changedTouches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (touch.clientX - rect.left) * scaleX / CONFIG.SCALE;
                const y = (touch.clientY - rect.top) * scaleY / CONFIG.SCALE;
                this.lastTapPos = { x, y };
                this.tapHandled = false; // flag to prevent double handling
            }
            this.touchStartPos = null;
        }, { passive: false });
        
        // Prevent scrolling
        document.body.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
    }
    
    beginFrame() {
        // Reset just pressed states
        this.keyJustPressed = {};
        for (const code in this.keys) {
            if (this.keys[code] && !this.keyPrev[code]) {
                this.keyJustPressed[code] = true;
            }
        }
        this.keyPrev = { ...this.keys };
    }
    
    update(player, planetSurface, dialogue, combat, gameState) {
        this.beginFrame();
        
        // Handle dialogue input
        if (dialogue && dialogue.active) {
            if (this.isJustPressed('Enter') || this.isJustPressed('Space')) {
                return dialogue.handleInput('confirm');
            }
            if (this.isJustPressed('ArrowUp')) {
                return dialogue.handleInput('up');
            }
            if (this.isJustPressed('ArrowDown')) {
                return dialogue.handleInput('down');
            }
        }
        
        // Handle combat input
        if (combat && combat.active) {
            // We'll define an active property on combat; for now, we'll check if combat exists and state is playerTurn
            if (combat.state === 'playerTurn') {
                if (this.isJustPressed('Enter') || this.isJustPressed('Space')) {
                    return combat.handleInput('confirm');
                }
                if (this.isJustPressed('ArrowUp')) {
                    return combat.handleInput('up');
                }
                if (this.isJustPressed('ArrowDown')) {
                    return combat.handleInput('down');
                }
            }
        }
        
        // Handle tap for movement/interaction (if we have a last tap)
        if (this.lastTapPos && !this.tapHandled) {
            this.tapHandled = true;
            const result = planetSurface.handleTouch(this.lastTapPos.x, this.lastTapPos.y, player);
            if (result) {
                if (result.action === 'startDialogue') {
                    dialogue.start(result.npc);
                    gameState.dialogue = dialogue;
                    gameState.currentState = CONFIG.STATE.DIALOGUE;
                    return true; // dialogue started
                } else if (result.action === 'startCombat') {
                    combat = new Combat(player, result.enemy);
                    gameState.combat = combat;
                    gameState.currentState = CONFIG.STATE.COMBAT;
                    return true; // combat started
                }
            }
            // Otherwise, movement was handled in handleTouch
            return false;
        }
        
        // Keyboard movement (WASD or arrow keys) - optional for debugging
        let dx = 0, dy = 0;
        if (this.isDown('ArrowUp') || this.isDown('KeyW')) { dy = -2; }
        if (this.isDown('ArrowDown') || this.isDown('KeyS')) { dy = 2; }
        if (this.isDown('ArrowLeft') || this.isDown('KeyA')) { dx = -2; }
        if (this.isDown('ArrowRight') || this.isDown('KeyD')) { dx = 2; }
        if (dx !== 0 || dy !== 0) {
            player.tryMove(dx, dy, (nx, ny) => !planetSurface.isWalkable(nx, ny));
            // Update direction
            if (dx < 0) player.direction = 3;
            else if (dx > 0) player.direction = 1;
            else if (dy < 0) player.direction = 0;
            else if (dy > 0) player.direction = 2;
        }
        
        return false;
    }
    
    isDown(code) {
        return !!this.keys[code];
    }
    
    isJustPressed(code) {
        return !!this.keyJustPressed[code];
    }
}

// ============================================================================
// GAME INITIALIZATION AND LOOP
// ============================================================================
function init() {
    gameState.sectorMap = new SectorMap();
    gameState.player = new Player();
    gameState.ui = new UI();
    gameState.input = new InputHandler();
    gameState.dialogue = null;
    gameState.combat = null;
    gameState.currentState = CONFIG.STATE.SECTOR_MAP;
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    
    // Update
    switch (gameState.currentState) {
        case CONFIG.STATE.SECTOR_MAP:
            gameState.sectorMap.update();
            break;
        case CONFIG.STATE.PLANET_SURFACE:
            gameState.player.update(deltaTime);
            gameState.planetSurface.update(deltaTime);
            // Check if dialogue or combat should start from touch (handled in input)
            break;
        case CONFIG.STATE.DIALOGUE:
            // Dialogue updates itself via input
            break;
        case CONFIG.STATE.COMBAT:
            // Combat updates itself via input and enemy turn timing
            if (gameState.combat) {
                // If combat is over, we'll handle state transition below
                if (gameState.combat.state === 'victory' || gameState.combat.state === 'defeat') {
                    // Wait for a moment then return to planet surface
                    // We'll handle this in the state transition section
                }
            }
            break;
        // Add other states as needed
    }
    
    // Handle input and check for state transitions
    let inputResult = null;
    if (gameState.currentState === CONFIG.STATE.SECTOR_MAP) {
        // Handle touch for planet selection
        if (gameState.input.lastTapPos && !gameState.input.tapHandled) {
            gameState.input.tapHandled = true;
            const planet = gameState.sectorMap.handleTouch(gameState.input.lastTapPos.x, gameState.input.lastTapPos.y);
            if (planet) {
                // Transition to planet surface
                gameState.planetSurface = new PlanetSurface(planet.name);
                gameState.currentState = CONFIG.STATE.PLANET_SURFACE;
                // Reset dialogue and combat
                gameState.dialogue = null;
                gameState.combat = null;
            }
        }
    } else if (gameState.currentState === CONFIG.STATE.PLANET_SURFACE) {
        inputResult = gameState.input.update(gameState.player, gameState.planetSurface, gameState.dialogue, gameState.combat, gameState);
        // If inputResult indicates dialogue started, we need to set the dialogue object and state
        if (inputResult === true && gameState.dialogue === null) {
            // This means the input handler started a dialogue but we haven't set the dialogue yet.
            // Actually, in the input handler, when we get a 'startDialogue' result, we set gameState.dialogue and change state.
            // We'll trust that the input handler has already set the dialogue and state.
            // We'll do nothing here; the state should already be DIALOGUE.
        }
        // If inputResult indicates combat started, we need to set the combat object and state
        if (inputResult === true && gameState.combat === null) {
            // Similarly, the input handler should have set gameState.combat and state to COMBAT.
        }
        // If dialogue ended, return to planet surface
        if (gameState.dialogue && !gameState.dialogue.active) {
            gameState.dialogue = null;
            gameState.currentState = CONFIG.STATE.PLANET_SURFACE;
        }
        // If combat ended, return to planet surface
        if (gameState.combat && (gameState.combat.state === 'victory' || gameState.combat.state === 'defeat')) {
            // Wait a bit then return to planet surface; we'll do it after a short delay or on next frame
            // For simplicity, we'll return immediately
            gameState.combat = null;
            gameState.currentState = CONFIG.STATE.PLANET_SURFACE;
        }
    } else if (gameState.currentState === CONFIG.STATE.DIALOGUE) {
        // Handle dialogue input
        if (gameState.dialogue) {
            inputResult = gameState.input.update(gameState.player, gameState.planetSurface, gameState.dialogue, gameState.combat, gameState);
            if (inputResult === true && !gameState.dialogue.active) {
                gameState.dialogue = null;
                gameState.currentState = CONFIG.STATE.PLANET_SURFACE;
            }
        }
    } else if (gameState.currentState === CONFIG.STATE.COMBAT) {
        // Handle combat input
        if (gameState.combat) {
            inputResult = gameState.input.update(gameState.player, gameState.planetSurface, gameState.dialogue, gameState.combat, gameState);
            // The combat state updates itself via its own update? Actually, we handle input in the combat's handleInput method.
            // We'll rely on the input handler to have processed the input and updated the combat state.
            // Check if combat ended
            if (gameState.combat.state === 'victory' || gameState.combat.state === 'defeat') {
                // Return to planet surface
                gameState.combat = null;
                gameState.currentState = CONFIG.STATE.PLANET_SURFACE;
            }
        }
    }
    
    // Render
    ctx.clearRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);
    switch (gameState.currentState) {
        case CONFIG.STATE.SECTOR_MAP:
            gameState.sectorMap.render();
            break;
        case CONFIG.STATE.PLANET_SURFACE:
            // Draw planet surface
            gameState.planetSurface.render();
            gameState.player.render();
            break;
        case CONFIG.STATE.DIALOGUE:
            // Dialogue is rendered on top of planet surface
            if (gameState.planetSurface) {
                gameState.planetSurface.render();
                gameState.player.render();
            }
            if (gameState.dialogue) {
                gameState.dialogue.render();
            }
            break;
        case CONFIG.STATE.COMBAT:
            // Combat is rendered on top of planet surface (or we can draw a separate combat screen)
            if (gameState.planetSurface) {
                gameState.planetSurface.render();
                gameState.player.render();
            }
            if (gameState.combat) {
                gameState.combat.render();
            }
            break;
    }
    gameState.ui.render(gameState.player);
    
    requestAnimationFrame(gameLoop);
}

// Start the game
window.addEventListener('load', init);

// Expose for debugging
window.gameState = gameState;
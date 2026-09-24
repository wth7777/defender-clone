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
    TILE_SIZE: 16
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
    }
    
    update(deltaTime) {
        // Update NPCs if needed
        this.npcs.forEach(npc => npc.update(deltaTime));
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
        
        // Check if tapping near an NPC to start dialogue
        for (const npc of this.npcs) {
            const dist = Math.hypot(targetX - npc.x, targetY - npc.y);
            if (dist < 20) { // interaction radius
                // Return an object to start dialogue with this NPC
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
        return null; // no dialogue started
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
    
    update(player, planetSurface, dialogue, gameState) {
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
        
        // Handle tap for movement/interaction (if we have a last tap)
        if (this.lastTapPos && !this.tapHandled) {
            this.tapHandled = true;
            const result = planetSurface.handleTouch(this.lastTapPos.x, this.lastTapPos.y, player);
            if (result && result.action === 'startDialogue') {
                // Start a new dialogue with the NPC
                gameState.dialogue = new Dialogue(result.npc);
                gameState.dialogue.start(result.npc);
                gameState.currentState = CONFIG.STATE.DIALOGUE;
                return true; // dialogue started
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
            // Check if dialogue should start from touch (handled in input)
            break;
        case CONFIG.STATE.DIALOGUE:
            // Dialogue updates itself via input
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
                // Reset dialogue
                gameState.dialogue = null;
            }
        }
    } else if (gameState.currentState === CONFIG.STATE.PLANET_SURFACE) {
        inputResult = gameState.input.update(gameState.player, gameState.planetSurface, gameState.dialogue, gameState);
        // If inputResult indicates dialogue started, the state is already set to DIALOGUE in the input handler
        // If dialogue ended, we need to return to planet surface
        if (gameState.dialogue && !gameState.dialogue.active) {
            gameState.dialogue = null;
            gameState.currentState = CONFIG.STATE.PLANET_SURFACE;
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
    }
    gameState.ui.render(gameState.player);
    
    requestAnimationFrame(gameLoop);
}

// Start the game
window.addEventListener('load', init);

// Expose for debugging
window.gameState = gameState;
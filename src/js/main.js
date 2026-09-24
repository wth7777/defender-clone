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
    }
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
    player: null,
    ui: null
};

// Simple sector map placeholder
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
        // Handle input for planet selection (to be implemented)
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
}

// Player placeholder
class Player {
    constructor() {
        this.x = CONFIG.LOGICAL_WIDTH / 2;
        this.y = CONFIG.LOGICAL_HEIGHT / 2;
    }
    
    update() {
        // Movement to be implemented
    }
    
    render() {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
    }
}

// UI placeholder
class UI {
    render() {
        // Draw willpower and health bars
        ctx.fillStyle = '#00f';
        ctx.fillRect(10, 10, 100, 10); // Willpower
        ctx.fillStyle = '#f00';
        ctx.fillRect(10, 25, 100, 10); // Health
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('WP: 100/100', 12, 18);
        ctx.fillText('HP: 100/100', 12, 33);
    }
}

// Initialize
function init() {
    gameState.sectorMap = new SectorMap();
    gameState.player = new Player();
    gameState.ui = new UI();
    gameState.currentState = CONFIG.STATE.SECTOR_MAP;
    requestAnimationFrame(gameLoop);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update
    switch (gameState.currentState) {
        case CONFIG.STATE.SECTOR_MAP:
            gameState.sectorMap.update();
            break;
        case CONFIG.STATE.PLANET_SURFACE:
            gameState.player.update();
            break;
        // Add other states as needed
    }
    
    // Render
    ctx.clearRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);
    switch (gameState.currentState) {
        case CONFIG.STATE.SECTOR_MAP:
            gameState.sectorMap.render();
            break;
        case CONFIG.STATE.PLANET_SURFACE:
            // Draw planet surface placeholder
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);
            gameState.player.render();
            break;
    }
    gameState.ui.render();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
window.addEventListener('load', init);

// Simple touch handling for planet selection (placeholder)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.currentState === CONFIG.STATE.SECTOR_MAP) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX / CONFIG.SCALE;
        const y = (touch.clientY - rect.top) * scaleY / CONFIG.SCALE;
        
        // Simple selection: if touch near a planet, select it
        gameState.sectorMap.planets.forEach((p, i) => {
            const dist = Math.hypot(x - p.x, y - p.y);
            if (dist < 20) {
                gameState.sectorMap.selected = i;
                // TODO: transition to planet surface
                console.log(`Selected ${p.name}`);
            }
        });
    }
}, { passive: false });

// Prevent scrolling on touch
document.body.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
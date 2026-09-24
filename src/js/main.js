// Start the game
window.addEventListener('load', init);

// Expose for debugging
const DEBUG = {
    showTouchCoords: true,
    showBounds: true,
    showCanvasInfo: true,
    logTouchEvents: true
};
window.gameState = gameState;
window.DEBUG = DEBUG;

// Debug function to update on-screen debug info
function updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) return;

        let info = `<strong>DEBUG INFO</strong><br>`;
        info += `Canvas: ${canvas.width}×${canvas.height}px<br>`;
        info += `Window: ${window.innerWidth}×${window.innerHeight}px<br>`;
        info += `Device Pixel Ratio: ${window.devicePixelRatio}<br>`;
        info += `Game Scale: ${CONFIG.SCALE}<br>`;
        info += `Logical Size: ${CONFIG.LOGICAL_WIDTH}×${CONFIG.LOGICAL_HEIGHT}<br><br>`;

        if (gameState.debug.lastTouch) {
            info += `Last Touch: (${gameState.debug.lastTouch.x}, ${gameState.debug.lastTouch.y})<br>`;
            info += `Logical Touch: (${gameState.debug.lastLogicalTouch.x.toFixed(1)}, ${gameState.debug.lastLogicalTouch.y.toFixed(1)})<br>`;
            if (gameState.debug.canvasRect) {
                info += `Canvas Rect: ${gameState.debug.canvasRect.width}×${gameState.debug.canvasRect.height}<br>`;
                info += `Scale X: ${gameState.debug.canvasRect.width / CONFIG.LOGICAL_WIDTH}<br>`;
                info += `Scale Y: ${gameState.debug.canvasRect.height / CONFIG.LOGICAL_HEIGHT}<br>`;
            }
            info += `<br>`;
        }

        info += `Game State: `;
        switch (gameState.currentState) {
            case CONFIG.STATE.BOOT: info += 'BOOT'; break;
            case CONFIG.STATE.SECTOR_MAP: info += 'SECTOR MAP'; break;
            case CONFIG.STATE.PLANET_SURFACE: info += 'PLANET SURFACE'; break;
            case CONFIG.STATE.DIALOGUE: info += 'DIALOGUE'; break;
            case CONFIG.STATE.COMBAT: info += 'COMBAT'; break;
            case CONFIG.STATE.MENU: info += 'MENU'; break;
            default: info += 'UNKNOWN';
        }
        info += `<br>`;

        if (gameState.sectorMap) {
            info += `Selected Planet: ${gameState.sectorMap.planets[gameState.sectorMap.selected].name}<br>`;
            info += `Planet Positions:<br>`;
            gameState.sectorMap.planets.forEach((p, i) => {
                const marker = i === gameState.sectorMap.selected ? '>>> ' : '    ';
                info += `${marker}${p.name}: (${p.x}, ${p.y})<br>`;
            });
        }

        debugInfo.innerHTML = info;
    }
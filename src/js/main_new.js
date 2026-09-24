console.log("main_new.js loaded"); // DEBUG

'use strict';

// Simple test - just draw something on canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Draw a simple scene
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#00ff00';
ctx.font = '48px monospace';
ctx.textAlign = 'center';
ctx.fillText('GAME LOADED', canvas.width/2, canvas.height/2);

ctx.fillStyle = '#ffff00';
ctx.font = '24px monospace';
ctx.textAlign = 'center';
ctx.fillText('Tap anywhere to continue', canvas.width/2, canvas.height/2 + 60);

// Handle touch
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    alert('Touch detected!');
    // Change display
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TOUCH WORKING!', canvas.width/2, canvas.height/2);
});
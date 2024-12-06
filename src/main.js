import { Canvas } from './components/Canvas';
import { initializeEventHandlers } from './utils/eventHandlers';
import { loadFromStorage, setupMessageHandlers } from './utils/storage';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = new Canvas('erdCanvas');
    
    // Initialize the canvas with stored or provided data
    const initialData = loadFromStorage();
    if (initialData) {
        canvas.loadDiagram(initialData);
    }

    // Setup message handlers for iframe communication
    setupMessageHandlers(canvas);

    // Initialize event handlers
    initializeEventHandlers(canvas);

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.resize();
    });
});

import { Canvas } from './components/Canvas';
import { initializeEventHandlers } from './utils/eventHandlers';
import { loadFromStorage, setupMessageHandlers } from './utils/storage';
import { loadSampleDiagrams, sampleDiagrams } from './utils/sampleDiagrams';

async function initializeApplication() {
    const canvas = new Canvas('erdCanvas');
    
    try {
        // Load sample diagrams first
        const loadedDiagrams = await loadSampleDiagrams();
        Object.assign(sampleDiagrams, loadedDiagrams);
        console.log('Sample diagrams loaded:', sampleDiagrams);

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
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApplication);

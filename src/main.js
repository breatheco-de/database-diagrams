import { Canvas } from './components/Canvas';
import { initializeEventHandlers } from './utils/eventHandlers';
import { loadFromStorage, setupMessageHandlers, saveToStorage } from './utils/storage';
import { loadSampleDiagrams, sampleDiagrams } from './utils/sampleDiagrams';

async function initializeApplication() {
    const canvas = new Canvas('erdCanvas');
    
    try {
        // Load sample diagrams first
        const loadedDiagrams = await loadSampleDiagrams();
        Object.assign(sampleDiagrams, loadedDiagrams);
        console.log('Sample diagrams loaded:', sampleDiagrams);

        // Check for diagram parameter in URL
        const params = new URLSearchParams(window.location.search);
        const diagramParam = params.get('diagram');
        
        // Initialize the canvas with diagram from URL, stored data, or default school diagram
        if (diagramParam && sampleDiagrams[diagramParam]) {
            console.log('Loading diagram from URL parameter:', diagramParam);
            canvas.loadDiagram(sampleDiagrams[diagramParam]);
            saveToStorage(canvas.toJSON());
        } else {
            const initialData = loadFromStorage();
            if (initialData) {
                canvas.loadDiagram(initialData);
            } else if (sampleDiagrams.school) {
                // Load school diagram as default if no stored data
                console.log('Loading default school diagram');
                canvas.loadDiagram(sampleDiagrams.school);
                // Save to storage so it persists
                saveToStorage(canvas.toJSON());
                // Update URL to reflect default diagram
                const url = new URL(window.location.href);
                url.searchParams.set('diagram', 'school');
                window.history.replaceState({}, '', url.toString());
            }
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

import { Canvas } from './components/Canvas';
import { initializeEventHandlers } from './utils/eventHandlers';
import { loadFromStorage, setupMessageHandlers, saveToStorage } from './utils/storage';
import { loadSampleDiagram, SAMPLE_DIAGRAMS } from './utils/sampleDiagrams';

async function initializeApplication() {
    const canvas = new Canvas('erdCanvas');
    
    try {
        // Check for diagram parameter in URL
        const params = new URLSearchParams(window.location.search);
        const diagramParam = params.get('diagram');
        
        // Initialize the canvas with diagram from URL, stored data, or default school diagram
        if (diagramParam && SAMPLE_DIAGRAMS.includes(diagramParam)) {
            try {
                console.log('Loading diagram from URL parameter:', diagramParam);
                const diagram = await loadSampleDiagram(diagramParam);
                canvas.loadDiagram(diagram);
                saveToStorage(canvas.toJSON());
            } catch (error) {
                console.error('Failed to load diagram from URL:', error);
                // If URL diagram fails to load, try loading from storage
                const initialData = loadFromStorage();
                if (initialData) {
                    canvas.loadDiagram(initialData);
                }
            }
        } else {
            const initialData = loadFromStorage();
            if (initialData) {
                canvas.loadDiagram(initialData);
            } else {
                try {
                    // Load school diagram as default if no stored data
                    console.log('Loading default school diagram');
                    const defaultDiagram = await loadSampleDiagram('school');
                    canvas.loadDiagram(defaultDiagram);
                    // Save to storage so it persists
                    saveToStorage(canvas.toJSON());
                    // Update URL to reflect default diagram
                    const url = new URL(window.location.href);
                    url.searchParams.set('diagram', 'school');
                    window.history.replaceState({}, '', url.toString());
                } catch (error) {
                    console.error('Failed to load default diagram:', error);
                }
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

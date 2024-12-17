import { Canvas } from "./components/Canvas";
import { initializeEventHandlers } from "./utils/eventHandlers";
import {
    loadFromStorage,
    setupMessageHandlers,
    saveToStorage,
} from "./utils/storage";
import { loadDiagram, SAMPLE_DIAGRAMS } from "./utils/sampleDiagrams";

async function initializeApplication() {
    // Make sure canvas element exists before initializing
    const canvasElement = document.getElementById("erdCanvas");
    if (!canvasElement) {
        console.error("Canvas element not found");
        return;
    }
    
    const canvas = new Canvas("erdCanvas");

    try {
        // Check for diagram parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const diagramParam = urlParams.get("diagram");

        // Initialize the canvas with diagram from URL, stored data, or default school diagram
        if (diagramParam) {
            try {
                console.log(
                    "Loading diagram from URL parameter:",
                    diagramParam,
                );
                const diagram = await loadDiagram(diagramParam);
                if (diagram) {
                    canvas.loadDiagram(diagram);
                    saveToStorage(canvas.toJSON());
                } else {
                    console.error("Failed to load diagram:", diagramParam);
                    throw new Error("Failed to load diagram");
                }
            } catch (error) {
                console.error("Failed to load diagram from URL:", error);
                // If URL diagram fails to load, try loading from storage
                const storedData = loadFromStorage();
                if (storedData) {
                    canvas.loadDiagram(storedData);
                }
            }
        } else {
            // No valid diagram parameter, try loading from storage
            const storedData = loadFromStorage();
            if (storedData) {
                canvas.loadDiagram(storedData);
            } else {
                try {
                    // Load school diagram as default if no stored data
                    console.log("Loading default school diagram");
                    const defaultDiagram = await loadDiagram("school");
                    if (defaultDiagram) {
                        canvas.loadDiagram(defaultDiagram);
                        saveToStorage(canvas.toJSON());
                        // Update URL to reflect default diagram
                        const url = new URL(window.location.href);
                        url.searchParams.set("diagram", "school");
                        window.history.replaceState({}, "", url.toString());
                    }
                } catch (error) {
                    console.error("Failed to load default diagram:", error);
                }
            }
        }

        // Setup message handlers for iframe communication
        setupMessageHandlers(canvas);

        // Initialize event handlers
        initializeEventHandlers(canvas);

        // Handle window resize
        window.addEventListener("resize", () => {
            canvas.resize();
        });
    } catch (error) {
        console.error("Error initializing application:", error);
    }
}

document.addEventListener("DOMContentLoaded", initializeApplication);

export const SAMPLE_DIAGRAMS = ['airline', 'school', 'dealership', 'store', 'database-modeling-lesson'];

// Cache for loaded diagrams
export let sampleDiagrams = {};

// Load a single sample diagram by name
export async function loadSampleDiagram(name) {
    try {
        if (!SAMPLE_DIAGRAMS.includes(name)) {
            throw new Error(`Invalid sample diagram name: ${name}`);
        }

        // Return cached version if available
        if (sampleDiagrams[name]) {
            return sampleDiagrams[name];
        }

        // Load the diagram from possible locations
        let response = null;
        let error = null;

        // Try loading from src/utils/samples/json first
        try {
            response = await fetch(`/src/utils/samples/json/${name}.json`);
            if (response.ok) {
                const data = await response.json();
                // Set hiddenOnMenu to true by default if not explicitly set
                data.hiddenOnMenu = data.hiddenOnMenu ?? true;
                // Cache the loaded diagram
                sampleDiagrams[name] = data;
                return data;
            }
        } catch (e) {
            error = e;
        }

        // If that fails, try loading from /samples
        if (!response?.ok) {
            try {
                response = await fetch(`/samples/${name}.json`);
                if (response.ok) {
                    const data = await response.json();
                    // Set hiddenOnMenu to true by default if not explicitly set
                    data.hiddenOnMenu = data.hiddenOnMenu ?? true;
                    // Cache the loaded diagram
                    sampleDiagrams[name] = data;
                    return data;
                }
            } catch (e) {
                error = e;
            }
        }

        // If both attempts fail, throw an error with details
        throw new Error(`Failed to load diagram ${name}: ${error?.message || response?.statusText || 'Unknown error'}`);
    } catch (error) {
        console.error(`Error loading sample diagram ${name}:`, error);
        throw error;
    }
}
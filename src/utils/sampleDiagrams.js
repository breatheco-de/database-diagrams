export const SAMPLE_DIAGRAMS = ['airline', 'school', 'dealership', 'store'];

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

        // Load the diagram
        const response = await fetch(`/samples/${name}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load diagram ${name}: ${response.statusText}`);
        }

        const data = await response.json();
        // Set hiddenOnMenu to true by default if not explicitly set
        data.hiddenOnMenu = data.hiddenOnMenu ?? true;
        
        // Cache the loaded diagram
        sampleDiagrams[name] = data;
        return data;
    } catch (error) {
        console.error(`Error loading sample diagram ${name}:`, error);
        throw error;
    }
}
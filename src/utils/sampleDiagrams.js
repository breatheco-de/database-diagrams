const SAMPLE_DIAGRAMS = ['airline', 'school', 'dealership', 'store'];

// Load sample diagrams from JSON files in public directory
export async function loadSampleDiagrams() {
    try {
        const diagramPromises = SAMPLE_DIAGRAMS.map(name => 
            fetch(`/samples/${name}.json`)
                .then(r => r.json())
                .then(data => {
                    // Set hiddenOnMenu to true by default if not explicitly set
                    data.hiddenOnMenu = data.hiddenOnMenu ?? true;
                    return [name, data];
                })
        );

        const loadedDiagrams = await Promise.all(diagramPromises);
        return Object.fromEntries(loadedDiagrams);
    } catch (error) {
        console.error('Error loading sample diagrams:', error);
        throw error;
    }
}

// Initialize with empty object, will be populated when loaded
export let sampleDiagrams = {};
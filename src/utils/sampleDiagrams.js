// Load sample diagrams from JSON files in public directory
export async function loadSampleDiagrams() {
    try {
        const [airline, school, dealership, store] = await Promise.all([
            fetch('/samples/airline.json').then(r => r.json()),
            fetch('/samples/school.json').then(r => r.json()),
            fetch('/samples/dealership.json').then(r => r.json()),
            fetch('/samples/store.json').then(r => r.json())
        ]);

        // Process diagrams and add metadata
        airline.hiddenOnMenu = false;
        school.hiddenOnMenu = false;
        dealership.hiddenOnMenu = false;
        store.hiddenOnMenu = false;
        
        return {
            airline,
            school,
            dealership,
            store
        };
    } catch (error) {
        console.error('Error loading sample diagrams:', error);
        throw error;
    }
}

// Initialize with empty object, will be populated when loaded
export let sampleDiagrams = {};
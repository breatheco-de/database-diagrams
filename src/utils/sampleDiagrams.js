// Load sample diagrams from JSON files
export async function loadSampleDiagrams() {
    try {
        const [airline, school, dealership, store] = await Promise.all([
            fetch('/src/utils/samples/json/airline.json').then(r => r.json()),
            fetch('/src/utils/samples/json/school.json').then(r => r.json()),
            fetch('/src/utils/samples/json/dealership.json').then(r => r.json()),
            fetch('/src/utils/samples/json/store.json').then(r => r.json())
        ]);

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
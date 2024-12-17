// Load sample diagrams from JSON files
export const sampleDiagrams = {
    airline: await fetch('/src/utils/samples/json/airline.json').then(r => r.json()),
    school: await fetch('/src/utils/samples/json/school.json').then(r => r.json()),
    dealership: await fetch('/src/utils/samples/json/dealership.json').then(r => r.json()),
    store: await fetch('/src/utils/samples/json/store.json').then(r => r.json())
};
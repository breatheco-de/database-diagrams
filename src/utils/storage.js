const STORAGE_KEY = 'erdDiagram';

export function saveToStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    sendToParent(data);
}

export function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
}

export function setupMessageHandlers(canvas) {
    window.addEventListener('message', (event) => {
        if (event.data.type === 'loadERD') {
            canvas.loadDiagram(event.data.diagram);
            saveToStorage(event.data.diagram);
        }
    });
}

function sendToParent(data) {
    if (window.parent) {
        window.parent.postMessage({
            type: 'erdUpdate',
            diagram: data
        }, '*');
    }
}

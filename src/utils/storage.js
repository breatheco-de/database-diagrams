const STORAGE_KEY = 'erdDiagram';

export function saveToStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    notifyDiagramUpdate(data);
}

export function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
}

export function setupMessageHandlers(canvas) {
    window.addEventListener('message', (event) => {
        // Verify origin if needed
        try {
            switch (event.data.type) {
                case 'loadERD':
                    if (event.data.diagram) {
                        canvas.loadDiagram(event.data.diagram);
                        saveToStorage(event.data.diagram);
                        notifyDiagramLoaded(event.data.diagram);
                    }
                    break;
                case 'loadERDFromUrl':
                    if (event.data.url) {
                        fetch(event.data.url)
                            .then(response => response.json())
                            .then(diagram => {
                                canvas.loadDiagram(diagram);
                                saveToStorage(diagram);
                                notifyDiagramLoaded(diagram);
                            })
                            .catch(error => {
                                console.error('Error loading diagram:', error);
                                notifyError('Failed to load diagram from URL');
                            });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
            notifyError('Error processing diagram data');
        }
    });
}

function notifyDiagramUpdate(data) {
    if (window.parent) {
        window.parent.postMessage({
            type: 'erdUpdate',
            diagram: data,
            timestamp: new Date().toISOString()
        }, '*');
    }
}

function notifyDiagramLoaded(data) {
    if (window.parent) {
        window.parent.postMessage({
            type: 'erdLoaded',
            diagram: data,
            timestamp: new Date().toISOString()
        }, '*');
    }
}

function notifyError(message) {
    if (window.parent) {
        window.parent.postMessage({
            type: 'erdError',
            message: message,
            timestamp: new Date().toISOString()
        }, '*');
    }
}

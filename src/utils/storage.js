const STORAGE_KEY = 'erdDiagram';

export function saveToStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    notifyDiagramUpdate(data);
}

export function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        
        const parsed = JSON.parse(stored);
        console.log('Loaded diagram from storage:', parsed);
        return parsed;
    } catch (error) {
        console.error('Error loading diagram from storage:', error);
        return null;
    }
}

export function setupMessageHandlers(canvas) {
    window.addEventListener('message', (event) => {
        console.log('Received postMessage:', event.data);
        
        // Verify origin if needed
        try {
            switch (event.data.type) {
                case 'loadERD':
                    if (event.data.diagram) {
                        console.log('Loading diagram from postMessage:', event.data.diagram);
                        canvas.loadDiagram(event.data.diagram);
                        saveToStorage(event.data.diagram);
                        notifyDiagramLoaded(event.data.diagram);
                    } else {
                        console.warn('Received loadERD message without diagram data');
                    }
                    break;
                    
                case 'loadERDFromUrl':
                    if (event.data.url) {
                        console.log('Loading diagram from URL:', event.data.url);
                        fetch(event.data.url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                return response.json();
                            })
                            .then(diagram => {
                                console.log('Successfully loaded diagram from URL:', diagram);
                                canvas.loadDiagram(diagram);
                                saveToStorage(diagram);
                                notifyDiagramLoaded(diagram);
                            })
                            .catch(error => {
                                console.error('Error loading diagram from URL:', error);
                                notifyError('Failed to load diagram from URL: ' + error.message);
                            });
                    } else {
                        console.warn('Received loadERDFromUrl message without URL');
                    }
                    break;
                    
                default:
                    console.warn('Received unknown message type:', event.data.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            notifyError('Error processing diagram data: ' + error.message);
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

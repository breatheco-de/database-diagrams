import { saveToStorage } from './storage';

export function initializeEventHandlers(canvas) {
    let isDragging = false;
    let selectedTable = null;
    let isCreatingRelationship = false;
    let relationshipStart = null;

    const addTableBtn = document.getElementById('addTable');
    const resetViewBtn = document.getElementById('resetView');

    addTableBtn.addEventListener('click', () => {
        const table = canvas.addTable(
            'New Table',
            canvas.canvas.width / 2 - canvas.offset.x,
            canvas.canvas.height / 2 - canvas.offset.y
        );
        saveToStorage(canvas.toJSON());
    });

    resetViewBtn.addEventListener('click', () => {
        canvas.offset = { x: 0, y: 0 };
        canvas.scale = 1;
        canvas.render();
    });

    canvas.canvas.addEventListener('mousedown', (e) => {
        const pos = getCanvasPosition(e, canvas);
        
        // Check if clicking on a table
        canvas.tables.forEach(table => {
            if (table.containsPoint(pos.x, pos.y)) {
                selectedTable = table;
                isDragging = true;
                return;
            }
        });

        // If not clicking on a table, start canvas drag
        if (!selectedTable) {
            isDragging = true;
            canvas.dragStart = { x: e.clientX - canvas.offset.x, y: e.clientY - canvas.offset.y };
        }
    });

    canvas.canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        if (selectedTable) {
            const pos = getCanvasPosition(e, canvas);
            selectedTable.x = pos.x - selectedTable.width / 2;
            selectedTable.y = pos.y - selectedTable.height / 2;
        } else {
            canvas.offset = {
                x: e.clientX - canvas.dragStart.x,
                y: e.clientY - canvas.dragStart.y
            };
        }
        
        canvas.render();
    });

    canvas.canvas.addEventListener('mouseup', () => {
        if (selectedTable) {
            saveToStorage(canvas.toJSON());
        }
        isDragging = false;
        selectedTable = null;
    });

    // Zoom handling
    canvas.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        canvas.scale *= delta;
        canvas.scale = Math.max(0.5, Math.min(canvas.scale, 2));
        canvas.render();
    });
}

function getCanvasPosition(event, canvas) {
    const rect = canvas.canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left - canvas.offset.x) / canvas.scale,
        y: (event.clientY - rect.top - canvas.offset.y) / canvas.scale
    };
}

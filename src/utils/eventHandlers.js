import { saveToStorage } from './storage';
import { AttributeForm } from '../components/AttributeForm';
import { RelationshipTypeModal } from '../components/RelationshipTypeModal';
import { createMoveTableCommand, createAddAttributeCommand } from './history';
import { ZOOM_LEVELS } from './constants';

export function initializeEventHandlers(canvas) {
    let isDragging = false;
    let selectedTable = null;
    let isCreatingRelationship = false;
    let relationshipStart = null;
    let activeConnectionPoint = null;
    
    const attributeForm = new AttributeForm();
    const relationshipTypeModal = new RelationshipTypeModal();

    const addTableBtn = document.getElementById('addTable');
    const resetViewBtn = document.getElementById('resetView');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    const exportBtn = document.getElementById('exportImage');

    function updateUndoRedoButtons() {
        undoBtn.disabled = !canvas.history.canUndo();
        redoBtn.disabled = !canvas.history.canRedo();
    }

    undoBtn.addEventListener('click', () => {
        if (canvas.history.undo()) {
            saveToStorage(canvas.toJSON());
            canvas.render();
            updateUndoRedoButtons();
        }
    });

    redoBtn.addEventListener('click', () => {
        if (canvas.history.redo()) {
            saveToStorage(canvas.toJSON());
            canvas.render();
            updateUndoRedoButtons();
        }
    });

    addTableBtn.addEventListener('click', () => {
        canvas.addTable();
        saveToStorage(canvas.toJSON());
    });

    resetViewBtn.addEventListener('click', () => {
        canvas.offset = { x: 0, y: 0 };
        canvas.scale = 1;
        canvas.render();
    });

    exportBtn.addEventListener('click', () => {
        canvas.exportAsImage();
    });

    canvas.canvas.addEventListener('mousedown', (e) => {
        const pos = getCanvasPosition(e, canvas);
        
        // Check if clicking on a table
        canvas.tables.forEach(table => {
            if (table.containsPoint(pos.x, pos.y)) {
                // Check if clicking add attribute button
                if (table.isAddButtonClicked(pos.x, pos.y)) {
                    attributeForm.show((attribute) => {
                        const command = createAddAttributeCommand(table, {
                            name: attribute.name,
                            type: attribute.type,
                            isPrimary: attribute.isPrimary
                        });
                        canvas.history.execute(command);
                        canvas.render();
                        saveToStorage(canvas.toJSON());
                        updateUndoRedoButtons();
                    });
                    return;
                }

                // Check if clicking on connection points
                const connectionPoint = findNearestConnectionPoint(table, pos);
                if (connectionPoint) {
                    isCreatingRelationship = true;
                    relationshipStart = { table, point: connectionPoint };
                    return;
                }

                selectedTable = table;
                isDragging = true;
                return;
            }
        });

        // If not clicking on a table, start canvas drag
        if (!selectedTable && !isCreatingRelationship) {
            isDragging = true;
            canvas.dragStart = { x: e.clientX - canvas.offset.x, y: e.clientY - canvas.offset.y };
        }
    });

    canvas.canvas.addEventListener('mousemove', (e) => {
        const pos = getCanvasPosition(e, canvas);

        if (isCreatingRelationship && relationshipStart) {
            canvas.render();
            // Draw temporary relationship line
            const ctx = canvas.ctx;
            ctx.save();
            ctx.translate(canvas.offset.x, canvas.offset.y);
            ctx.scale(canvas.scale, canvas.scale);
            ctx.beginPath();
            ctx.moveTo(relationshipStart.point.x, relationshipStart.point.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = 'var(--bs-primary)';
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (!isDragging) return;

        if (selectedTable) {
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

    canvas.canvas.addEventListener('mouseup', (e) => {
        if (isCreatingRelationship && relationshipStart) {
            const pos = getCanvasPosition(e, canvas);
            canvas.tables.forEach(table => {
                if (table !== relationshipStart.table && table.containsPoint(pos.x, pos.y)) {
                    const connectionPoint = findNearestConnectionPoint(table, pos);
                    if (connectionPoint) {
                        console.log('Connection point found, showing relationship modal');
                        try {
                            relationshipTypeModal.show((type) => {
                                console.log('Relationship type selected:', type);
                                canvas.addRelationship(relationshipStart.table, table, type);
                                saveToStorage(canvas.toJSON());
                                updateUndoRedoButtons();
                            });
                        } catch (error) {
                            console.error('Error showing relationship modal:', error);
                        }
                    }
                }
            });
            isCreatingRelationship = false;
            relationshipStart = null;
        }

        if (selectedTable) {
            const pos = getCanvasPosition(e, canvas);
            selectedTable.x = pos.x - selectedTable.width / 2;
            selectedTable.y = pos.y - selectedTable.height / 2;
            saveToStorage(canvas.toJSON());
        }
        isDragging = false;
        selectedTable = null;
        canvas.render();
    });

    // Zoom handling
    function updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoomLevel');
        zoomLevel.textContent = `${Math.round(canvas.scale * 100)}%`;
    }

    function setZoomLevel(index) {
        canvas.zoomIndex = Math.max(0, Math.min(index, ZOOM_LEVELS.length - 1));
        canvas.scale = ZOOM_LEVELS[canvas.zoomIndex];
        canvas.render();
        updateZoomDisplay();
    }

    document.getElementById('zoomIn').addEventListener('click', () => {
        setZoomLevel(canvas.zoomIndex + 1);
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        setZoomLevel(canvas.zoomIndex - 1);
    });

    canvas.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        setZoomLevel(canvas.zoomIndex + delta);
    });

    // Initialize zoom display
    updateZoomDisplay();
}

function findNearestConnectionPoint(table, pos) {
    const points = table.getConnectionPoints();
    let nearest = null;
    let minDistance = 25; // Increased detection radius for better usability
    
    points.forEach(point => {
        const distance = Math.hypot(pos.x - point.x, pos.y - point.y);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = point;
        }
    });
    
    return nearest;
}

function getCanvasPosition(event, canvas) {
    const rect = canvas.canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left - canvas.offset.x) / canvas.scale,
        y: (event.clientY - rect.top - canvas.offset.y) / canvas.scale
    };
}

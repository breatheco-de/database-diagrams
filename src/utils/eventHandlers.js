import { AttributeForm } from '../components/AttributeForm';
import { RelationshipTypeModal } from '../components/RelationshipTypeModal';
import { RELATIONSHIP_TYPES, ZOOM_LEVELS } from './constants';
import { saveToStorage } from './storage';
import { createDeleteTableCommand } from './history';

let canvasInstance = null;
let startTable = null;
let startPoint = null;
const attributeForm = new AttributeForm();
const relationshipTypeModal = new RelationshipTypeModal();

function updateZoomDisplay() {
    const zoomText = document.getElementById('zoomLevel');
    if (zoomText && canvasInstance) {
        zoomText.textContent = `${Math.round(canvasInstance.scale * 100)}%`;
    }
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    
    if (undoBtn) {
        undoBtn.disabled = !canvas.history.canUndo();
    }
    if (redoBtn) {
        redoBtn.disabled = !canvas.history.canRedo();
    }
}

export function initializeEventHandlers(canvas) {
    canvasInstance = canvas;  // Store canvas reference
    // Mouse move handler
    canvas.canvas.addEventListener('mousemove', (e) => {
        const pos = getCanvasPosition(e, canvas);
        let hoveredTable = null;
        
        canvas.tables.forEach(table => {
            if (table.containsPoint(pos.x, pos.y)) {
                hoveredTable = table;
            }
            table.isHovered = table === hoveredTable;
        });
        
        canvas.render();
    });

    // Mouse down handler
    canvas.canvas.addEventListener('mousedown', (e) => {
        const pos = getCanvasPosition(e, canvas);
        let handled = false;
        
        canvas.tables.forEach(table => {
            if (!handled && table.containsPoint(pos.x, pos.y)) {
                // Check if clicking delete button
                if (table.isDeleteButtonClicked(pos.x, pos.y)) {
                    const deleteModal = createDeleteModal();
                    document.body.appendChild(deleteModal);
                    const bsModal = new bootstrap.Modal(deleteModal);
                    
                    deleteModal.querySelector('#confirmDelete').onclick = () => {
                        const command = createDeleteTableCommand(canvas, table);
                        canvas.history.execute(command);
                        saveToStorage(canvas.toJSON());
                        updateUndoRedoButtons();
                        bsModal.hide();
                        deleteModal.addEventListener('hidden.bs.modal', () => {
                            if (deleteModal.parentNode) {
                                document.body.removeChild(deleteModal);
                            }
                        });
                    };
                    
                    bsModal.show();
                    handled = true;
                    return;
                }

                // Check if clicking add attribute button
                if (table.isAddButtonClicked(pos.x, pos.y)) {
                    attributeForm.show(({ name, type, isPrimary }) => {
                        table.addAttribute(name, type, isPrimary);
                        saveToStorage(canvas.toJSON());
                        canvas.render();
                    });
                    handled = true;
                    return;
                }

                // Check if clicking connection point
                const connectionPoint = findNearestConnectionPoint(table, pos);
                if (connectionPoint) {
                    startTable = table;
                    startPoint = connectionPoint;
                    handled = true;
                    return;
                }

                // Start dragging table
                canvas.isDragging = true;
                canvas.draggedTable = table;
                canvas.dragStart = { x: pos.x - table.x, y: pos.y - table.y };
                handled = true;
            }
        });

        // Start panning if not handling any table interactions
        if (!handled) {
            canvas.isDragging = true;
            canvas.dragStart = { x: e.clientX - canvas.offset.x, y: e.clientY - canvas.offset.y };
        }
    });

    // Mouse up handler
    canvas.canvas.addEventListener('mouseup', (e) => {
        if (startTable) {
            const pos = getCanvasPosition(e, canvas);
            let endTable = null;
            let endPoint = null;
            
            canvas.tables.forEach(table => {
                if (table !== startTable && table.containsPoint(pos.x, pos.y)) {
                    endTable = table;
                    endPoint = findNearestConnectionPoint(table, pos);
                }
            });
            
            if (endTable && endPoint) {
                relationshipTypeModal.show(type => {
                    canvas.addRelationship(startTable, endTable, type);
                    saveToStorage(canvas.toJSON());
                    updateUndoRedoButtons();
                });
            }
        }
        
        startTable = null;
        startPoint = null;
        canvas.isDragging = false;
        canvas.draggedTable = null;
    });

    // Mouse move handler
    canvas.canvas.addEventListener('mousemove', (e) => {
        if (canvas.isDragging) {
            if (canvas.draggedTable) {
                const pos = getCanvasPosition(e, canvas);
                canvas.draggedTable.x = Math.round((pos.x - canvas.dragStart.x) / 20) * 20;
                canvas.draggedTable.y = Math.round((pos.y - canvas.dragStart.y) / 20) * 20;
            } else {
                canvas.offset.x = e.clientX - canvas.dragStart.x;
                canvas.offset.y = e.clientY - canvas.dragStart.y;
            }
            canvas.render();
        }
    });

    // Add table button
    document.getElementById('addTable').addEventListener('click', () => {
        const table = canvas.addTable();
        saveToStorage(canvas.toJSON());
        updateUndoRedoButtons();
    });

    // Undo/Redo buttons
    document.getElementById('undo').addEventListener('click', () => {
        canvas.history.undo();
        saveToStorage(canvas.toJSON());
        updateUndoRedoButtons();
    });

    document.getElementById('redo').addEventListener('click', () => {
        canvas.history.redo();
        saveToStorage(canvas.toJSON());
        updateUndoRedoButtons();
    });

    // Export button
    document.getElementById('exportImage').addEventListener('click', () => {
        canvas.exportAsImage();
    });

    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => {
        if (canvas.zoomIndex < ZOOM_LEVELS.length - 1) {
            canvas.zoomIndex++;
            canvas.scale = ZOOM_LEVELS[canvas.zoomIndex];
            canvas.render();
            updateZoomDisplay();
        }
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        if (canvas.zoomIndex > 0) {
            canvas.zoomIndex--;
            canvas.scale = ZOOM_LEVELS[canvas.zoomIndex];
            canvas.render();
            updateZoomDisplay();
        }
    });

    // Reset view button
    document.getElementById('resetView').addEventListener('click', () => {
        canvas.offset = { x: 0, y: 0 };
        canvas.zoomIndex = 2; // Default zoom level
        canvas.scale = ZOOM_LEVELS[canvas.zoomIndex];
        canvas.render();
        updateZoomDisplay();
    });

    // Mouse wheel zoom
    canvas.canvas.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            const newIndex = Math.min(Math.max(0, canvas.zoomIndex + delta), ZOOM_LEVELS.length - 1);
            
            if (newIndex !== canvas.zoomIndex) {
                canvas.zoomIndex = newIndex;
                canvas.scale = ZOOM_LEVELS[canvas.zoomIndex];
                canvas.render();
                updateZoomDisplay();
            }
        }
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

function createDeleteModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete Table</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this table?</p>
                    <p class="text-danger">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                </div>
            </div>
        </div>
    `;
    return modal;
}
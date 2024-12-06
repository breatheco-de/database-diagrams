import { saveToStorage } from './storage';
import { AttributeForm } from '../components/AttributeForm';
import { RelationshipTypeModal } from '../components/RelationshipTypeModal';
import { createMoveTableCommand, createAddAttributeCommand, createDeleteTableCommand } from './history';
import { ZOOM_LEVELS } from './constants';

// State variables
let isDragging = false;
let selectedTable = null;
let isCreatingRelationship = false;
let relationshipStart = null;
let activeConnectionPoint = null;

function isModalOpen() {
    return document.querySelector('.modal.show') !== null;
}

function resetDragStates() {
    isDragging = false;
    selectedTable = null;
    isCreatingRelationship = false;
    relationshipStart = null;
    activeConnectionPoint = null;
    // Force render to clear any temporary relationship lines
    canvas.render();
}

export function initializeEventHandlers(canvas) {
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
        if (isModalOpen()) {
            resetDragStates();
            return;
        }
        const pos = getCanvasPosition(e, canvas);
        
        // Check if clicking on a table
        canvas.tables.forEach(table => {
            if (table.containsPoint(pos.x, pos.y)) {
                // Check if clicking delete button
                if (pos.x >= table.x + table.width - 30 && 
                    pos.x <= table.x + table.width - 10 &&
                    pos.y >= table.y + 10 &&
                    pos.y <= table.y + 30) {
                    
                    // Create confirmation modal
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
                                    <p>Are you sure you want to delete this table? This will also remove all relationships connected to it.</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    const bsModal = new bootstrap.Modal(modal);
                    
                    const deleteTable = () => {
                        const command = createDeleteTableCommand(canvas, table);
                        canvas.history.execute(command);
                        bsModal.hide();
                        modal.addEventListener('hidden.bs.modal', () => {
                            document.body.removeChild(modal);
                        });
                        
                        saveToStorage(canvas.toJSON());
                        updateUndoRedoButtons();
                    };
                    
                    modal.querySelector('#confirmDelete').onclick = deleteTable;
                    bsModal.show();
                    return;
                }
                
                // Check if clicking edit icon
                const attributeIndex = table.isEditIconClicked(pos.x, pos.y);
                if (attributeIndex !== -1) {
                    // Reset all drag states before showing modal
                    resetDragStates();
                    
                    const attribute = table.attributes[attributeIndex];
                    attributeForm.show((updatedAttribute) => {
                        attribute.name = updatedAttribute.name;
                        attribute.type = updatedAttribute.type;
                        attribute.isPrimary = updatedAttribute.isPrimary;
                        table.updateHeight();
                        canvas.render();
                        saveToStorage(canvas.toJSON());
                    }, attribute);
                    
                    e.stopPropagation();
                    return;
                }

                // Check if clicking add attribute button
                if (table.isAddButtonClicked(pos.x, pos.y)) {
                    resetDragStates();
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
        if (isModalOpen()) {
            resetDragStates();
            canvas.render();
            return;
        }
        const pos = getCanvasPosition(e, canvas);
        
        // Reset all table hover states
        canvas.tables.forEach(table => table.isHovered = false);
        
        // Set hover state for table under cursor
        canvas.tables.forEach(table => {
            if (table.containsPoint(pos.x, pos.y)) {
                table.isHovered = true;
            }
        });

        if (isCreatingRelationship && relationshipStart) {
            canvas.render();
            // Draw temporary relationship line with arrow
            const ctx = canvas.ctx;
            ctx.save();
            ctx.translate(canvas.offset.x, canvas.offset.y);
            ctx.scale(canvas.scale, canvas.scale);
            
            // Draw dashed line
            ctx.beginPath();
            ctx.setLineDash([5, 3]);
            ctx.moveTo(relationshipStart.point.x, relationshipStart.point.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = 'var(--bs-primary)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw direction arrow
            const angle = Math.atan2(pos.y - relationshipStart.point.y, pos.x - relationshipStart.point.x);
            const arrowLength = 15;
            const arrowWidth = Math.PI / 6; // 30 degrees
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(
                pos.x - arrowLength * Math.cos(angle - arrowWidth),
                pos.y - arrowLength * Math.sin(angle - arrowWidth)
            );
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(
                pos.x - arrowLength * Math.cos(angle + arrowWidth),
                pos.y - arrowLength * Math.sin(angle + arrowWidth)
            );
            ctx.strokeStyle = 'var(--bs-primary)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
            return;
        }

        if (!isDragging) {
            canvas.render();
            return;
        }

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
        if (isModalOpen()) {
            resetDragStates();
            canvas.render();
            return;
        }

        const wasCreatingRelationship = isCreatingRelationship && relationshipStart;
        const pos = getCanvasPosition(e, canvas);

        if (wasCreatingRelationship) {
            canvas.tables.forEach(table => {
                if (table !== relationshipStart.table && table.containsPoint(pos.x, pos.y)) {
                    const connectionPoint = findNearestConnectionPoint(table, pos);
                    if (connectionPoint) {
                        relationshipTypeModal.show((type) => {
                            // Add null check
                            if (!relationshipStart || !relationshipStart.table) {
                                return;
                            }
                            
                            if (type === 'manyToMany') {
                                // Create and show an alert or modal with the message
                                const infoModal = document.createElement('div');
                                infoModal.className = 'modal fade';
                                infoModal.innerHTML = `
                                    <div class="modal-dialog">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title">Many-to-Many Relationship</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div class="modal-body">
                                                <p>Many-to-many connections don't exist directly in relational databases. They need to be represented using a pivot/junction table.</p>
                                                <p>To properly model this relationship:</p>
                                                <ol>
                                                    <li>Create a new table to serve as the pivot table</li>
                                                    <li>Create one-to-many relationships from each original table to the pivot table</li>
                                                </ol>
                                                <a href="https://en.wikipedia.org/wiki/Many-to-many_(data_model)" target="_blank">Learn more about many-to-many relationships</a>
                                            </div>
                                            <div class="modal-footer">
                                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Got it!</button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                document.body.appendChild(infoModal);
                                const bsModal = new bootstrap.Modal(infoModal);
                                bsModal.show();
                                infoModal.addEventListener('hidden.bs.modal', () => {
                                    document.body.removeChild(infoModal);
                                });
                            } else {
                                canvas.addRelationship(relationshipStart.table, table, type);
                                saveToStorage(canvas.toJSON());
                                updateUndoRedoButtons();
                            }
                        });
                    }
                }
            });
        }

        resetDragStates();
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

    // Add double-click handler for table name editing
    canvas.canvas.addEventListener('dblclick', (e) => {
        const pos = getCanvasPosition(e, canvas);
        
        canvas.tables.forEach(table => {
            if (table.containsPoint(pos.x, pos.y)) {
                // Check if click is in the header area
                if (pos.y <= table.y + 40) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = table.name;
                    input.style.position = 'absolute';
                    input.style.left = `${(table.x + table.width/2) * canvas.scale + canvas.offset.x - 75}px`;
                    input.style.top = `${(table.y + 10) * canvas.scale + canvas.offset.y}px`;
                    input.style.width = '150px';
                    input.style.textAlign = 'center';
                    input.style.font = 'bold 16px Arial';
                    input.style.border = '2px solid var(--bs-primary)';
                    input.style.borderRadius = '4px';
                    input.style.padding = '2px';
                    input.style.zIndex = '1000';
                    
                    document.body.appendChild(input);
                    input.focus();
                    input.select();
                    
                    table.isEditingName = true;
                    
                    const finishEditing = () => {
                        if (input.value.trim()) {
                            table.name = input.value.trim();
                            saveToStorage(canvas.toJSON());
                        }
                        table.isEditingName = false;
                        document.body.removeChild(input);
                        canvas.render();
                    };
                    
                    input.addEventListener('blur', finishEditing);
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            finishEditing();
                        }
                        if (e.key === 'Escape') {
                            table.isEditingName = false;
                            document.body.removeChild(input);
                            canvas.render();
                        }
                    });
                }
            }
        });
    });
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

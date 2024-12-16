import { saveToStorage } from "./storage";
import { AttributeForm } from "../components/AttributeForm";
import { RelationshipTypeModal } from "../components/RelationshipTypeModal";
import {
    createMoveTableCommand,
    createAddAttributeCommand,
    createDeleteTableCommand,
} from "./history";
import { ZOOM_LEVELS } from "./constants";
import { showSnackbar } from "./ui";

// Module-level state
let relationshipStart = null;
let isCreatingRelationship = false;
let isReadOnly = false;

function configureToolbar() {
    const params = new URLSearchParams(window.location.search);
    isReadOnly = params.get("readOnly") === "true";
    // Make readOnly state globally available for components
    window.isReadOnly = isReadOnly;

    // Configure zoom controls
    const zoomToolbar = document.querySelector(".toolbar-zoom");
    const zoomControls = [
        document.getElementById("zoomOut"),
        document.getElementById("zoomIn"),
        document.getElementById("zoomLevel"),
    ];

    const zoomParam = params.get("zoom");
    if (zoomParam === "false") {
        zoomToolbar.style.display = "none";
    } else if (
        ["top-left", "top-right", "bottom-left", "bottom-right"].includes(
            zoomParam,
        )
    ) {
        zoomToolbar.className = `toolbar toolbar-zoom ${zoomParam}`;
    } else {
        zoomToolbar.className = "toolbar toolbar-zoom bottom-right";
    }

    // Configure initial zoom level from URL parameter
    const zoomLevel = params.get("zoomLevel");
    if (zoomLevel) {
        const zoomValue = parseFloat(zoomLevel);
        if (!isNaN(zoomValue) && zoomValue > 0) {
            // Find the closest zoom level index
            const index = ZOOM_LEVELS.reduce((prev, curr, idx) => 
                Math.abs(curr - zoomValue) < Math.abs(ZOOM_LEVELS[prev] - zoomValue) ? idx : prev
            , 0);
            canvas.zoomIndex = index;
            canvas.scale = ZOOM_LEVELS[index];
            updateZoomDisplay();
        }
    }

    // Configure Add Table button visibility
    const addTableBtn = document.getElementById("addTable");
    const allowAdd = params.get("allowAdd");
    if (allowAdd === "false" || isReadOnly) {
        addTableBtn.style.display = "none";
    }

    // Configure Edit-related buttons visibility in readOnly mode
    const resetViewBtn = document.getElementById("resetView");
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    if (isReadOnly) {
        resetViewBtn.style.display = "none";
        undoBtn.style.display = "none";
        redoBtn.style.display = "none";
    }

    // Configure Export options
    const exportDropdown = document.querySelector(".dropdown");
    const exportImage = document.getElementById("exportImage");
    const exportJson = document.getElementById("exportJson");
    const allowExport = params.get("allowExport");

    if (allowExport === "false") {
        // Hide entire export dropdown when explicitly disabled
        exportDropdown.parentElement.removeChild(exportDropdown);
    } else if (allowExport) {
        // Show only specified formats
        const allowedFormats = allowExport.toLowerCase().split(",");
        exportImage.style.display = allowedFormats.includes("png") ? "" : "none";
        exportJson.style.display = allowedFormats.includes("json") ? "" : "none";
        
        // Hide dropdown if no formats are allowed
        if (!allowedFormats.includes("png") && !allowedFormats.includes("json")) {
            exportDropdown.parentElement.removeChild(exportDropdown);
        }
    } else {
        // When allowExport is not specified, show all formats
        exportImage.style.display = "";
        exportJson.style.display = "";
    }
}

export function initializeEventHandlers(canvas) {
    let isDragging = false;
    let selectedTable = null;
    let activeConnectionPoint = null;

    const attributeForm = new AttributeForm();
    const relationshipTypeModal = new RelationshipTypeModal();

    configureToolbar();

    const addTableBtn = document.getElementById("addTable");
    const resetViewBtn = document.getElementById("resetView");
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    // Export buttons are handled directly via their IDs

    function updateUndoRedoButtons() {
        undoBtn.disabled = !canvas.history.canUndo();
        redoBtn.disabled = !canvas.history.canRedo();
    }

    undoBtn.addEventListener("click", () => {
        if (canvas.history.undo()) {
            saveToStorage(canvas.toJSON());
            canvas.render();
            updateUndoRedoButtons();
        }
    });

    redoBtn.addEventListener("click", () => {
        if (canvas.history.redo()) {
            saveToStorage(canvas.toJSON());
            canvas.render();
            updateUndoRedoButtons();
        }
    });

    addTableBtn.addEventListener("click", () => {
        // Create and show modal for table name input
        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Table</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="tableName" class="form-label">Table Name</label>
                            <input type="text" class="form-control" id="tableName" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="createTable">Create</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);

        // Handle table creation
        const createTable = () => {
            const nameInput = modal.querySelector("#tableName");
            const name = nameInput.value.trim();

            if (name) {
                canvas.addTable(name);
                saveToStorage(canvas.toJSON());
                bsModal.hide();
            }
        };

        // Add event listeners
        modal.querySelector("#createTable").onclick = createTable;
        modal.querySelector("#tableName").addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                createTable();
            }
        });

        // Clean up modal after hiding
        modal.addEventListener("hidden.bs.modal", () => {
            document.body.removeChild(modal);
        });

        bsModal.show();
        modal.querySelector("#tableName").focus();
    });

    resetViewBtn.addEventListener("click", () => {
        canvas.offset = { x: 0, y: 0 };
        canvas.scale = 1;
        canvas.render();
    });

    // Only add export event listeners if the functionality is enabled
    const exportImage = document.getElementById("exportImage");
    const exportJson = document.getElementById("exportJson");
    
    if (exportImage) {
        exportImage.addEventListener("click", () => {
            canvas.exportAsImage();
        });
    }

    if (exportJson) {
        exportJson.addEventListener("click", () => {
            const data = canvas.toJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "erd-diagram.json";
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    canvas.canvas.addEventListener("mousedown", (e) => {
        const pos = getCanvasPosition(e, canvas);
        let isIconClicked = false;
        let isAddButtonClicked = false;
        let isDeleteButtonClicked = false;

        // If in readOnly mode, only allow canvas panning
        if (isReadOnly) {
            isDragging = true;
            canvas.dragStart = {
                x: e.clientX - canvas.offset.x,
                y: e.clientY - canvas.offset.y,
            };
            return;
        }

        // Check if clicking on a table
        canvas.tables.forEach((table) => {
            const attributeIndex = table.isEditIconClicked(pos.x, pos.y);
            isIconClicked = isIconClicked || attributeIndex !== -1;
            isAddButtonClicked =
                isAddButtonClicked || table.isAddButtonClicked(pos.x, pos.y);
            isDeleteButtonClicked =
                isDeleteButtonClicked ||
                table.isDeleteButtonClicked(pos.x, pos.y);

            if (table.containsPoint(pos.x, pos.y)) {
                // First check connection points
                const connectionPoint = findNearestConnectionPoint(table, pos);
                if (connectionPoint) {
                    isCreatingRelationship = true;
                    relationshipStart = { table, point: connectionPoint };
                    return;
                }

                // Check if clicking delete button (trash icon)
                if (
                    pos.x >= table.x + table.width - 30 &&
                    pos.x <= table.x + table.width - 10 &&
                    pos.y >= table.y + 10 &&
                    pos.y <= table.y + 30
                ) {
                    // Create confirmation modal
                    const modal = document.createElement("div");
                    modal.className = "modal fade";
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
                        modal.addEventListener("hidden.bs.modal", () => {
                            document.body.removeChild(modal);
                        });

                        saveToStorage(canvas.toJSON());
                        updateUndoRedoButtons();
                    };

                    modal.querySelector("#confirmDelete").onclick = deleteTable;
                    bsModal.show();
                    return;
                }

                // Check if clicking edit icon
                if (isIconClicked) {
                    const attribute = table.attributes[attributeIndex];
                    attributeForm.show((updatedAttribute) => {
                        // Update existing attribute
                        attribute.name = updatedAttribute.name;
                        attribute.type = updatedAttribute.type;
                        attribute.isPrimary = updatedAttribute.isPrimary;
                        table.updateHeight();
                        canvas.render();
                        saveToStorage(canvas.toJSON());
                    }, attribute); // Pass existing attribute data
                    return;
                }

                // Check if clicking add attribute button
                if (isAddButtonClicked) {
                    attributeForm.show((attribute) => {
                        const command = createAddAttributeCommand(table, {
                            name: attribute.name,
                            type: attribute.type,
                            isPrimary: attribute.isPrimary,
                        });
                        canvas.history.execute(command);
                        canvas.render();
                        saveToStorage(canvas.toJSON());
                        updateUndoRedoButtons();
                    });
                    return;
                }

                if (
                    !isIconClicked &&
                    !isAddButtonClicked &&
                    !isDeleteButtonClicked
                ) {
                    console.log("starting drag...");
                    selectedTable = table;
                    isDragging = true;
                }
                return;
            }
        });

        // If not clicking on a table, start canvas drag
        if (
            !selectedTable &&
            !isCreatingRelationship &&
            !isIconClicked &&
            !isAddButtonClicked &&
            !isDeleteButtonClicked
        ) {
            console.log("starting drag 2...");
            isDragging = true;
            canvas.dragStart = {
                x: e.clientX - canvas.offset.x,
                y: e.clientY - canvas.offset.y,
            };
        }
    });

    canvas.canvas.addEventListener("mousemove", (e) => {
        const pos = getCanvasPosition(e, canvas);

        // Reset all table hover states
        canvas.tables.forEach((table) => (table.isHovered = false));

        // Set hover state for table under cursor
        canvas.tables.forEach((table) => {
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
            ctx.strokeStyle = "var(--bs-primary)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw direction arrowis
            const angle = Math.atan2(
                pos.y - relationshipStart.point.y,
                pos.x - relationshipStart.point.x,
            );
            const arrowLength = 15;
            const arrowWidth = Math.PI / 6; // 30 degrees

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(
                pos.x - arrowLength * Math.cos(angle - arrowWidth),
                pos.y - arrowLength * Math.sin(angle - arrowWidth),
            );
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(
                pos.x - arrowLength * Math.cos(angle + arrowWidth),
                pos.y - arrowLength * Math.sin(angle + arrowWidth),
            );
            ctx.strokeStyle = "var(--bs-primary)";
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
                y: e.clientY - canvas.dragStart.y,
            };
        }

        canvas.render();
    });

    canvas.canvas.addEventListener("mouseup", (e) => {
        if (isCreatingRelationship && relationshipStart) {
            const pos = getCanvasPosition(e, canvas);
            canvas.tables.forEach((table) => {
                if (
                    table !== relationshipStart.table &&
                    table.containsPoint(pos.x, pos.y)
                ) {
                    const connectionPoint = findNearestConnectionPoint(
                        table,
                        pos,
                    );
                    if (connectionPoint) {
                        const sourceTable = relationshipStart.table;
                        const targetTable = table;

                        // Check if both tables have primary keys
                        const sourcePrimaryKey = sourceTable.attributes.find(
                            (attr) => attr.isPrimary,
                        );
                        const targetPrimaryKey = targetTable.attributes.find(
                            (attr) => attr.isPrimary,
                        );

                        if (!sourcePrimaryKey || !targetPrimaryKey) {
                            // Show error modal
                            const errorModal = document.createElement("div");
                            errorModal.className = "modal fade";
                            errorModal.innerHTML = `
                                <div class="modal-dialog">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title">Error</h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body">
                                            <p>Tables need to have primary keys before you can add relationships.</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(errorModal);
                            const bsModal = new bootstrap.Modal(errorModal);
                            bsModal.show();
                            errorModal.addEventListener(
                                "hidden.bs.modal",
                                () => {
                                    document.body.removeChild(errorModal);
                                },
                            );
                            return;
                        }

                        relationshipTypeModal.show((type) => {
                            if (type === "manyToMany") {
                                // Show existing many-to-many modal code
                                const infoModal = document.createElement("div");
                                infoModal.className = "modal fade";
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
                                infoModal.addEventListener(
                                    "hidden.bs.modal",
                                    () => {
                                        document.body.removeChild(infoModal);
                                    },
                                );
                            } else {
                                // Determine which table is the "many" side
                                const manyTable =
                                    type === "oneToMany"
                                        ? targetTable
                                        : sourceTable;
                                const oneTable =
                                    type === "oneToMany"
                                        ? sourceTable
                                        : targetTable;

                                // Show attribute form for foreign key
                                attributeForm.show(
                                    (attribute) => {
                                        // Create the foreign key attribute
                                        const foreignKey = {
                                            name:
                                                attribute.name ||
                                                `${oneTable.name.toLowerCase()}_id`,
                                            type: "number", // Default type for foreign keys
                                            isPrimary: false,
                                            isForeignKey: true,
                                            references: oneTable.name,
                                        };

                                        // Add foreign key to the many side table
                                        const command =
                                            createAddAttributeCommand(
                                                manyTable,
                                                foreignKey,
                                            );
                                        canvas.history.execute(command);

                                        // Create the actual relationship
                                        canvas.addRelationship(
                                            sourceTable,
                                            targetTable,
                                            type,
                                        );
                                        saveToStorage(canvas.toJSON());
                                        updateUndoRedoButtons();
                                    },
                                    {
                                        name: `${oneTable.name.toLowerCase()}_id`,
                                        type: "number",
                                        isPrimary: false,
                                        isForeignKey: true,
                                        references: oneTable.name,
                                    },
                                );
                            }
                        });
                    }
                }
            });
            canvas.render();
        }
        isCreatingRelationship = false;
        relationshipStart = null;

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
    window.updateZoomDisplay = function() {
        const zoomLevel = document.getElementById("zoomLevel");
        zoomLevel.textContent = `${Math.round(canvas.scale * 100)}%`;
    };

    function setZoomLevel(index) {
        canvas.zoomIndex = Math.max(0, Math.min(index, ZOOM_LEVELS.length - 1));
        canvas.scale = ZOOM_LEVELS[canvas.zoomIndex];
        canvas.render();
        updateZoomDisplay();
    }

    document.getElementById("zoomIn").addEventListener("click", () => {
        setZoomLevel(canvas.zoomIndex + 1);
    });

    document.getElementById("zoomOut").addEventListener("click", () => {
        setZoomLevel(canvas.zoomIndex - 1);
    });

    canvas.canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        setZoomLevel(canvas.zoomIndex + delta);
    });

    // Initialize zoom display
    updateZoomDisplay();

    // Add double-click handler for table name editing
    canvas.canvas.addEventListener("dblclick", (e) => {
        // Ignore double-click in readOnly mode
        if (isReadOnly) return;
        
        const pos = getCanvasPosition(e, canvas);

        canvas.tables.forEach((table) => {
            if (table.containsPoint(pos.x, pos.y)) {
                // Check if click is in the header area
                if (pos.y <= table.y + 40) {
                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = table.name;
                    input.style.position = "absolute";
                    input.style.left = `${(table.x + table.width / 2) * canvas.scale + canvas.offset.x - 75}px`;
                    input.style.top = `${(table.y + 10) * canvas.scale + canvas.offset.y}px`;
                    input.style.width = "150px";
                    input.style.textAlign = "center";
                    input.style.font = "bold 16px Arial";
                    input.style.border = "2px solid var(--bs-primary)";
                    input.style.borderRadius = "4px";
                    input.style.padding = "2px";
                    input.style.zIndex = "1000";

                    document.body.appendChild(input);
                    input.focus();
                    input.select();

                    table.isEditingName = true;

                    let isProcessingEdit = false;

                    const finishEditing = () => {
                        if (isProcessingEdit) return;
                        isProcessingEdit = true;

                        const newName = input.value.trim();
                        if (newName) {
                            // Check for duplicate names (case-insensitive)
                            const normalizedName = newName.toLowerCase();
                            const exists = Array.from(
                                canvas.tables.values(),
                            ).some(
                                (t) =>
                                    t.id !== table.id && // Compare IDs instead of references
                                    t.name.toLowerCase() === normalizedName,
                            );

                            if (exists) {
                                showSnackbar(
                                    "A table with this name already exists",
                                );
                                input.focus();
                                isProcessingEdit = false;
                                return;
                            }

                            table.name = newName;
                            saveToStorage(canvas.toJSON());
                        }

                        table.isEditingName = false;
                        if (document.body.contains(input)) {
                            document.body.removeChild(input);
                        }
                        canvas.render();
                        isProcessingEdit = false;
                    };

                    const cancelEditing = () => {
                        if (isProcessingEdit) return;
                        isProcessingEdit = true;

                        table.isEditingName = false;
                        if (document.body.contains(input)) {
                            document.body.removeChild(input);
                        }
                        canvas.render();
                        isProcessingEdit = false;
                    };

                    input.addEventListener("blur", finishEditing);
                    input.addEventListener("keydown", (e) => {
                        if (e.key === "Enter") {
                            finishEditing();
                        }
                        if (e.key === "Escape") {
                            cancelEditing();
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

    points.forEach((point) => {
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
        y: (event.clientY - rect.top - canvas.offset.y) / canvas.scale,
    };
}

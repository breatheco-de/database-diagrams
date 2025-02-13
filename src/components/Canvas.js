import { Table } from './Table';
import { Relationship } from './Relationship';
import { GRID_SIZE, ZOOM_LEVELS, DEFAULT_ZOOM_INDEX } from '../utils/constants';
import { HistoryManager, createAddTableCommand, createAddRelationshipCommand } from '../utils/history';
import { showSnackbar } from '../utils/ui';

export class Canvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tables = new Map();
        this.relationships = new Set();
        this.offset = { x: 0, y: 0 };
        this.zoomIndex = DEFAULT_ZOOM_INDEX;
        this.scale = ZOOM_LEVELS[this.zoomIndex];
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.history = new HistoryManager();
        
        this.resize();
        this.setupGrid();
        this.render();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    setupGrid() {
        const gridPattern = document.createElement('canvas');
        gridPattern.width = GRID_SIZE;
        gridPattern.height = GRID_SIZE;
        const patternCtx = gridPattern.getContext('2d');
        
        patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        patternCtx.beginPath();
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(GRID_SIZE, 0);
        patternCtx.lineTo(GRID_SIZE, GRID_SIZE);
        patternCtx.stroke();
        
        this.gridPattern = this.ctx.createPattern(gridPattern, 'repeat');
    }

    render() {
        this.ctx.save();
        
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--canvas-bg');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.fillStyle = this.gridPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply transformations
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw relationships
        this.relationships.forEach(rel => rel.draw(this.ctx));
        
        // Draw tables
        this.tables.forEach(table => table.draw(this.ctx));
        
        this.ctx.restore();
    }

    addTable(name = 'New Table', x = null, y = null) {
        // Check for duplicate table names (case-insensitive)
        const normalizedName = name.toLowerCase();
        const exists = Array.from(this.tables.values()).some(table => 
            table.name.toLowerCase() === normalizedName
        );
        
        if (exists) {
            showSnackbar('A table with this name already exists');
            return null;
        }

        // Get visible viewport bounds
        const viewportBounds = {
            left: -this.offset.x / this.scale,
            top: -this.offset.y / this.scale,
            right: (this.canvas.width - this.offset.x) / this.scale,
            bottom: (this.canvas.height - this.offset.y) / this.scale
        };
        
        // If no position provided, calculate center of viewport
        if (x === null || y === null) {
            x = (viewportBounds.left + viewportBounds.right) / 2 - 100;
            y = (viewportBounds.top + viewportBounds.bottom) / 2 - 100;
        }
        
        // Find non-overlapping position
        let finalX = x;
        let finalY = y;
        let attempts = 0;
        const spacing = 30;
        
        while (this.isPositionOccupied(finalX, finalY) && attempts < 100) {
            // Spiral pattern for new positions
            const angle = attempts * 0.5;
            const radius = spacing * (1 + attempts * 0.2);
            finalX = x + radius * Math.cos(angle);
            finalY = y + radius * Math.sin(angle);
            attempts++;
        }
        
        // Create table at valid position
        const table = new Table(name, finalX, finalY);
        const command = createAddTableCommand(this, table);
        this.history.execute(command);
        return table;
    }

    // Add helper method to check for table overlap
    isPositionOccupied(x, y) {
        const padding = 20;
        for (const table of this.tables.values()) {
            if (x < table.x + table.width + padding &&
                x + 200 + padding > table.x && // 200 is default table width
                y < table.y + table.height + padding &&
                y + 100 + padding > table.y) { // 100 is minimum table height
                return true;
            }
        }
        return false;
    }

    addRelationship(sourceTable, targetTable, type) {
        const relationship = new Relationship(sourceTable, targetTable, type, this);
        const command = createAddRelationshipCommand(this, relationship);
        this.history.execute(command);
        return relationship;
    }

    toJSON() {
        return {
            tables: Array.from(this.tables.values()).map(t => t.toJSON()),
            viewState: {
                offset: this.offset || { x: 0, y: 0 },
                scale: this.scale || ZOOM_LEVELS[DEFAULT_ZOOM_INDEX],
                zoomIndex: this.zoomIndex || DEFAULT_ZOOM_INDEX
            }
        };
    }

    loadDiagram(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid diagram data:', data);
            return;
        }

        this.tables.clear();
        this.relationships.clear();
        this.history.clear();  // Clear history when loading new diagram
        
        // Reset view state to defaults first
        this.offset = { x: 0, y: 0 };
        this.scale = ZOOM_LEVELS[DEFAULT_ZOOM_INDEX];
        this.zoomIndex = DEFAULT_ZOOM_INDEX;

        // Then load view state if present
        if (data.viewState) {
            this.offset = data.viewState.offset || this.offset;
            this.scale = data.viewState.scale || this.scale;
            this.zoomIndex = data.viewState.zoomIndex || this.zoomIndex;
        }
        
        // Load tables and create relationships from foreign key references
        if (Array.isArray(data.tables)) {
            // First pass: Create all tables
            data.tables.forEach(tableData => {
                const table = new Table(
                    tableData.name,
                    tableData.x,
                    tableData.y,
                    tableData.attributes || []
                );
                table.id = tableData.id || table.id;
                this.tables.set(table.id, table);
                table.updateHeight();
            });
            
            // Second pass: Create relationships from foreign key references
            this.tables.forEach(table => {
                table.attributes.forEach(attr => {
                    if (attr.references && attr.references.includes('.')) {
                        const [targetTableName, targetKeyName] = attr.references.split('.');
                        // Find referenced table by name
                        const referencedTable = Array.from(this.tables.values())
                            .find(t => t.name === targetTableName);
                            
                        if (referencedTable) {
                            // Create one-to-many relationship
                            const relationship = new Relationship(
                                referencedTable, // source (referenced table)
                                table,          // target (table with foreign key)
                                "oneToMany",    // type
                                this
                            );
                            this.relationships.add(relationship);
                        }
                    }
                });
            });
        }
        
        this.render();
    }

    // Alias for loadDiagram to maintain consistent naming with export methods
    loadFromJSON(data) {
        this.loadDiagram(data);
    }

    exportAsImage(filename = 'erd-diagram.png') {
        // Create a temporary canvas with the current diagram
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Calculate the bounds of all tables
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        this.tables.forEach(table => {
            minX = Math.min(minX, table.x);
            minY = Math.min(minY, table.y);
            maxX = Math.max(maxX, table.x + table.width);
            maxY = Math.max(maxY, table.y + table.height);
        });
        
        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        // Set canvas size to fit the diagram
        tempCanvas.width = maxX - minX;
        tempCanvas.height = maxY - minY;
        
        // Fill background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Translate context to move diagram into view
        tempCtx.translate(-minX, -minY);
        
        // Draw relationships
        this.relationships.forEach(rel => rel.draw(tempCtx));
        
        // Draw tables
        this.tables.forEach(table => table.draw(tempCtx));
        
        // Create download link
        const link = document.createElement('a');
        link.download = filename;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }
}
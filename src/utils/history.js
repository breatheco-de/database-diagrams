class Command {
    constructor(execute, undo) {
        this.execute = execute;
        this.undo = undo;
    }
}

export class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
    }

    execute(command) {
        // Remove any future redoable actions
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Execute the command and add it to history
        command.execute();
        this.history.push(command);
        this.currentIndex++;
    }

    undo() {
        if (this.canUndo()) {
            const command = this.history[this.currentIndex];
            command.undo();
            this.currentIndex--;
            return true;
        }
        return false;
    }

    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            command.execute();
            return true;
        }
        return false;
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
}

// Command creators
export function createAddTableCommand(canvas, table) {
    return new Command(
        () => {
            canvas.tables.set(table.id, table);
            canvas.render();
        },
        () => {
            canvas.tables.delete(table.id);
            canvas.render();
        }
    );
}

export function createMoveTableCommand(table, oldX, oldY, newX, newY) {
    return new Command(
        () => {
            table.x = newX;
            table.y = newY;
        },
        () => {
            table.x = oldX;
            table.y = oldY;
        }
    );
}

export function createAddRelationshipCommand(canvas, relationship) {
    return new Command(
        () => {
            canvas.relationships.add(relationship);
            canvas.render();
        },
        () => {
            canvas.relationships.delete(relationship);
            canvas.render();
        }
    );
}

export function createAddAttributeCommand(table, attribute) {
    return new Command(
        () => {
            table.attributes.push(attribute);
            table.updateHeight();
        },
        () => {
            const index = table.attributes.findIndex(a => 
                a.name === attribute.name && 
                a.type === attribute.type && 
                a.isPrimary === attribute.isPrimary
            );
            if (index !== -1) {
                table.attributes.splice(index, 1);
                table.updateHeight();
            }
        }
    );
}

export function createDeleteTableCommand(canvas, table) {
    const relationships = Array.from(canvas.relationships)
        .filter(rel => rel.sourceTable === table || rel.targetTable === table);
    
    return new Command(
        () => {
            // Remove connected relationships
            relationships.forEach(rel => canvas.relationships.delete(rel));
            // Remove table
            canvas.tables.delete(table.id);
            canvas.render();
        },
        () => {
            // Restore table
            canvas.tables.set(table.id, table);
            // Restore relationships
            relationships.forEach(rel => canvas.relationships.add(rel));
            canvas.render();
        }
    );
}

import { generateId } from '../utils/constants';

export class Table {
    constructor(name = 'New Table', x = 100, y = 100, attributes = []) {
        this.id = generateId();
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 200;
        this.height = 40;
        this.attributes = attributes;
        this.isHovered = false;
        this.isEditingName = false;
        this.updateHeight();
    }

    updateHeight() {
        // Base height (header) + height per attribute + padding
        this.height = 40 + (this.attributes.length * 30) + 40;
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        // Draw table background
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'var(--bs-border-color)';
        ctx.lineWidth = 1;
        
        // Main rectangle with rounded corners
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 4);
        ctx.fill();
        ctx.stroke();
        
        // Draw table name
        if (this.isEditingName) {
            // Skip drawing the name text when in edit mode
            // The input field will be handled by DOM
        } else {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x + this.width / 2, this.y + 25);
            
            // Draw delete button (trash can icon)
            ctx.fillStyle = 'var(--bs-danger)';
            ctx.font = '14px FontAwesome';
            ctx.textAlign = 'center';
            const deleteBtn = {
                x: this.x + this.width - 20,
                y: this.y + 20,
                width: 16,
                height: 16
            };
            ctx.fillText('', deleteBtn.x, deleteBtn.y); // fa-trash unicode
        }
        
        // Draw separator line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 40);
        ctx.lineTo(this.x + this.width, this.y + 40);
        ctx.stroke();
        
        // Draw attributes
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        this.attributes.forEach((attr, index) => {
            const yPos = this.y + 65 + (index * 30);
            // Draw attribute icon (key for primary)
            const icon = attr.isPrimary ? '🔑 ' : '';
            ctx.fillText(
                `${icon}${attr.name}: ${attr.type}`,
                this.x + 15,
                yPos
            );
        });
        
        // Draw add attribute button
        const buttonY = this.y + this.height - 25;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, buttonY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--bs-primary)';
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('+', this.x + this.width / 2, buttonY + 5);

        // Draw connection points only when hovered
        if (this.isHovered) {
            this.getConnectionPoints().forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.strokeStyle = 'var(--bs-primary)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            });
        }
    }

    getConnectionPoints() {
        const points = [];
        const connectionPoints = [
            { x: this.x + this.width / 2, y: this.y, position: 'top' },
            { x: this.x + this.width / 2, y: this.y + this.height, position: 'bottom' },
            { x: this.x, y: this.y + this.height / 2, position: 'left' },
            { x: this.x + this.width, y: this.y + this.height / 2, position: 'right' }
        ];
        
        connectionPoints.forEach(point => {
            points.push({
                x: point.x,
                y: point.y,
                position: point.position
            });
        });
        
        return points;
    }

    isAddButtonClicked(x, y) {
        const buttonY = this.y + this.height - 25;
        const buttonX = this.x + this.width / 2;
        const radius = 10;
        return Math.hypot(x - buttonX, y - buttonY) <= radius;
    }

    addAttribute(name, type = 'string', isPrimary = false) {
        this.attributes.push({ name, type, isPrimary });
        this.updateHeight();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            attributes: this.attributes
        };
    }
}

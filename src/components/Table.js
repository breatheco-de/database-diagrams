import { generateId } from '../utils/constants';

export class Table {
    constructor(name, x, y, attributes = []) {
        this.id = generateId();
        this.name = name;
        this.x = x;
        this.y = y;
        this.attributes = attributes;
        this.width = 200;
        this.height = 40 + (attributes.length * 30);
    }

    draw(ctx) {
        // Draw table header
        ctx.fillStyle = 'var(--bs-secondary)';
        ctx.fillRect(this.x, this.y, this.width, 40);
        
        // Draw table body
        ctx.fillStyle = 'var(--bs-dark)';
        ctx.fillRect(this.x, this.y + 40, this.width, this.height - 40);
        
        // Draw table name
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.name,
            this.x + this.width / 2,
            this.y + 25
        );
        
        // Draw attributes
        ctx.textAlign = 'left';
        this.attributes.forEach((attr, index) => {
            ctx.fillText(
                attr.name,
                this.x + 10,
                this.y + 65 + (index * 30)
            );
        });
        
        // Draw connection points
        this.drawConnectionPoints(ctx);
    }

    drawConnectionPoints(ctx) {
        const points = this.getConnectionPoints();
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'var(--bs-primary)';
            ctx.fill();
        });
    }

    getConnectionPoints() {
        return [
            { x: this.x, y: this.y + this.height / 2 }, // Left
            { x: this.x + this.width, y: this.y + this.height / 2 }, // Right
            { x: this.x + this.width / 2, y: this.y }, // Top
            { x: this.x + this.width / 2, y: this.y + this.height } // Bottom
        ];
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    addAttribute(name, type = 'string', isPrimary = false) {
        this.attributes.push({ name, type, isPrimary });
        this.height = 40 + (this.attributes.length * 30);
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

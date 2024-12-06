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
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width / 2, this.y + 25);
        
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
    }

    getConnectionPoints() {
        const points = [];
        // Top center
        points.push({ x: this.x + this.width / 2, y: this.y });
        // Bottom center
        points.push({ x: this.x + this.width / 2, y: this.y + this.height });
        // Left center
        points.push({ x: this.x, y: this.y + this.height / 2 });
        // Right center
        points.push({ x: this.x + this.width, y: this.y + this.height / 2 });
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

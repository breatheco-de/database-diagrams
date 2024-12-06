export class Table {
    constructor(name = 'New Table', x = 100, y = 100, attributes = []) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 200;
        this.height = 100;
        this.attributes = attributes;
        this.isHovered = false;
        this.updateHeight();
    }

    updateHeight() {
        // Base height for table name
        let height = 40;
        // Height for attributes
        height += this.attributes.length * 30;
        // Height for add button
        height += 30;
        this.height = height;
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        // Draw table background
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw table border
        ctx.strokeStyle = 'var(--bs-primary)';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw table name
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width / 2, this.y + 25);
        
        // Draw horizontal line under name
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 40);
        ctx.lineTo(this.x + this.width, this.y + 40);
        ctx.stroke();
        
        // Draw attributes
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        this.attributes.forEach((attr, index) => {
            const y = this.y + 65 + (index * 30);
            // Draw primary key indicator
            if (attr.isPrimary) {
                ctx.fillText('🔑', this.x + 10, y);
                ctx.fillText(attr.name, this.x + 35, y);
            } else {
                ctx.fillText(attr.name, this.x + 10, y);
            }
            // Draw attribute type
            ctx.textAlign = 'right';
            ctx.fillText(attr.type, this.x + this.width - 10, y);
            ctx.textAlign = 'left';
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
        
        // Draw connection points and trash icon only when hovered
        if (this.isHovered) {
            // Draw trash can icon
            const trashIconSize = 20;
            const trashX = this.x + this.width - trashIconSize - 10;
            const trashY = this.y + this.height - trashIconSize - 10;
            
            ctx.font = '16px "Font Awesome 6 Free"';
            ctx.fontWeight = '900';  // Required for solid icons
            ctx.fillStyle = 'var(--bs-danger)';
            ctx.fillText('', trashX, trashY);  // Unicode for trash icon
            this.drawConnectionPoints(ctx);
        }
    }

    drawConnectionPoints(ctx) {
        const points = this.getConnectionPoints();
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'var(--bs-primary)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        });
    }

    getConnectionPoints() {
        const points = [
            // Top center
            { x: this.x + this.width / 2, y: this.y, position: 'top' },
            // Bottom center
            { x: this.x + this.width / 2, y: this.y + this.height, position: 'bottom' },
            // Left center
            { x: this.x, y: this.y + this.height / 2, position: 'left' },
            // Right center
            { x: this.x + this.width, y: this.y + this.height / 2, position: 'right' }
        ];
        return points;
    }
        
    isTrashIconClicked(x, y) {
        const trashIconSize = 20;
        const trashX = this.x + this.width - trashIconSize - 10;
        const trashY = this.y + this.height - trashIconSize - 10;
        
        return x >= trashX && x <= trashX + trashIconSize &&
               y >= trashY && y <= trashY + trashIconSize;
    }

    isTableNameClicked(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + 40;
    }

    isAttributeClicked(x, y) {
        if (x >= this.x && x <= this.x + this.width) {
            const attributeY = y - (this.y + 40);
            if (attributeY > 0) {
                const index = Math.floor((attributeY - 25) / 30);
                if (index >= 0 && index < this.attributes.length) {
                    return index;
                }
            }
        }
        return -1;
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

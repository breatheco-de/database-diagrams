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
            ctx.fillText('\uf1f8', deleteBtn.x, deleteBtn.y); // fa-trash unicode
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
            
            // Draw edit pencil icon
            ctx.font = '14px FontAwesome';
            ctx.fillStyle = 'var(--bs-primary)';
            ctx.fillText('\uf040', this.x + this.width - 25, yPos); // fa-pencil unicode
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
        const numPointsPerSide = 3; // Number of points on each side
        
        // Top points
        for (let i = 0; i < numPointsPerSide; i++) {
            points.push({
                x: this.x + (this.width * (i + 1)) / (numPointsPerSide + 1),
                y: this.y,
                position: 'top'
            });
        }
        
        // Bottom points
        for (let i = 0; i < numPointsPerSide; i++) {
            points.push({
                x: this.x + (this.width * (i + 1)) / (numPointsPerSide + 1),
                y: this.y + this.height,
                position: 'bottom'
            });
        }
        
        // Left points
        for (let i = 0; i < numPointsPerSide; i++) {
            points.push({
                x: this.x,
                y: this.y + (this.height * (i + 1)) / (numPointsPerSide + 1),
                position: 'left'
            });
        }
        
        // Right points
        for (let i = 0; i < numPointsPerSide; i++) {
            points.push({
                x: this.x + this.width,
                y: this.y + (this.height * (i + 1)) / (numPointsPerSide + 1),
                position: 'right'
            });
        }
        
        return points;
    }
    
    isEditIconClicked(x, y) {
        const attributes = this.attributes;
        for (let i = 0; i < attributes.length; i++) {
            const yPos = this.y + 65 + (i * 30);
            // Adjust icon position to better align with the text
            const iconX = this.x + this.width - 25;
            const iconY = yPos - 12;
            
            // Define a more precise click detection area
            const clickArea = {
                left: iconX - 10,
                right: iconX + 10,
                top: iconY - 8,
                bottom: iconY + 8
            };

            if (x >= clickArea.left && x <= clickArea.right &&
                y >= clickArea.top && y <= clickArea.bottom) {
                return i;
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

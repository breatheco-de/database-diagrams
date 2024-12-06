export class Relationship {
    constructor(sourceTable, targetTable, type = 'oneToMany') {
        this.sourceTable = sourceTable;
        this.targetTable = targetTable;
        this.type = type;
    }

    draw(ctx) {
        ctx.save();
        
        const source = this.getNearestPoints(
            this.sourceTable.getConnectionPoints(),
            this.targetTable.getConnectionPoints()
        );
        
        // Set line styles
        ctx.strokeStyle = '#0d6efd';
        ctx.lineWidth = 2;
        
        // Draw the main connection line
        ctx.beginPath();
        ctx.moveTo(source.start.x, source.start.y);
        ctx.lineTo(source.end.x, source.end.y);
        ctx.stroke();
        
        // Calculate angle for the endings
        const angle = Math.atan2(
            source.end.y - source.start.y,
            source.end.x - source.start.x
        );
        
        // Draw the appropriate ending based on relationship type
        switch(this.type) {
            case 'oneToMany':
                this.drawOneToMany(ctx, source.end, angle);
                break;
            case 'oneToOne':
                this.drawOneToOne(ctx, source.end, angle);
                break;
            case 'manyToMany':
                this.drawManyToMany(ctx, source.end, angle);
                break;
        }
        
        ctx.restore();
    }

    drawOneToOne(ctx, point, angle) {
        const length = 15;
        
        // Draw the main line
        ctx.beginPath();
        ctx.moveTo(point.x - length * Math.cos(angle), point.y - length * Math.sin(angle));
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.closePath();
        
        // Draw the vertical line
        const verticalOffset = 8;
        const x = point.x - (length - 5) * Math.cos(angle);
        const y = point.y - (length - 5) * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(
            x + verticalOffset * Math.sin(angle),
            y - verticalOffset * Math.cos(angle)
        );
        ctx.lineTo(
            x - verticalOffset * Math.sin(angle),
            y + verticalOffset * Math.cos(angle)
        );
        ctx.stroke();
        ctx.closePath();
    }

    drawOneToMany(ctx, point, angle) {
        const length = 15;
        const spread = Math.PI / 6;
        
        // Draw the three lines of the crow's foot
        ctx.beginPath();
        // Center line
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x - length * Math.cos(angle), point.y - length * Math.sin(angle));
        // Upper line
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
            point.x - length * Math.cos(angle - spread),
            point.y - length * Math.sin(angle - spread)
        );
        // Lower line
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
            point.x - length * Math.cos(angle + spread),
            point.y - length * Math.sin(angle + spread)
        );
        ctx.stroke();
    }

    drawManyToMany(ctx, point, angle) {
        // Draw first crow's foot
        this.drawOneToMany(ctx, point, angle);
        
        // Add second crow's foot
        const length = 15;
        const spread = Math.PI / 6;
        const offset = 10;
        const x = point.x - offset * Math.cos(angle);
        const y = point.y - offset * Math.sin(angle);
        
        // Draw upper line
        ctx.beginPath();
        ctx.moveTo(
            x - length * Math.cos(angle - spread),
            y - length * Math.sin(angle - spread)
        );
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
        
        // Draw lower line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - length * Math.cos(angle + spread),
            y - length * Math.sin(angle + spread)
        );
        ctx.stroke();
        ctx.closePath();
    }

    getNearestPoints(sourcePoints, targetPoints) {
        let minDistance = Infinity;
        let result = { start: null, end: null };
        
        sourcePoints.forEach(sp => {
            targetPoints.forEach(tp => {
                const distance = Math.hypot(tp.x - sp.x, tp.y - sp.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    result = { start: sp, end: tp };
                }
            });
        });
        
        return result;
    }

    toJSON() {
        return {
            sourceId: this.sourceTable.id,
            targetId: this.targetTable.id,
            type: this.type
        };
    }
}

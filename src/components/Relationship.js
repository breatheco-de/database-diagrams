export class Relationship {
    constructor(sourceTable, targetTable, type = 'oneToMany') {
        this.sourceTable = sourceTable;
        this.targetTable = targetTable;
        this.type = type;
    }

    draw(ctx) {
        const source = this.getNearestPoints(
            this.sourceTable.getConnectionPoints(),
            this.targetTable.getConnectionPoints()
        );
        
        ctx.beginPath();
        ctx.moveTo(source.start.x, source.start.y);
        ctx.lineTo(source.end.x, source.end.y);
        ctx.strokeStyle = 'var(--bs-primary)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        this.drawCrowFoot(ctx, source);
    }

    drawCrowFoot(ctx, points) {
        const angle = Math.atan2(
            points.end.y - points.start.y,
            points.end.x - points.start.x
        );
        
        ctx.beginPath();
        
        switch(this.type) {
            case 'oneToMany':
                this.drawOneToMany(ctx, points.end, angle);
                break;
            case 'oneToOne':
                this.drawOneToOne(ctx, points.end, angle);
                break;
            case 'manyToMany':
                this.drawManyToMany(ctx, points.end, angle);
                break;
        }
        
        ctx.stroke();
    }

    drawOneToMany(ctx, point, angle) {
        const length = 15;
        const spread = Math.PI / 6;
        
        ctx.moveTo(
            point.x - length * Math.cos(angle - spread),
            point.y - length * Math.sin(angle - spread)
        );
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(
            point.x - length * Math.cos(angle + spread),
            point.y - length * Math.sin(angle + spread)
        );
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

export class Relationship {
    constructor(sourceTable, targetTable, type = "oneToMany", canvas = null) {
        this.sourceTable = sourceTable;
        this.targetTable = targetTable;
        this.type = type;
        this.canvas = canvas || sourceTable?.canvas || targetTable?.canvas;
    }

    draw(ctx) {
        const source = this.getNearestPoints(
            this.sourceTable.getConnectionPoints(),
            this.targetTable.getConnectionPoints(),
        );

        // Get path points avoiding tables
        const pathPoints = this.getPathAvoidingTables(source.start, source.end);

        // Draw the path
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.strokeStyle = "var(--bs-warning)"; // Use Bootstrap's warning color (orange)
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw crow's foot at the end point
        this.drawCrowFoot(ctx, {
            start: pathPoints[pathPoints.length - 2] || source.start,
            end: pathPoints[pathPoints.length - 1],
        });
    }

    getPathAvoidingTables(start, end) {
        // If no canvas or no other tables, return direct path
        if (!this.canvas || this.canvas.tables.size <= 2) {
            return [start, end];
        }

        const tables = Array.from(this.canvas.tables.values()).filter(
            (table) => table !== this.sourceTable && table !== this.targetTable,
        );

        // Check if direct path intersects any tables
        if (!this.pathIntersectsTables(start, end, tables)) {
            return [start, end];
        }

        // Find intermediate points to avoid tables
        const path = this.findPathAroundTables(start, end, tables);
        return path;
    }

    pathIntersectsTables(start, end, tables) {
        return tables.some((table) => {
            const rect = {
                left: table.x - 10,
                right: table.x + table.width + 10,
                top: table.y - 10,
                bottom: table.y + table.height + 10,
            };
            return this.lineIntersectsRect(start, end, rect);
        });
    }

    lineIntersectsRect(start, end, rect) {
        // Check if line segment intersects with rectangle
        const left = this.lineIntersectsLine(
            start,
            end,
            { x: rect.left, y: rect.top },
            { x: rect.left, y: rect.bottom },
        );
        const right = this.lineIntersectsLine(
            start,
            end,
            { x: rect.right, y: rect.top },
            { x: rect.right, y: rect.bottom },
        );
        const top = this.lineIntersectsLine(
            start,
            end,
            { x: rect.left, y: rect.top },
            { x: rect.right, y: rect.top },
        );
        const bottom = this.lineIntersectsLine(
            start,
            end,
            { x: rect.left, y: rect.bottom },
            { x: rect.right, y: rect.bottom },
        );

        return left || right || top || bottom;
    }

    lineIntersectsLine(a, b, c, d) {
        // Returns true if line segments AB and CD intersect
        const denominator =
            (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (denominator === 0) return false;

        const ua =
            ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) /
            denominator;
        const ub =
            ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) /
            denominator;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    findPathAroundTables(start, end, tables) {
        // Add padding to avoid tight corners
        const padding = 30;

        // Determine the direction of connection points
        const startPosition = start.position || "right";
        const endPosition = end.position || "left";

        // Calculate initial direction based on connection points
        let firstDirection, secondDirection;

        // Helper function to determine if we should go horizontal first
        const shouldGoHorizontalFirst = () => {
            // If start and end points are aligned vertically, prefer vertical path
            if (Math.abs(start.x - end.x) < padding) return false;

            // If points are on opposite sides horizontally, prefer horizontal path
            if (
                (startPosition === "right" && endPosition === "left") ||
                (startPosition === "left" && endPosition === "right")
            ) {
                return true;
            }

            // Default to the longer distance
            return Math.abs(end.x - start.x) > Math.abs(end.y - start.y);
        };

        const goHorizontal = shouldGoHorizontalFirst();

        // Generate path points based on the determined direction
        let pathPoints = [];
        if (goHorizontal) {
            // Horizontal first
            const midX = start.x + (end.x - start.x) / 2;
            pathPoints = [
                start,
                { x: midX, y: start.y },
                { x: midX, y: end.y },
                end,
            ];
        } else {
            // Vertical first
            const midY = start.y + (end.y - start.y) / 2;
            pathPoints = [
                start,
                { x: start.x, y: midY },
                { x: end.x, y: midY },
                end,
            ];
        }

        // Check if path intersects with any tables
        let hasIntersection = false;
        for (let i = 0; i < pathPoints.length - 1; i++) {
            if (
                this.pathIntersectsTables(
                    pathPoints[i],
                    pathPoints[i + 1],
                    tables,
                )
            ) {
                hasIntersection = true;
                break;
            }
        }

        // If there's an intersection, try alternative path
        if (hasIntersection) {
            if (goHorizontal) {
                // Try vertical first instead
                const midY = start.y + (end.y - start.y) / 2;
                pathPoints = [
                    start,
                    { x: start.x, y: midY },
                    { x: end.x, y: midY },
                    end,
                ];
            } else {
                // Try horizontal first instead
                const midX = start.x + (end.x - start.x) / 2;
                pathPoints = [
                    start,
                    { x: midX, y: start.y },
                    { x: midX, y: end.y },
                    end,
                ];
            }
        }

        // If still intersecting, add more intermediate points
        hasIntersection = false;
        for (let i = 0; i < pathPoints.length - 1; i++) {
            if (
                this.pathIntersectsTables(
                    pathPoints[i],
                    pathPoints[i + 1],
                    tables,
                )
            ) {
                hasIntersection = true;
                break;
            }
        }

        if (hasIntersection) {
            // Create a path that goes around using more points
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const midX1 = start.x + dx / 3;
            const midX2 = start.x + (dx * 2) / 3;
            const midY1 = start.y + dy / 3;
            const midY2 = start.y + (dy * 2) / 3;

            pathPoints = [
                start,
                { x: midX1, y: start.y },
                { x: midX1, y: midY1 },
                { x: midX2, y: midY2 },
                { x: midX2, y: end.y },
                end,
            ];
        }

        return this.simplifyPath(pathPoints);
    }

    simplifyPath(path) {
        if (path.length <= 2) return path;

        const result = [path[0]];
        let current = path[0];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const next = path[i + 1];
            const point = path[i];

            // Skip point if it's collinear with previous and next points
            if (
                (point.x === prev.x && point.x === next.x) ||
                (point.y === prev.y && point.y === next.y)
            ) {
                continue;
            }

            result.push(point);
        }

        result.push(path[path.length - 1]);
        return result;
    }

    getPathLength(path) {
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            length += Math.hypot(
                path[i].x - path[i - 1].x,
                path[i].y - path[i - 1].y,
            );
        }
        return length;
    }

    drawCrowFoot(ctx, points) {
        const angle = Math.atan2(
            points.end.y - points.start.y,
            points.end.x - points.start.x,
        );

        ctx.beginPath();

        switch (this.type) {
            case "oneToMany":
                this.drawOneToMany(ctx, points.end, angle);
                break;
            case "oneToOne":
                this.drawOneToOne(ctx, points.end, angle);
                break;
            case "manyToMany":
                this.drawManyToMany(ctx, points.end, angle);
                break;
        }

        ctx.stroke();
    }

    drawOneToOne(ctx, point, angle) {
        const length = 15;
        ctx.moveTo(
            point.x - length * Math.cos(angle),
            point.y - length * Math.sin(angle),
        );
        ctx.lineTo(point.x, point.y);

        // Draw the vertical line
        const verticalOffset = 8;
        const x = point.x - (length - 5) * Math.cos(angle);
        const y = point.y - (length - 5) * Math.sin(angle);
        ctx.moveTo(
            x + verticalOffset * Math.sin(angle),
            y - verticalOffset * Math.cos(angle),
        );
        ctx.lineTo(
            x - verticalOffset * Math.sin(angle),
            y + verticalOffset * Math.cos(angle),
        );
    }

    drawOneToMany(ctx, point, angle) {
        const length = 40; // Base line length
        const footLength = length * 0.6; // Shorter feet for better proportion
        const spread = Math.PI / 6; // 30 degrees spread for more natural V shape

        // Draw the base line
        ctx.strokeStyle = "var(--bs-warning)"; // Set to orange
        ctx.moveTo(point.x, point.y);
        const baseEndX = point.x - length * Math.cos(angle);
        const baseEndY = point.y - length * Math.sin(angle);
        ctx.lineTo(baseEndX, baseEndY);

        // Calculate the direction vector of the base line
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);

        // Calculate perpendicular vector for creating the V shape
        const perpX = -dirY;
        const perpY = dirX;

        // Calculate points for the V shape
        const footSpread = length * 0.5; // How wide the V spreads
        const vBaseX = baseEndX + footLength * dirX; // Move V base slightly forward
        const vBaseY = baseEndY + footLength * dirY;

        // Draw left foot
        ctx.moveTo(baseEndX, baseEndY);
        ctx.lineTo(vBaseX + footSpread * perpX, vBaseY + footSpread * perpY);

        // Draw right foot
        ctx.moveTo(baseEndX, baseEndY);
        ctx.lineTo(vBaseX - footSpread * perpX, vBaseY - footSpread * perpY);
    }

    drawManyToMany(ctx, point, angle) {
        this.drawOneToMany(ctx, point, angle);

        // Add second crow's foot
        const length = 15;
        const spread = Math.PI / 4;
        const offset = 10;
        const x = point.x - offset * Math.cos(angle);
        const y = point.y - offset * Math.sin(angle);

        ctx.moveTo(
            x - length * Math.cos(angle - spread),
            y - length * Math.sin(angle - spread),
        );
        ctx.lineTo(x, y);
        ctx.lineTo(
            x - length * Math.cos(angle + spread),
            y - length * Math.sin(angle + spread),
        );
    }

    getNearestPoints(sourcePoints, targetPoints) {
        let minDistance = Infinity;
        let result = { start: null, end: null };

        // Get all existing relationships, or empty array if canvas not available
        const relationships = this.canvas
            ? Array.from(this.canvas.relationships)
            : [];

        // Track used points for each table pair
        const usedPoints = new Map();

        // First pass: collect all current connection points usage
        relationships.forEach((rel) => {
            if (rel !== this) {
                const tablePairKey = `${rel.sourceTable.id}-${rel.targetTable.id}`;
                const reversePairKey = `${rel.targetTable.id}-${rel.sourceTable.id}`;
                
                if (!usedPoints.has(tablePairKey)) {
                    usedPoints.set(tablePairKey, new Set());
                }
                if (!usedPoints.has(reversePairKey)) {
                    usedPoints.set(reversePairKey, new Set());
                }

                // Create point keys based on coordinates only
                const sourceX = rel.sourceTable.x + rel.sourceTable.width / 2;
                const sourceY = rel.sourceTable.y + rel.sourceTable.height / 2;
                const targetX = rel.targetTable.x + rel.targetTable.width / 2;
                const targetY = rel.targetTable.y + rel.targetTable.height / 2;

                const sourceKey = `${rel.sourceTable.id},${Math.round(sourceX)},${Math.round(sourceY)}`;
                const targetKey = `${rel.targetTable.id},${Math.round(targetX)},${Math.round(targetY)}`;

                usedPoints.get(tablePairKey).add(sourceKey);
                usedPoints.get(tablePairKey).add(targetKey);
                usedPoints.get(reversePairKey).add(sourceKey);
                usedPoints.get(reversePairKey).add(targetKey);
            }
        });

        // Get the current table pair key
        const currentPairKey = `${this.sourceTable.id}-${this.targetTable.id}`;
        const currentUsedPoints = usedPoints.get(currentPairKey) || new Set();

        // Find the best connection points considering existing relationships
        sourcePoints.forEach((sp) => {
            targetPoints.forEach((tp) => {
                const sourceKey = `${this.sourceTable.id},${Math.round(sp.x)},${Math.round(sp.y)}`;
                const targetKey = `${this.targetTable.id},${Math.round(tp.x)},${Math.round(tp.y)}`;
                
                const distance = Math.hypot(tp.x - sp.x, tp.y - sp.y);
                
                // Calculate angle score (prefer points that maintain better angles)
                const angle = Math.atan2(tp.y - sp.y, tp.x - sp.x);
                const angleScore = Math.abs(angle % (Math.PI / 2)); // Prefer horizontal/vertical connections
                
                // Heavy penalty for points already used in relationships between these tables
                const usagePenalty = 
                    (currentUsedPoints.has(sourceKey) ? 200 : 0) +
                    (currentUsedPoints.has(targetKey) ? 200 : 0);
                
                // Additional penalty for non-optimal point positions
                const positionPenalty = 
                    (sp.position === 'top' || sp.position === 'bottom' ? 50 : 0) +
                    (tp.position === 'top' || tp.position === 'bottom' ? 50 : 0);
                
                const totalScore = distance + angleScore * 50 + usagePenalty + positionPenalty;

                if (totalScore < minDistance) {
                    minDistance = totalScore;
                    result = { start: sp, end: tp };
                }
            });
        });

        return result;
    }

    containsPoint(x, y) {
        // Get the actual connection points being used
        const points = this.getNearestPoints(
            this.sourceTable.getConnectionPoints(),
            this.targetTable.getConnectionPoints(),
        );

        // Calculate distance from point to line segment
        const distanceToSegment = this.pointToLineDistance(
            x,
            y,
            points.start.x,
            points.start.y,
            points.end.x,
            points.end.y,
        );

        // Return true if point is within 5 pixels of the line
        return distanceToSegment < 5;
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    toJSON() {
        return {
            sourceId: this.sourceTable.id,
            targetId: this.targetTable.id,
            type: this.type,
        };
    }
}

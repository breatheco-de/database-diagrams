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

        // Get existing relationships between these tables
        const parallelRelationships = Array.from(
            this.canvas.relationships,
        ).filter(
            (rel) =>
                rel !== this &&
                ((rel.sourceTable === this.sourceTable &&
                    rel.targetTable === this.targetTable) ||
                    (rel.sourceTable === this.targetTable &&
                        rel.targetTable === this.sourceTable)),
        );

        // Calculate path offset based on the number of parallel relationships
        const relationshipIndex = parallelRelationships.indexOf(this);
        // Increase base offset and alternate sides for better separation
        const baseOffset = 40; // Increased from 20
        const offset =
            relationshipIndex >= 0
                ? (Math.floor(relationshipIndex / 2) + 1) *
                  baseOffset *
                  (relationshipIndex % 2 === 0 ? 1 : -1)
                : 0;

        // Adjust start and end points for parallel paths
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;

        // Apply offset with position-based adjustments
        let offsetStart = {
            x: start.x + offset * Math.cos(perpAngle),
            y: start.y + offset * Math.sin(perpAngle),
            position: start.position,
        };

        let offsetEnd = {
            x: end.x + offset * Math.cos(perpAngle),
            y: end.y + offset * Math.sin(perpAngle),
            position: end.position,
        };

        // Adjust offset based on connection point positions
        if (start.position === "left" || start.position === "right") {
            offsetStart.y = start.y;
        } else if (start.position === "top" || start.position === "bottom") {
            offsetStart.x = start.x;
        }

        if (end.position === "left" || end.position === "right") {
            offsetEnd.y = end.y;
        } else if (end.position === "top" || end.position === "bottom") {
            offsetEnd.x = end.x;
        }

        // Check if direct path intersects any tables
        if (!this.pathIntersectsTables(offsetStart, offsetEnd, tables)) {
            return [offsetStart, offsetEnd];
        }

        // Find intermediate points to avoid tables
        const path = this.findPathAroundTables(offsetStart, offsetEnd, tables);
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
        const padding = 40; // Increased padding for better separation

        // Determine the direction of connection points
        const startPosition = start.position || "right";
        const endPosition = end.position || "left";

        // Helper function to determine if we should go horizontal first
        const shouldGoHorizontalFirst = () => {
            // If points are on opposite sides horizontally, prefer horizontal path
            if (
                (startPosition === "right" && endPosition === "left") ||
                (startPosition === "left" && endPosition === "right")
            ) {
                return true;
            }

            // If start and end points are aligned vertically (with some tolerance)
            if (Math.abs(start.x - end.x) < padding * 2) {
                return false;
            }

            // For diagonal relationships, use the longer distance
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
        // Cache for existing relationship points
        if (!this.canvas) {
            return this.getSimpleNearestPoints(sourcePoints, targetPoints);
        }
        // Get existing relationships between these tables
        const existingRelationships = Array.from(
            this.canvas.relationships,
        ).filter(
            (rel) =>
                rel !== this &&
                ((rel.sourceTable.id === this.sourceTable.id &&
                    rel.targetTable.id === this.targetTable.id) ||
                    (rel.sourceTable.id === this.targetTable.id &&
                        rel.targetTable.id === this.sourceTable.id)),
        );

        console.log(existingRelationships);
        // Track used connection points
        const usedConnectionPoints = new Set();
        existingRelationships.forEach((rel) => {
            sourcePoints.forEach((sp) => {
                const key = `${Math.round(sp.x)},${Math.round(sp.y)}`;
                if (this.isPointNearConnection(sp, rel)) {
                    usedConnectionPoints.add(key);
                }
            });
            targetPoints.forEach((tp) => {
                const key = `${Math.round(tp.x)},${Math.round(tp.y)}`;
                if (this.isPointNearConnection(tp, rel)) {
                    usedConnectionPoints.add(key);
                }
            });
        });

        let bestPoints = { start: null, end: null };
        let minScore = Infinity;

        // Find best unused connection points
        sourcePoints.forEach((sp) => {
            const sourceKey = `${Math.round(sp.x)},${Math.round(sp.y)}`;
            const sourceUsed = usedConnectionPoints.has(sourceKey);

            targetPoints.forEach((tp) => {
                const targetKey = `${Math.round(tp.x)},${Math.round(tp.y)}`;
                const targetUsed = usedConnectionPoints.has(targetKey);

                const distance = Math.hypot(tp.x - sp.x, tp.y - sp.y);
                const angle = Math.atan2(tp.y - sp.y, tp.x - sp.x);

                // Scoring system
                let score = distance;

                // Prefer horizontal/vertical connections
                score += Math.abs(angle % (Math.PI / 2)) * 50;

                // Heavy penalty for used points
                if (sourceUsed) score += 500;
                if (targetUsed) score += 500;

                // Penalty for top/bottom connections
                if (sp.position === "top" || sp.position === "bottom")
                    score += 100;
                if (tp.position === "top" || tp.position === "bottom")
                    score += 100;

                if (score < minScore) {
                    minScore = score;
                    bestPoints = { start: sp, end: tp };
                }
            });
        });

        return bestPoints.start && bestPoints.end
            ? bestPoints
            : this.getSimpleNearestPoints(sourcePoints, targetPoints);
    }

    getSimpleNearestPoints(sourcePoints, targetPoints) {
        let bestPoints = { start: null, end: null };
        let minDistance = Infinity;

        sourcePoints.forEach((sp) => {
            targetPoints.forEach((tp) => {
                const distance = Math.hypot(tp.x - sp.x, tp.y - sp.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestPoints = { start: sp, end: tp };
                }
            });
        });

        return bestPoints;
    }

    isPointNearConnection(point, relationship) {
        const tolerance = 5; // pixels
        // Get actual connection points for the relationship
        const points = relationship.getNearestPoints(
            relationship.sourceTable.getConnectionPoints(),
            relationship.targetTable.getConnectionPoints()
        );

        return (
            Math.hypot(point.x - points.start.x, point.y - points.start.y) < tolerance ||
            Math.hypot(point.x - points.end.x, point.y - points.end.y) < tolerance
        );
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
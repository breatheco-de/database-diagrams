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
        ctx.strokeStyle = "var(--bs-primary)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw crow's foot at the end point
        this.drawCrowFoot(ctx, {
            start: pathPoints[pathPoints.length - 2] || source.start,
            end: pathPoints[pathPoints.length - 1]
        });
    }

    getPathAvoidingTables(start, end) {
        // If no canvas or no other tables, return direct path
        if (!this.canvas || this.canvas.tables.size <= 2) {
            return [start, end];
        }

        const tables = Array.from(this.canvas.tables.values())
            .filter(table => table !== this.sourceTable && table !== this.targetTable);

        // Check if direct path intersects any tables
        if (!this.pathIntersectsTables(start, end, tables)) {
            return [start, end];
        }

        // Find intermediate points to avoid tables
        const path = this.findPathAroundTables(start, end, tables);
        return path;
    }

    pathIntersectsTables(start, end, tables) {
        return tables.some(table => {
            const rect = {
                left: table.x - 10,
                right: table.x + table.width + 10,
                top: table.y - 10,
                bottom: table.y + table.height + 10
            };
            return this.lineIntersectsRect(start, end, rect);
        });
    }

    lineIntersectsRect(start, end, rect) {
        // Check if line segment intersects with rectangle
        const left = this.lineIntersectsLine(
            start, end,
            {x: rect.left, y: rect.top},
            {x: rect.left, y: rect.bottom}
        );
        const right = this.lineIntersectsLine(
            start, end,
            {x: rect.right, y: rect.top},
            {x: rect.right, y: rect.bottom}
        );
        const top = this.lineIntersectsLine(
            start, end,
            {x: rect.left, y: rect.top},
            {x: rect.right, y: rect.top}
        );
        const bottom = this.lineIntersectsLine(
            start, end,
            {x: rect.left, y: rect.bottom},
            {x: rect.right, y: rect.bottom}
        );

        return left || right || top || bottom;
    }

    lineIntersectsLine(a, b, c, d) {
        // Returns true if line segments AB and CD intersect
        const denominator = ((b.x - a.x) * (d.y - c.y)) - ((b.y - a.y) * (d.x - c.x));
        if (denominator === 0) return false;

        const ua = (((c.x - a.x) * (d.y - c.y)) - ((c.y - a.y) * (d.x - c.x))) / denominator;
        const ub = (((c.x - a.x) * (b.y - a.y)) - ((c.y - a.y) * (b.x - a.x))) / denominator;

        return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
    }

    findPathAroundTables(start, end, tables) {
        // Calculate direction vectors
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // Initialize path arrays for different routing options
        const paths = [];
        
        // Try both horizontal-first and vertical-first paths
        const horizontalFirst = [
            start,
            { x: start.x + dx, y: start.y },
            end
        ];
        
        const verticalFirst = [
            start,
            { x: start.x, y: start.y + dy },
            end
        ];
        
        // Check which path is better based on intersection and length
        const horizontalValid = !this.pathIntersectsTables(horizontalFirst[0], horizontalFirst[1], tables) &&
                              !this.pathIntersectsTables(horizontalFirst[1], horizontalFirst[2], tables);
        
        const verticalValid = !this.pathIntersectsTables(verticalFirst[0], verticalFirst[1], tables) &&
                            !this.pathIntersectsTables(verticalFirst[1], verticalFirst[2], tables);
        
        // Add valid paths to options
        if (horizontalValid) paths.push(horizontalFirst);
        if (verticalValid) paths.push(verticalFirst);
        
        // If no simple path works, try middle point routing
        if (paths.length === 0) {
            const midX = start.x + dx / 2;
            const midY = start.y + dy / 2;
            
            // Try routing through middle point
            const middleRoute = [
                start,
                { x: midX, y: start.y },
                { x: midX, y: midY },
                { x: midX, y: end.y },
                { x: end.x, y: end.y }
            ];
            
            // Simplify path by removing unnecessary points
            const simplified = this.simplifyPath(middleRoute);
            
            // Check if simplified path is valid
            let isValid = true;
            for (let i = 0; i < simplified.length - 1; i++) {
                if (this.pathIntersectsTables(simplified[i], simplified[i + 1], tables)) {
                    isValid = false;
                    break;
                }
            }
            
            if (isValid) return simplified;
        }
        
        // Return the shortest valid path or default path
        if (paths.length > 0) {
            // Sort paths by total length
            paths.sort((a, b) => this.getPathLength(a) - this.getPathLength(b));
            return paths[0];
        }
        
        // Default to simple two-segment path if no valid path found
        return [
            start,
            { x: start.x, y: end.y },
            end
        ];
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
            if ((point.x === prev.x && point.x === next.x) ||
                (point.y === prev.y && point.y === next.y)) {
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
                path[i].x - path[i-1].x,
                path[i].y - path[i-1].y
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
        const length = 15;
        const spread = Math.PI / 6; // 30 degrees spread

        // Draw the base line
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
            point.x - length * Math.cos(angle),
            point.y - length * Math.sin(angle),
        );

        // Draw the upper line of the crow's foot
        ctx.moveTo(point.x - length * Math.cos(angle - spread), point.y);
        ctx.lineTo(point.x, point.y - length * Math.sin(angle - spread));

        // Draw the lower line of the crow's foot
        ctx.moveTo(point.x - length * Math.cos(angle + spread), point.y);
        ctx.lineTo(point.x, point.y - length * Math.sin(angle + spread));
    }

    drawManyToMany(ctx, point, angle) {
        this.drawOneToMany(ctx, point, angle);

        // Add second crow's foot
        const length = 15;
        const spread = Math.PI / 6;
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
        const relationships = this.canvas ? Array.from(this.canvas.relationships) : [];
        
        // Track used incoming points for each table with their relationships
        const usedIncomingPoints = new Map();
        
        // First pass: collect all current connection points usage
        relationships.forEach(rel => {
            if (rel !== this) {
                const targetId = rel.targetTable.id;
                if (!usedIncomingPoints.has(targetId)) {
                    usedIncomingPoints.set(targetId, new Map());
                }
                
                const tablePoints = rel.targetTable.getConnectionPoints();
                
                // Find the nearest point currently being used by this relationship
                let nearestPoint = null;
                let minDist = Infinity;
                
                tablePoints.forEach(point => {
                    const dist = Math.hypot(
                        point.x - (rel.sourceTable.x + rel.sourceTable.width/2),
                        point.y - (rel.sourceTable.y + rel.sourceTable.height/2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearestPoint = point;
                    }
                });
                
                if (nearestPoint) {
                    const pointKey = `${nearestPoint.x},${nearestPoint.y}`;
                    const relationshipsAtPoint = usedIncomingPoints.get(targetId).get(pointKey) || [];
                    relationshipsAtPoint.push(rel);
                    usedIncomingPoints.get(targetId).set(pointKey, relationshipsAtPoint);
                }
            }
        });

        // For the current relationship's target table
        const targetId = this.targetTable.id;
        const currentTablePoints = usedIncomingPoints.get(targetId) || new Map();
        
        // Find the best connection point considering angle and usage
        sourcePoints.forEach((sp) => {
            targetPoints.forEach((tp) => {
                const pointKey = `${tp.x},${tp.y}`;
                const relationshipsAtPoint = currentTablePoints.get(pointKey) || [];
                const distance = Math.hypot(tp.x - sp.x, tp.y - sp.y);
                
                // Calculate angle score (prefer points that maintain better angles)
                const angle = Math.atan2(tp.y - sp.y, tp.x - sp.x);
                const angleScore = Math.abs(angle % (Math.PI / 2)); // Prefer horizontal/vertical connections
                
                // Weighted score combining distance and angle
                const usagePenalty = relationshipsAtPoint.length * 100; // Heavy penalty for used points
                const totalScore = distance + angleScore * 50 + usagePenalty;
                
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
            this.targetTable.getConnectionPoints()
        );
        
        // Calculate distance from point to line segment
        const distanceToSegment = this.pointToLineDistance(
            x, y,
            points.start.x, points.start.y,
            points.end.x, points.end.y
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

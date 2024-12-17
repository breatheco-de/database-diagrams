export class Relationship {
    constructor(sourceTable, targetTable, type = "oneToMany", canvas = null) {
        this.sourceTable = sourceTable;
        this.targetTable = targetTable;
        this.type = type;
        this.canvas = canvas || sourceTable?.canvas || targetTable?.canvas;
        this.sourcePoint = null;
        this.targetPoint = null;
        this.cachedPath = null;
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

        // Draw arrows at the end point
        this.drawArrows(ctx, {
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

        // Determine the main direction of the path
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const isHorizontal = Math.abs(dx) > Math.abs(dy);

        // Create control points for the path
        let controlPoints = [];
        const spacing = 40; // Minimum spacing from tables

        if (isHorizontal) {
            // For horizontal paths
            const midX = start.x + dx / 2;
            
            // Check if direct path intersects any tables
            if (this.pathIntersectsTables(start, end, tables)) {
                // Create a path that goes around obstacles
                if (start.position === "right" && end.position === "left") {
                    // Standard case: right to left
                    controlPoints = [
                        start,
                        { x: midX, y: start.y },
                        { x: midX, y: end.y },
                        end
                    ];
                } else if (start.position === "left" && end.position === "right") {
                    // Reverse case: left to right
                    const offset = spacing * 2;
                    controlPoints = [
                        start,
                        { x: start.x - offset, y: start.y },
                        { x: start.x - offset, y: end.y },
                        end
                    ];
                } else {
                    // Other cases: create appropriate bends
                    controlPoints = [
                        start,
                        { x: start.x + dx/3, y: start.y },
                        { x: start.x + 2*dx/3, y: end.y },
                        end
                    ];
                }
            } else {
                controlPoints = [start, end];
            }
        } else {
            // For vertical paths
            const midY = start.y + dy / 2;
            
            // Check if direct path intersects any tables
            if (this.pathIntersectsTables(start, end, tables)) {
                // Create a path that goes around obstacles
                if (start.position === "bottom" && end.position === "top") {
                    // Standard case: bottom to top
                    controlPoints = [
                        start,
                        { x: start.x, y: midY },
                        { x: end.x, y: midY },
                        end
                    ];
                } else if (start.position === "top" && end.position === "bottom") {
                    // Reverse case: top to bottom
                    const offset = spacing * 2;
                    controlPoints = [
                        start,
                        { x: start.x, y: start.y - offset },
                        { x: end.x, y: start.y - offset },
                        end
                    ];
                } else {
                    // Other cases: create appropriate bends
                    controlPoints = [
                        start,
                        { x: start.x, y: start.y + dy/3 },
                        { x: end.x, y: start.y + 2*dy/3 },
                        end
                    ];
                }
            } else {
                controlPoints = [start, end];
            }
        }

        // Ensure the path doesn't intersect any tables
        if (this.hasPathIntersections(controlPoints, tables)) {
            // If path still intersects, try alternative route
            const alternativePath = this.findAlternativePath(start, end, tables);
            return alternativePath;
        }

        return controlPoints;
    }

    hasPathIntersections(points, tables) {
        for (let i = 0; i < points.length - 1; i++) {
            if (this.pathIntersectsTables(points[i], points[i + 1], tables)) {
                return true;
            }
        }
        return false;
    }

    findAlternativePath(start, end, tables) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const spacing = 60;

        // Try different offsets to find a clear path
        const offsets = [spacing, -spacing, spacing * 2, -spacing * 2];
        
        for (const offset of offsets) {
            let controlPoints;
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal alternative
                controlPoints = [
                    start,
                    { x: start.x + dx/3, y: start.y + offset },
                    { x: start.x + 2*dx/3, y: end.y + offset },
                    end
                ];
            } else {
                // Vertical alternative
                controlPoints = [
                    start,
                    { x: start.x + offset, y: start.y + dy/3 },
                    { x: end.x + offset, y: start.y + 2*dy/3 },
                    end
                ];
            }

            if (!this.hasPathIntersections(controlPoints, tables)) {
                return controlPoints;
            }
        }

        // If no clear path found, return direct path as fallback
        return [start, end];
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

    drawArrows(ctx, points) {
        const angle = Math.atan2(
            points.end.y - points.start.y,
            points.end.x - points.start.x,
        );

        ctx.beginPath();
        ctx.strokeStyle = "var(--bs-warning)";
        ctx.lineWidth = 2;

        switch (this.type) {
            case "oneToMany":
                this.drawOneToManyArrow(ctx, points.end, angle);
                break;
            case "oneToOne":
                this.drawOneToOneArrow(ctx, points.end, angle);
                break;
            case "manyToMany":
                this.drawManyToManyArrow(ctx, points.end, angle);
                break;
        }

        ctx.stroke();
    }

    drawOneToOneArrow(ctx, point, angle) {
        const arrowLength = 10; // Smaller arrow
        const arrowWidth = Math.PI / 8; // Narrower angle (22.5 degrees)
        
        // Draw simple arrow
        this.drawArrowHead(ctx, point, angle, arrowLength, arrowWidth);
        
        // Draw a small vertical line for "one"
        const verticalLength = 8;
        const verticalOffset = 15;
        const x = point.x - verticalOffset * Math.cos(angle);
        const y = point.y - verticalOffset * Math.sin(angle);
        
        ctx.moveTo(x - verticalLength/2 * Math.sin(angle), y + verticalLength/2 * Math.cos(angle));
        ctx.lineTo(x + verticalLength/2 * Math.sin(angle), y - verticalLength/2 * Math.cos(angle));
    }

    drawOneToManyArrow(ctx, point, angle) {
        // Draw two small arrows for "many"
        const arrowLength = 10;
        const arrowWidth = Math.PI / 8;
        const spacing = 5;
        
        // First arrow
        this.drawArrowHead(ctx, point, angle, arrowLength, arrowWidth);
        
        // Second arrow slightly behind
        const secondPoint = {
            x: point.x - spacing * Math.cos(angle),
            y: point.y - spacing * Math.sin(angle)
        };
        this.drawArrowHead(ctx, secondPoint, angle, arrowLength, arrowWidth);
        
        // Small vertical line for "one"
        const verticalLength = 8;
        const verticalOffset = 20;
        const x = point.x - verticalOffset * Math.cos(angle);
        const y = point.y - verticalOffset * Math.sin(angle);
        
        ctx.moveTo(x - verticalLength/2 * Math.sin(angle), y + verticalLength/2 * Math.cos(angle));
        ctx.lineTo(x + verticalLength/2 * Math.sin(angle), y - verticalLength/2 * Math.cos(angle));
    }

    drawManyToManyArrow(ctx, point, angle) {
        // Draw two sets of double arrows
        const arrowLength = 10;
        const arrowWidth = Math.PI / 8;
        const spacing = 5;
        const setSpacing = 15;
        
        // First set of arrows
        this.drawArrowHead(ctx, point, angle, arrowLength, arrowWidth);
        const secondPoint = {
            x: point.x - spacing * Math.cos(angle),
            y: point.y - spacing * Math.sin(angle)
        };
        this.drawArrowHead(ctx, secondPoint, angle, arrowLength, arrowWidth);
        
        // Second set of arrows
        const thirdPoint = {
            x: point.x - setSpacing * Math.cos(angle),
            y: point.y - setSpacing * Math.sin(angle)
        };
        this.drawArrowHead(ctx, thirdPoint, angle, arrowLength, arrowWidth);
        const fourthPoint = {
            x: thirdPoint.x - spacing * Math.cos(angle),
            y: thirdPoint.y - spacing * Math.sin(angle)
        };
        this.drawArrowHead(ctx, fourthPoint, angle, arrowLength, arrowWidth);
    }

    drawArrowHead(ctx, point, angle, length, width) {
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
            point.x - length * Math.cos(angle - width),
            point.y - length * Math.sin(angle - width)
        );
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
            point.x - length * Math.cos(angle + width),
            point.y - length * Math.sin(angle + width)
        );
    }

    getNearestPoints(sourcePoints, targetPoints) {
        // If no canvas context available, use simple point calculation
        if (!this.canvas) {
            return this.getSimpleNearestPoints(sourcePoints, targetPoints);
        }

        // Get parallel relationships between the same tables
        const parallelRelationships = Array.from(this.canvas.relationships).filter(
            (rel) =>
                rel !== this &&
                ((rel.sourceTable === this.sourceTable &&
                    rel.targetTable === this.targetTable) ||
                    (rel.sourceTable === this.targetTable &&
                        rel.targetTable === this.sourceTable))
        );

        // Calculate connection point usage without recursion
        const usedPoints = new Set();
        parallelRelationships.forEach(rel => {
            if (rel.sourcePoint && rel.targetPoint) {
                usedPoints.add(`${rel.sourcePoint.position}-${Math.round(rel.sourcePoint.y)}`);
                usedPoints.add(`${rel.targetPoint.position}-${Math.round(rel.targetPoint.y)}`);
            }
        });

        // Group connection points by side
        const sourceGroups = {
            left: sourcePoints.filter(p => p.position === "left"),
            right: sourcePoints.filter(p => p.position === "right"),
            top: sourcePoints.filter(p => p.position === "top"),
            bottom: sourcePoints.filter(p => p.position === "bottom")
        };

        const targetGroups = {
            left: targetPoints.filter(p => p.position === "left"),
            right: targetPoints.filter(p => p.position === "right"),
            top: targetPoints.filter(p => p.position === "top"),
            bottom: targetPoints.filter(p => p.position === "bottom")
        };

        // Calculate relative position between tables
        const dx = this.targetTable.x - this.sourceTable.x;
        const dy = this.targetTable.y - this.sourceTable.y;
        
        // Determine optimal connection sides based on table positions
        let sidePairs = [];
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Tables are more horizontal than vertical
            if (dx > 0) {
                // Target is to the right
                sidePairs = [
                    ["right", "left"],   // Horizontal connection
                    ["top", "top"],      // Top parallel
                    ["bottom", "bottom"], // Bottom parallel
                    ["right", "top"],     // Alternative angles
                    ["right", "bottom"],
                    ["top", "left"],
                    ["bottom", "left"]
                ];
            } else {
                // Target is to the left
                sidePairs = [
                    ["left", "right"],   // Horizontal connection
                    ["top", "top"],      // Top parallel
                    ["bottom", "bottom"], // Bottom parallel
                    ["left", "top"],      // Alternative angles
                    ["left", "bottom"],
                    ["top", "right"],
                    ["bottom", "right"]
                ];
            }
        } else {
            // Tables are more vertical than horizontal
            if (dy > 0) {
                // Target is below
                sidePairs = [
                    ["bottom", "top"],    // Vertical connection
                    ["left", "left"],     // Left parallel
                    ["right", "right"],   // Right parallel
                    ["bottom", "left"],   // Alternative angles
                    ["bottom", "right"],
                    ["left", "top"],
                    ["right", "top"]
                ];
            } else {
                // Target is above
                sidePairs = [
                    ["top", "bottom"],    // Vertical connection
                    ["left", "left"],     // Left parallel
                    ["right", "right"],   // Right parallel
                    ["top", "left"],      // Alternative angles
                    ["top", "right"],
                    ["left", "bottom"],
                    ["right", "bottom"]
                ];
            }
        }

        // Find best unused connection points
        let bestPoints = null;
        let bestScore = Infinity;

        for (const [sourceSide, targetSide] of sidePairs) {
            const sourceOptions = sourceGroups[sourceSide];
            const targetOptions = targetGroups[targetSide];

            if (!sourceOptions.length || !targetOptions.length) continue;

            for (const sp of sourceOptions) {
                const sourceKey = `${sp.position}-${Math.round(sp.y)}`;
                const sourceUsed = usedPoints.has(sourceKey);

                for (const tp of targetOptions) {
                    const targetKey = `${tp.position}-${Math.round(tp.y)}`;
                    const targetUsed = usedPoints.has(targetKey);

                    // Calculate base score from distance
                    let score = Math.hypot(tp.x - sp.x, tp.y - sp.y);

                    // Penalties for used points
                    if (sourceUsed) score += 1000;
                    if (targetUsed) score += 1000;

                    // Prefer points that create more natural paths
                    const angle = Math.atan2(tp.y - sp.y, tp.x - sp.x);
                    const idealAngle = sidePairs.indexOf([sourceSide, targetSide]) === 0 ? 0 : Math.PI / 2;
                    score += Math.abs(angle - idealAngle) * 100;

                    if (score < bestScore) {
                        bestScore = score;
                        bestPoints = { 
                            start: { ...sp },
                            end: { ...tp }
                        };
                        // Store the selected points for future reference
                        this.sourcePoint = { ...sp };
                        this.targetPoint = { ...tp };
                    }
                }
            }

            // If we found unused points, use them
            if (bestPoints && bestScore < 1000) break;
        }

        // If no good unused points found, use simple nearest points
        return bestPoints || this.getSimpleNearestPoints(sourcePoints, targetPoints);
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

        // Check if point is near any of the potential connection points
        const sourcePoints = relationship.sourceTable.getConnectionPoints();
        const targetPoints = relationship.targetTable.getConnectionPoints();
        console.log("new point", point);
        console.log("sourcePoints", sourcePoints);
        console.log("targetPoints", targetPoints);

        for (const sp of sourcePoints) {
            if (Math.hypot(point.x - sp.x, point.y - sp.y) < tolerance) {
                return true;
            }
        }

        for (const tp of targetPoints) {
            if (Math.hypot(point.x - tp.x, point.y - tp.y) < tolerance) {
                return true;
            }
        }

        return false;
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

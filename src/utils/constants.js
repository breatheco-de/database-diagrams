export const GRID_SIZE = 20;
// Zoom levels
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const DEFAULT_ZOOM_INDEX = 2; // Index of 1.0 zoom level


export const RELATIONSHIP_TYPES = {
    ONE_TO_ONE: 'oneToOne',
    ONE_TO_MANY: 'oneToMany',
    MANY_TO_MANY: 'manyToMany'
};

export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

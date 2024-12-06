export const GRID_SIZE = 20;

export const RELATIONSHIP_TYPES = {
    ONE_TO_ONE: 'oneToOne',
    ONE_TO_MANY: 'oneToMany',
    MANY_TO_MANY: 'manyToMany'
};

export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

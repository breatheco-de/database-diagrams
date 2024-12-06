export class RelationshipTypeModal {
    constructor() {
        this.modal = this.createModal();
        document.body.appendChild(this.modal);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'relationshipTypeModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select Relationship Type</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
                            <button type="button" class="list-group-item list-group-item-action" data-type="oneToOne">
                                One-to-One (1:1)
                            </button>
                            <button type="button" class="list-group-item list-group-item-action" data-type="oneToMany">
                                One-to-Many (1:N)
                            </button>
                            <button type="button" class="list-group-item list-group-item-action" data-type="manyToMany">
                                Many-to-Many (N:M)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    show(onSelect) {
        const modalElement = document.getElementById('relationshipTypeModal');
        
        if (!modalElement) {
            return;
        }

        const modal = new bootstrap.Modal(modalElement);
        const typeButtons = modalElement.querySelectorAll('.list-group-item');
        
        // Remove any existing click handlers
        typeButtons.forEach(button => {
            button.onclick = null;
            // Add visual feedback on hover
            button.onmouseenter = () => {
                button.style.backgroundColor = 'var(--bs-primary)';
                button.style.color = 'white';
            };
            button.onmouseleave = () => {
                button.style.backgroundColor = '';
                button.style.color = '';
            };
            // Add click handler
            button.onclick = () => {
                const type = button.dataset.type;
                onSelect(type);
                modal.hide();
            };
        });
        
        modal.show();
    }
}

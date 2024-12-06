export class EditTableModal {
    constructor() {
        this.modal = this.createModal();
        document.body.appendChild(this.modal);
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editTableModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Table</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editTableForm">
                            <div class="mb-3">
                                <label for="tableName" class="form-label">Table Name</label>
                                <input type="text" class="form-control" id="tableName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Attributes</label>
                                <div id="attributesList" class="list-group mb-2">
                                    <!-- Attributes will be added here dynamically -->
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveTable">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    show(table, onSave) {
        const modal = new bootstrap.Modal(this.modal);
        const form = this.modal.querySelector('#editTableForm');
        const saveBtn = this.modal.querySelector('#saveTable');
        const nameInput = this.modal.querySelector('#tableName');
        const attributesList = this.modal.querySelector('#attributesList');
        
        // Set current table name
        nameInput.value = table.name;
        
        // Clear and populate attributes list
        attributesList.innerHTML = '';
        table.attributes.forEach((attr, index) => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    ${attr.isPrimary ? '🔑 ' : ''}${attr.name}: ${attr.type}
                </div>
                <button type="button" class="btn btn-sm btn-danger delete-attr" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            attributesList.appendChild(item);
        });
        
        // Handle attribute deletion
        attributesList.addEventListener('click', (e) => {
            if (e.target.closest('.delete-attr')) {
                const index = e.target.closest('.delete-attr').dataset.index;
                table.attributes.splice(index, 1);
                this.show(table, onSave); // Refresh the modal
            }
        });
        
        const handleSave = () => {
            if (nameInput.value) {
                onSave({
                    name: nameInput.value,
                    attributes: table.attributes
                });
                modal.hide();
                form.reset();
            }
        };
        
        saveBtn.onclick = handleSave;
        modal.show();
    }
}

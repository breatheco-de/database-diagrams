export class AttributeForm {
    constructor() {
        this.modal = this.createModal();
        document.body.appendChild(this.modal);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'attributeModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Attribute</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="attributeForm">
                            <div class="mb-3">
                                <label for="attrName" class="form-label">Name</label>
                                <input type="text" class="form-control" id="attrName" required>
                            </div>
                            <div class="mb-3">
                                <label for="attrType" class="form-label">Type</label>
                                <select class="form-select" id="attrType">
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="date">Date</option>
                                </select>
                            </div>
                            <div class="form-check mb-3">
                                <input type="checkbox" class="form-check-input" id="isPrimary">
                                <label class="form-check-label" for="isPrimary">Primary Key</label>
                            </div>
                            <div class="form-check mb-3">
                                <input type="checkbox" class="form-check-input" id="isForeignKey" disabled>
                                <label class="form-check-label" for="isForeignKey">Foreign Key</label>
                            </div>
                            <div class="mb-3" id="referencesField" style="display: none;">
                                <label class="form-label">References Table</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="references" readonly>
                                    <button type="button" class="btn btn-outline-danger" id="deleteRelationship">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="saveAttribute">Add</button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    show(onSave, existingAttribute = null) {
        const modal = new bootstrap.Modal(this.modal);
        const saveBtn = this.modal.querySelector('#saveAttribute');
        const form = this.modal.querySelector('#attributeForm');
        const modalTitle = this.modal.querySelector('.modal-title');
        const referencesField = this.modal.querySelector('#referencesField');
        const foreignKeyCheckbox = this.modal.querySelector('#isForeignKey');
        const deleteRelationshipBtn = this.modal.querySelector('#deleteRelationship');

        // Update modal title and button text based on mode
        modalTitle.textContent = existingAttribute ? 'Edit Attribute' : 'Add Attribute';
        saveBtn.textContent = existingAttribute ? 'Save Changes' : 'Add';

        // Add delete relationship handler
        if (deleteRelationshipBtn && existingAttribute?.isForeignKey) {
            deleteRelationshipBtn.onclick = () => {
                // Create confirmation modal
                const confirmModal = document.createElement('div');
                confirmModal.className = 'modal fade';
                confirmModal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Delete Relationship</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>Are you sure you want to delete this relationship? This will remove the foreign key and its connection.</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(confirmModal);
                const bsConfirmModal = new bootstrap.Modal(confirmModal);

                // Handle deletion confirmation
                confirmModal.querySelector('#confirmDelete').onclick = () => {
                    onSave({ ...existingAttribute, deleteRelationship: true });
                    bsConfirmModal.hide();
                    modal.hide();
                };

                // Clean up confirmation modal after hiding
                confirmModal.addEventListener('hidden.bs.modal', () => {
                    document.body.removeChild(confirmModal);
                });

                bsConfirmModal.show();
            };
        }

        // Pre-fill form if editing existing attribute
        if (existingAttribute) {
            this.modal.querySelector('#attrName').value = existingAttribute.name;
            this.modal.querySelector('#attrType').value = existingAttribute.type;
            this.modal.querySelector('#isPrimary').checked = existingAttribute.isPrimary;
            foreignKeyCheckbox.checked = existingAttribute.isForeignKey || false;
            
            if (existingAttribute.isForeignKey) {
                referencesField.style.display = 'block';
                this.modal.querySelector('#references').value = existingAttribute.references || '';
            } else {
                referencesField.style.display = 'none';
            }
        } else {
            form.reset();
            referencesField.style.display = 'none';
        }

        const handleSave = () => {
            const name = this.modal.querySelector('#attrName').value;
            const type = this.modal.querySelector('#attrType').value;
            const isPrimary = this.modal.querySelector('#isPrimary').checked;

            if (name) {
                const isForeignKey = this.modal.querySelector('#isForeignKey').checked;
                const references = this.modal.querySelector('#references').value;
                onSave({ 
                    name, 
                    type, 
                    isPrimary,
                    isForeignKey,
                    references
                });
                modal.hide();
                form.reset();
            }
        };

        saveBtn.onclick = handleSave;
        modal.show();
    }
}

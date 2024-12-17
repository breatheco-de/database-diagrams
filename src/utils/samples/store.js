export const storeDiagram = {
    tables: [
        {
            id: "product",
            name: "Product",
            x: 100,
            y: 100,
            attributes: [
                { name: "product_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "description", type: "string" },
                { name: "price", type: "number" },
                { name: "stock", type: "number" },
                { name: "category_id", type: "number", isForeignKey: true, references: "Category.category_id" },
                { name: "supplier_id", type: "number", isForeignKey: true, references: "Supplier.supplier_id" }
            ]
        },
        {
            id: "category",
            name: "Category",
            x: 400,
            y: 100,
            attributes: [
                { name: "category_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "description", type: "string" },
                { name: "parent_category_id", type: "number", isForeignKey: true, references: "Category.category_id" }
            ]
        },
        {
            id: "customer",
            name: "Customer",
            x: 100,
            y: 300,
            attributes: [
                { name: "customer_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "email", type: "string" },
                { name: "phone", type: "string" }
            ]
        },
        {
            id: "order",
            name: "Order",
            x: 400,
            y: 300,
            attributes: [
                { name: "order_id", type: "number", isPrimary: true },
                { name: "date", type: "date" },
                { name: "status", type: "string" },
                { name: "total", type: "number" },
                { name: "customer_id", type: "number", isForeignKey: true, references: "Customer.customer_id" }
            ]
        },
        {
            id: "order_item",
            name: "OrderItem",
            x: 250,
            y: 500,
            attributes: [
                { name: "order_item_id", type: "number", isPrimary: true },
                { name: "order_id", type: "number", isForeignKey: true, references: "Order.order_id" },
                { name: "product_id", type: "number", isForeignKey: true, references: "Product.product_id" },
                { name: "quantity", type: "number" },
                { name: "price", type: "number" }
            ]
        },
        {
            id: "supplier",
            name: "Supplier",
            x: 700,
            y: 100,
            attributes: [
                { name: "supplier_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "contact_name", type: "string" },
                { name: "email", type: "string" },
                { name: "phone", type: "string" }
            ]
        },
        {
            id: "review",
            name: "Review",
            x: 550,
            y: 500,
            attributes: [
                { name: "review_id", type: "number", isPrimary: true },
                { name: "product_id", type: "number", isForeignKey: true, references: "Product.product_id" },
                { name: "customer_id", type: "number", isForeignKey: true, references: "Customer.customer_id" },
                { name: "rating", type: "number" },
                { name: "comment", type: "string" },
                { name: "date", type: "date" }
            ]
        }
    ]
};

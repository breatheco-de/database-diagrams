export const dealershipDiagram = {
    tables: [
        {
            id: "car",
            name: "Car",
            x: 100,
            y: 100,
            attributes: [
                { name: "vin", type: "string", isPrimary: true },
                { name: "make", type: "string" },
                { name: "model", type: "string" },
                { name: "year", type: "number" },
                { name: "price", type: "number" },
                { name: "status", type: "string" },
                { name: "dealership_id", type: "number", isForeignKey: true, references: "Dealership.dealership_id" }
            ]
        },
        {
            id: "customer",
            name: "Customer",
            x: 400,
            y: 100,
            attributes: [
                { name: "customer_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "email", type: "string" },
                { name: "phone", type: "string" },
                { name: "address", type: "string" }
            ]
        },
        {
            id: "sale",
            name: "Sale",
            x: 250,
            y: 300,
            attributes: [
                { name: "sale_id", type: "number", isPrimary: true },
                { name: "date", type: "date" },
                { name: "price", type: "number" },
                { name: "car_vin", type: "string", isForeignKey: true, references: "Car.vin" },
                { name: "customer_id", type: "number", isForeignKey: true, references: "Customer.customer_id" },
                { name: "salesperson_id", type: "number", isForeignKey: true, references: "Salesperson.salesperson_id" }
            ]
        },
        {
            id: "dealership",
            name: "Dealership",
            x: 700,
            y: 100,
            attributes: [
                { name: "dealership_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "location", type: "string" },
                { name: "phone", type: "string" }
            ]
        },
        {
            id: "salesperson",
            name: "Salesperson",
            x: 550,
            y: 300,
            attributes: [
                { name: "salesperson_id", type: "number", isPrimary: true },
                { name: "name", type: "string" },
                { name: "email", type: "string" },
                { name: "phone", type: "string" },
                { name: "dealership_id", type: "number", isForeignKey: true, references: "Dealership.dealership_id" }
            ]
        },
        {
            id: "service",
            name: "Service",
            x: 100,
            y: 500,
            attributes: [
                { name: "service_id", type: "number", isPrimary: true },
                { name: "car_vin", type: "string", isForeignKey: true, references: "Car.vin" },
                { name: "date", type: "date" },
                { name: "description", type: "string" },
                { name: "cost", type: "number" }
            ]
        }
    ]
};

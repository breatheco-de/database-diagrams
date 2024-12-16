export const sampleDiagrams = {
    airline: {
        tables: [
            {
                id: "flight",
                name: "Flight",
                x: 100,
                y: 100,
                attributes: [
                    { name: "flight_id", type: "number", isPrimary: true },
                    { name: "departure_time", type: "datetime" },
                    { name: "arrival_time", type: "datetime" },
                    { name: "aircraft_id", type: "number", isForeignKey: true, references: "Aircraft" }
                ]
            },
            {
                id: "aircraft",
                name: "Aircraft",
                x: 400,
                y: 100,
                attributes: [
                    { name: "aircraft_id", type: "number", isPrimary: true },
                    { name: "model", type: "string" },
                    { name: "capacity", type: "number" }
                ]
            },
            {
                id: "passenger",
                name: "Passenger",
                x: 100,
                y: 300,
                attributes: [
                    { name: "passenger_id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "email", type: "string" }
                ]
            }
        ],
        relationships: [
            { sourceId: "flight", targetId: "aircraft", type: "oneToMany" },
            { sourceId: "flight", targetId: "passenger", type: "manyToMany" }
        ]
    },
    school: {
        tables: [
            {
                id: "student",
                name: "Student",
                x: 100,
                y: 100,
                attributes: [
                    { name: "student_id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "grade_level", type: "number" }
                ]
            },
            {
                id: "course",
                name: "Course",
                x: 400,
                y: 100,
                attributes: [
                    { name: "course_id", type: "number", isPrimary: true },
                    { name: "title", type: "string" },
                    { name: "credits", type: "number" }
                ]
            },
            {
                id: "teacher",
                name: "Teacher",
                x: 400,
                y: 300,
                attributes: [
                    { name: "teacher_id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "department", type: "string" }
                ]
            }
        ],
        relationships: [
            { sourceId: "student", targetId: "course", type: "manyToMany" },
            { sourceId: "teacher", targetId: "course", type: "oneToMany" }
        ]
    },
    dealership: {
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
                    { name: "price", type: "number" }
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
                    { name: "phone", type: "string" }
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
                    { name: "car_vin", type: "string", isForeignKey: true, references: "Car" },
                    { name: "customer_id", type: "number", isForeignKey: true, references: "Customer" }
                ]
            }
        ],
        relationships: [
            { sourceId: "car", targetId: "sale", type: "oneToOne" },
            { sourceId: "customer", targetId: "sale", type: "oneToMany" }
        ]
    },
    store: {
        tables: [
            {
                id: "product",
                name: "Product",
                x: 100,
                y: 100,
                attributes: [
                    { name: "product_id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "price", type: "number" },
                    { name: "stock", type: "number" },
                    { name: "category_id", type: "number", isForeignKey: true, references: "Category" }
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
                    { name: "description", type: "string" }
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
                    { name: "email", type: "string" }
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
                    { name: "total", type: "number" },
                    { name: "customer_id", type: "number", isForeignKey: true, references: "Customer" }
                ]
            }
        ],
        relationships: [
            { sourceId: "category", targetId: "product", type: "oneToMany" },
            { sourceId: "customer", targetId: "order", type: "oneToMany" },
            { sourceId: "product", targetId: "order", type: "manyToMany" }
        ]
    }
};

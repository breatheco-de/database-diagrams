export const sampleDiagrams = {
    airline: {
        tables: [
            {
                id: "flight",
                name: "Flight",
                x: 100,
                y: 100,
                attributes: [
                    { name: "id", type: "number", isPrimary: true },
                    { name: "departure_time", type: "datetime" },
                    { name: "arrival_time", type: "datetime" },
                    { name: "aircraft_id", type: "number", isForeignKey: true, references: "Aircraft" },
                    { name: "departure_airport_id", type: "number", isForeignKey: true, references: "Airport" },
                    { name: "arrival_airport_id", type: "number", isForeignKey: true, references: "Airport" }
                ]
            },
            {
                id: "aircraft",
                name: "Aircraft",
                x: 400,
                y: 100,
                attributes: [
                    { name: "id", type: "number", isPrimary: true },
                    { name: "model", type: "string" },
                    { name: "capacity", type: "number" },
                    { name: "airline_id", type: "number", isForeignKey: true, references: "Airline" }
                ]
            },
            {
                id: "passenger",
                name: "Passenger",
                x: 100,
                y: 300,
                attributes: [
                    { name: "id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "email", type: "string" },
                    { name: "passport_number", type: "string" }
                ]
            },
            {
                id: "airport",
                name: "Airport",
                x: 400,
                y: 300,
                attributes: [
                    { name: "id", type: "number", isPrimary: true },
                    { name: "code", type: "string" },
                    { name: "name", type: "string" },
                    { name: "city", type: "string" },
                    { name: "country", type: "string" }
                ]
            },
            {
                id: "airline",
                name: "Airline",
                x: 700,
                y: 100,
                attributes: [
                    { name: "id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "code", type: "string" }
                ]
            },
            {
                id: "booking",
                name: "Booking",
                x: 700,
                y: 300,
                attributes: [
                    { name: "id", type: "number", isPrimary: true },
                    { name: "flight_id", type: "number", isForeignKey: true, references: "Flight" },
                    { name: "passenger_id", type: "number", isForeignKey: true, references: "Passenger" },
                    { name: "seat_number", type: "string" },
                    { name: "booking_date", type: "datetime" }
                ]
            }
        ],
        relationships: [
            { sourceId: "flight", targetId: "aircraft", type: "oneToMany" },
            { sourceId: "flight", targetId: "airport", type: "oneToMany" },
            { sourceId: "booking", targetId: "flight", type: "oneToMany" },
            { sourceId: "booking", targetId: "passenger", type: "oneToMany" },
            { sourceId: "airline", targetId: "aircraft", type: "oneToMany" }
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
                    { name: "grade_level", type: "number" },
                    { name: "email", type: "string" },
                    { name: "department_id", type: "number", isForeignKey: true, references: "Department" }
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
                    { name: "credits", type: "number" },
                    { name: "department_id", type: "number", isForeignKey: true, references: "Department" }
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
                    { name: "email", type: "string" },
                    { name: "department_id", type: "number", isForeignKey: true, references: "Department" }
                ]
            },
            {
                id: "department",
                name: "Department",
                x: 700,
                y: 100,
                attributes: [
                    { name: "department_id", type: "number", isPrimary: true },
                    { name: "name", type: "string" },
                    { name: "budget", type: "number" }
                ]
            },
            {
                id: "enrollment",
                name: "Enrollment",
                x: 100,
                y: 300,
                attributes: [
                    { name: "enrollment_id", type: "number", isPrimary: true },
                    { name: "student_id", type: "number", isForeignKey: true, references: "Student" },
                    { name: "course_id", type: "number", isForeignKey: true, references: "Course" },
                    { name: "grade", type: "string" },
                    { name: "semester", type: "string" }
                ]
            },
            {
                id: "assignment",
                name: "Assignment",
                x: 700,
                y: 300,
                attributes: [
                    { name: "assignment_id", type: "number", isPrimary: true },
                    { name: "course_id", type: "number", isForeignKey: true, references: "Course" },
                    { name: "title", type: "string" },
                    { name: "due_date", type: "datetime" },
                    { name: "total_points", type: "number" }
                ]
            }
        ],
        relationships: [
            { sourceId: "enrollment", targetId: "student", type: "oneToMany" },
            { sourceId: "enrollment", targetId: "course", type: "oneToMany" },
            { sourceId: "department", targetId: "student", type: "oneToMany" },
            { sourceId: "department", targetId: "course", type: "oneToMany" },
            { sourceId: "department", targetId: "teacher", type: "oneToMany" },
            { sourceId: "course", targetId: "assignment", type: "oneToMany" },
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
                    { name: "price", type: "number" },
                    { name: "status", type: "string" },
                    { name: "dealership_id", type: "number", isForeignKey: true, references: "Dealership" }
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
                    { name: "car_vin", type: "string", isForeignKey: true, references: "Car" },
                    { name: "customer_id", type: "number", isForeignKey: true, references: "Customer" },
                    { name: "salesperson_id", type: "number", isForeignKey: true, references: "Salesperson" }
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
                    { name: "dealership_id", type: "number", isForeignKey: true, references: "Dealership" }
                ]
            },
            {
                id: "service",
                name: "Service",
                x: 100,
                y: 500,
                attributes: [
                    { name: "service_id", type: "number", isPrimary: true },
                    { name: "car_vin", type: "string", isForeignKey: true, references: "Car" },
                    { name: "date", type: "date" },
                    { name: "description", type: "string" },
                    { name: "cost", type: "number" }
                ]
            }
        ],
        relationships: [
            { sourceId: "dealership", targetId: "car", type: "oneToMany" },
            { sourceId: "dealership", targetId: "salesperson", type: "oneToMany" },
            { sourceId: "car", targetId: "sale", type: "oneToOne" },
            { sourceId: "customer", targetId: "sale", type: "oneToMany" },
            { sourceId: "salesperson", targetId: "sale", type: "oneToMany" },
            { sourceId: "car", targetId: "service", type: "oneToMany" }
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
                    { name: "description", type: "string" },
                    { name: "price", type: "number" },
                    { name: "stock", type: "number" },
                    { name: "category_id", type: "number", isForeignKey: true, references: "Category" },
                    { name: "supplier_id", type: "number", isForeignKey: true, references: "Supplier" }
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
                    { name: "parent_category_id", type: "number", isForeignKey: true, references: "Category" }
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
                    { name: "customer_id", type: "number", isForeignKey: true, references: "Customer" }
                ]
            },
            {
                id: "order_item",
                name: "OrderItem",
                x: 250,
                y: 500,
                attributes: [
                    { name: "order_item_id", type: "number", isPrimary: true },
                    { name: "order_id", type: "number", isForeignKey: true, references: "Order" },
                    { name: "product_id", type: "number", isForeignKey: true, references: "Product" },
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
                    { name: "product_id", type: "number", isForeignKey: true, references: "Product" },
                    { name: "customer_id", type: "number", isForeignKey: true, references: "Customer" },
                    { name: "rating", type: "number" },
                    { name: "comment", type: "string" },
                    { name: "date", type: "date" }
                ]
            }
        ],
        relationships: [
            { sourceId: "category", targetId: "product", type: "oneToMany" },
            { sourceId: "supplier", targetId: "product", type: "oneToMany" },
            { sourceId: "category", targetId: "category", type: "oneToMany" },
            { sourceId: "customer", targetId: "order", type: "oneToMany" },
            { sourceId: "order", targetId: "order_item", type: "oneToMany" },
            { sourceId: "product", targetId: "order_item", type: "oneToMany" },
            { sourceId: "product", targetId: "review", type: "oneToMany" },
            { sourceId: "customer", targetId: "review", type: "oneToMany" }
        ]
    }
};

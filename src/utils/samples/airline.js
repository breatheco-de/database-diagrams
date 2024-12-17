export const airlineDiagram = {
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
                { name: "aircraft_id", type: "number", isForeignKey: true, references: "Aircraft.id" },
                { name: "departure_airport_id", type: "number", isForeignKey: true, references: "Airport.id" },
                { name: "arrival_airport_id", type: "number", isForeignKey: true, references: "Airport.id" }
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
                { name: "airline_id", type: "number", isForeignKey: true, references: "Airline.id" }
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
                { name: "flight_id", type: "number", isForeignKey: true, references: "Flight.id" },
                { name: "passenger_id", type: "number", isForeignKey: true, references: "Passenger.id" },
                { name: "seat_number", type: "string" },
                { name: "booking_date", type: "datetime" }
            ]
        }
    ]
};

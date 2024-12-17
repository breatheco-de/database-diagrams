export const schoolDiagram = {
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
                { name: "department_id", type: "number", isForeignKey: true, references: "Department.department_id" }
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
                { name: "department_id", type: "number", isForeignKey: true, references: "Department.department_id" }
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
                { name: "department_id", type: "number", isForeignKey: true, references: "Department.department_id" }
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
                { name: "student_id", type: "number", isForeignKey: true, references: "Student.student_id" },
                { name: "course_id", type: "number", isForeignKey: true, references: "Course.course_id" },
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
                { name: "course_id", type: "number", isForeignKey: true, references: "Course.course_id" },
                { name: "title", type: "string" },
                { name: "due_date", type: "datetime" },
                { name: "total_points", type: "number" }
            ]
        }
    ]
};

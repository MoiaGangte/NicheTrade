export const parseDateOfBirth = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return null;
    }

    return date;
};

export const getStudentDetails = ({ department, registerNumber, mobileNumber, studentType, dateOfBirth }) => {
    const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);

    if (
        typeof department !== 'string' || !department.trim() ||
        typeof registerNumber !== 'string' || !registerNumber.trim() ||
        typeof mobileNumber !== 'string' || !mobileNumber.trim() ||
        !['Hosteller', 'Day Scholar'].includes(studentType) ||
        !parsedDateOfBirth ||
        parsedDateOfBirth > new Date(new Date().toISOString().slice(0, 10))
    ) {
        return null;
    }

    return {
        department: department.trim(),
        registerNumber: registerNumber.trim(),
        mobileNumber: mobileNumber.trim(),
        studentType,
        dateOfBirth: parsedDateOfBirth,
    };
};

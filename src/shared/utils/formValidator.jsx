export function validate(form, rules) {

    const errors = {};

    Object.keys(rules).forEach((field) => {

        const rule = rules[field];

        const value = form[field];

        // =====================================
        // Required
        // =====================================

        if (

            rule.required &&

            (
                value === "" ||

                value === null ||

                value === undefined

            )

        ) {

            errors[field] = `${rule.label} is required`;

            return;

        }

        // =====================================
        // Number
        // =====================================

        if (

            rule.number &&

            value !== "" &&

            value !== undefined &&

            isNaN(value)

        ) {

            errors[field] = `${rule.label} must be numeric`;

        }

        // =====================================
        // Minimum Number
        // =====================================

        if (

            rule.min !== undefined &&

            value !== "" &&

            Number(value) < rule.min

        ) {

            errors[field] =

                `${rule.label} must be at least ${rule.min}`;

        }

        // =====================================
        // Maximum Length
        // =====================================

        if (

            rule.maxLength &&

            value &&

            value.length > rule.maxLength

        ) {

            errors[field] =

                `${rule.label} cannot exceed ${rule.maxLength} characters`;

        }

        // =====================================
        // Minimum Length
        // =====================================

        if (

            rule.minLength &&

            value &&

            value.length < rule.minLength

        ) {

            errors[field] =

                `${rule.label} must contain at least ${rule.minLength} characters`;

        }

    });

    return errors;

}
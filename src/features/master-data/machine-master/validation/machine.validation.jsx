export const machineRules = {

    machine_name: {

        label: "Machine Name",

        required: true,

        minLength: 3,

        maxLength: 100

    },

    make_model: {

        label: "Make / Model",

        required: true,

        maxLength: 100

    },

    controller_make_model: {

        label: "Controller Make / Model",

        required: true,

        maxLength: 100

    },

    installed_date: {

        label: "Installed Date",

        required: true

    },

    location: {

        label: "Line",

        required: true

    },

    communication_protocol: {

        label: "Communication Protocol",

        required: true,

        maxLength: 50

    },

    tool_count: {

        label: "Tool Count",

        required: true,

        number: true,

        min: 0

    },

    power_rating: {

        label: "Power Rating",

        required: true,

        number: true,

        min: 1

    },

    no_of_spindels: {

        label: "No. of Spindles",

        required: true,

        number: true,

        min: 0

    },

    no_of_servo: {

        label: "No. of Servo",

        required: true,

        number: true,

        min: 0

    },

    no_of_encoder: {

        label: "No. of Encoder",

        required: true,

        number: true,

        min: 0

    },

    no_of_batteries: {

        label: "No. of Batteries",

        required: true,

        number: true,

        min: 0

    },

    status: {

        label: "Status",

        required: true

    },

    bottleneck: {

        label: "Bottleneck",

        required: true

    }

};
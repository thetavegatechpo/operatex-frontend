export default {
  "slug": "torque-tool-adapter",
  "title": "Torque Tool Adapter",
  "tabs": [
    {
      "key": "config",
      "endpoint": "config",
      "id": "tool_device_config_id",
      "singular": "Configuration",
      "fields": [
        {
          "key": "tool_code",
          "type": "text",
          "required": true
        },
        {
          "key": "tool_name",
          "type": "text",
          "required": true
        },
        {
          "key": "tool_type",
          "type": "text",
          "required": true
        },
        {
          "key": "connection_type",
          "type": "text",
          "required": true
        },
        {
          "key": "company_id",
          "type": "text",
          "required": false
        },
        {
          "key": "plant_id",
          "type": "text",
          "required": false
        },
        {
          "key": "line_id",
          "type": "text",
          "required": false
        },
        {
          "key": "machine_id",
          "type": "text",
          "required": false
        },
        {
          "key": "device_id",
          "type": "text",
          "required": false
        },
        {
          "key": "ip_address",
          "type": "text",
          "required": false
        },
        {
          "key": "port",
          "type": "number",
          "required": false
        },
        {
          "key": "com_port",
          "type": "text",
          "required": false
        },
        {
          "key": "baud_rate",
          "type": "number",
          "required": false
        },
        {
          "key": "timeout_ms",
          "type": "number",
          "required": false
        },
        {
          "key": "retry_count",
          "type": "number",
          "required": false
        },
        {
          "key": "settings",
          "type": "json",
          "required": false
        },
        {
          "key": "status",
          "type": "text",
          "required": false,
          "options": [
            "ACTIVE",
            "INACTIVE"
          ]
        }
      ],
      "columns": [
        "tool_code",
        "tool_name",
        "tool_type",
        "connection_type",
        "status",
        "version_no"
      ],
      "canCreate": true,
      "canEdit": true,
      "saveVersionByPost": true,
      "filters": [
        "company_id",
        "plant_id"
      ]
    },
    {
      "key": "master",
      "endpoint": "master",
      "id": "torque_program_config_id",
      "singular": "Mapping",
      "fields": [
        {
          "key": "program_code",
          "type": "text",
          "required": true
        },
        {
          "key": "program_name",
          "type": "text",
          "required": true
        },
        {
          "key": "tool_program_no",
          "type": "number",
          "required": true
        },
        {
          "key": "torque_unit",
          "type": "text",
          "required": false
        },
        {
          "key": "company_id",
          "type": "text",
          "required": false
        },
        {
          "key": "plant_id",
          "type": "text",
          "required": false
        },
        {
          "key": "tool_device_config_id",
          "type": "text",
          "required": false
        },
        {
          "key": "parameter_config",
          "type": "json",
          "required": false
        },
        {
          "key": "validation_config",
          "type": "json",
          "required": false
        },
        {
          "key": "status",
          "type": "text",
          "required": false,
          "options": [
            "ACTIVE",
            "INACTIVE"
          ]
        }
      ],
      "columns": [
        "program_code",
        "program_name",
        "tool_program_no",
        "torque_unit",
        "status",
        "version_no"
      ],
      "canCreate": true,
      "canEdit": true,
      "filters": [
        "company_id",
        "plant_id"
      ]
    },
    {
      "key": "runtime",
      "endpoint": "runtime",
      "columns": [
        "event_ts",
        "device_id",
        "result_status",
        "created_at"
      ],
      "canExecute": true,
      "detail": true,
      "filters": [
        "company_id",
        "plant_id"
      ]
    },
    {
      "key": "report",
      "endpoint": "report",
      "columns": [
        "event_ts",
        "device_id",
        "result_status",
        "created_at"
      ],
      "canExport": true,
      "detail": true,
      "filters": [
        "company_id",
        "plant_id"
      ]
    }
  ],
  "executeFields": [
    {
      "key": "company_id",
      "type": "text",
      "required": false
    },
    {
      "key": "plant_id",
      "type": "text",
      "required": false
    },
    {
      "key": "tool_device_config_id",
      "type": "text",
      "required": false
    },
    {
      "key": "torque_program_config_id",
      "type": "text",
      "required": false
    },
    {
      "key": "shift_id",
      "type": "number",
      "required": false
    },
    {
      "key": "sequence_no",
      "type": "number",
      "required": false
    },
    {
      "key": "torque_value",
      "type": "number",
      "required": false
    },
    {
      "key": "angle_value",
      "type": "number",
      "required": false
    },
    {
      "key": "result_status",
      "type": "text",
      "required": true,
      "options": [
        "OK",
        "NOK"
      ]
    },
    {
      "key": "idempotency_key",
      "type": "text",
      "required": false
    },
    {
      "key": "source_system",
      "type": "text",
      "required": false
    },
    {
      "key": "payload",
      "type": "json",
      "required": false
    }
  ]
};

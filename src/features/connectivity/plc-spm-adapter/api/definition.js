export default {
  "slug": "plc-spm-adapter",
  "title": "PLC / SPM Adapter",
  "tabs": [
    {
      "key": "config",
      "endpoint": "config",
      "id": "plc_protocol_config_id",
      "singular": "Configuration",
      "fields": [
        {
          "key": "company_id",
          "type": "text",
          "required": true
        },
        {
          "key": "plant_id",
          "type": "text",
          "required": true
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
          "key": "protocol_code",
          "type": "text",
          "required": true
        },
        {
          "key": "transport",
          "type": "text",
          "required": true
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
          "key": "polling_ms",
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
        "protocol_code",
        "transport",
        "ip_address",
        "port",
        "status",
        "version_no"
      ],
      "canCreate": true,
      "canEdit": true,
      "saveVersionByPost": true,
      "filters": [
        "company_id",
        "plant_id"
      ],
      "pagination": "offset"
    },
    {
      "key": "master",
      "endpoint": "master",
      "id": "plc_signal_mapping_id",
      "singular": "Mapping",
      "fields": [
        {
          "key": "company_id",
          "type": "text",
          "required": true
        },
        {
          "key": "plant_id",
          "type": "text",
          "required": true
        },
        {
          "key": "plc_protocol_config_id",
          "type": "text",
          "required": true
        },
        {
          "key": "signal_code",
          "type": "text",
          "required": true
        },
        {
          "key": "signal_name",
          "type": "text",
          "required": false
        },
        {
          "key": "register_address",
          "type": "text",
          "required": false
        },
        {
          "key": "data_type",
          "type": "text",
          "required": false
        },
        {
          "key": "scaling_factor",
          "type": "text",
          "required": false
        },
        {
          "key": "offset_value",
          "type": "number",
          "required": false
        },
        {
          "key": "signal_config",
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
        "signal_code",
        "signal_name",
        "register_address",
        "data_type",
        "status",
        "version_no"
      ],
      "canCreate": true,
      "canEdit": true,
      "filters": [
        "company_id",
        "plant_id"
      ],
      "pagination": "offset"
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
      ],
      "pagination": "offset"
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
      ],
      "pagination": "offset"
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
      "key": "device_id",
      "type": "text",
      "required": false
    },
    {
      "key": "plc_protocol_config_id",
      "type": "text",
      "required": false
    },
    {
      "key": "shift_id",
      "type": "number",
      "required": false
    },
    {
      "key": "unit_id",
      "type": "text",
      "required": false
    },
    {
      "key": "signal_values",
      "type": "json",
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
      "key": "source_system",
      "type": "text",
      "required": false
    },
    {
      "key": "idempotency_key",
      "type": "text",
      "required": false
    },
    {
      "key": "cycle_time_ms",
      "type": "number",
      "required": false
    }
  ]
};

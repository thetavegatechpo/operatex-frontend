export default {
  "slug": "gauge-sensor-adapter",
  "title": "Gauge / Sensor Adapter",
  "tabs": [
    {
      "key": "config",
      "endpoint": "config",
      "id": "sensor_config_id",
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
          "required": true
        },
        {
          "key": "sensor_code",
          "type": "text",
          "required": true
        },
        {
          "key": "sensor_name",
          "type": "text",
          "required": true
        },
        {
          "key": "sensor_type",
          "type": "text",
          "required": true
        },
        {
          "key": "connection_type",
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
          "key": "polling_interval_ms",
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
        "sensor_code",
        "sensor_name",
        "sensor_type",
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
      "id": "sensor_parameter_config_id",
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
          "key": "device_id",
          "type": "text",
          "required": true
        },
        {
          "key": "part_id",
          "type": "text",
          "required": false
        },
        {
          "key": "process_id",
          "type": "text",
          "required": false
        },
        {
          "key": "operation_id",
          "type": "text",
          "required": false
        },
        {
          "key": "route_step_id",
          "type": "text",
          "required": false
        },
        {
          "key": "parameter_code",
          "type": "text",
          "required": true
        },
        {
          "key": "parameter_name",
          "type": "text",
          "required": true
        },
        {
          "key": "data_type",
          "type": "text",
          "required": false
        },
        {
          "key": "channel_code",
          "type": "text",
          "required": false
        },
        {
          "key": "input_unit",
          "type": "text",
          "required": false
        },
        {
          "key": "normalized_unit",
          "type": "text",
          "required": false
        },
        {
          "key": "scale_factor",
          "type": "number",
          "required": false
        },
        {
          "key": "offset_value",
          "type": "number",
          "required": false
        },
        {
          "key": "target_value",
          "type": "number",
          "required": false
        },
        {
          "key": "lower_spec_limit",
          "type": "number",
          "required": false
        },
        {
          "key": "upper_spec_limit",
          "type": "number",
          "required": false
        },
        {
          "key": "warning_lower_limit",
          "type": "number",
          "required": false
        },
        {
          "key": "warning_upper_limit",
          "type": "number",
          "required": false
        },
        {
          "key": "resolution",
          "type": "number",
          "required": false
        },
        {
          "key": "decimal_places",
          "type": "number",
          "required": false
        },
        {
          "key": "sample_size",
          "type": "number",
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
        "parameter_code",
        "parameter_name",
        "data_type",
        "lower_spec_limit",
        "upper_spec_limit",
        "status"
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
      "required": true
    },
    {
      "key": "plant_id",
      "type": "text",
      "required": true
    },
    {
      "key": "device_id",
      "type": "text",
      "required": true
    },
    {
      "key": "sensor_config_id",
      "type": "text",
      "required": true
    },
    {
      "key": "sensor_parameter_config_id",
      "type": "text",
      "required": false
    },
    {
      "key": "shift_id",
      "type": "number",
      "required": false
    },
    {
      "key": "part_id",
      "type": "text",
      "required": false
    },
    {
      "key": "route_step_id",
      "type": "text",
      "required": false
    },
    {
      "key": "unit_id",
      "type": "text",
      "required": false
    },
    {
      "key": "parameter_code",
      "type": "text",
      "required": false
    },
    {
      "key": "channel_code",
      "type": "text",
      "required": false
    },
    {
      "key": "measurement_value",
      "type": "text",
      "required": false
    },
    {
      "key": "source_result_status",
      "type": "text",
      "required": false
    },
    {
      "key": "idempotency_key",
      "type": "text",
      "required": false
    },
    {
      "key": "event_ts",
      "type": "text",
      "required": false
    }
  ]
};

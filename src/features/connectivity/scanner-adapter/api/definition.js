export default {
  "slug": "scanner-adapter",
  "title": "Scanner Adapter",
  "tabs": [
    {
      "key": "config",
      "endpoint": "config",
      "id": "scanner_config_id",
      "singular": "Configuration",
      "fields": [
        {
          "key": "scanner_code",
          "type": "text",
          "required": true
        },
        {
          "key": "scanner_name",
          "type": "text",
          "required": true
        },
        {
          "key": "scanner_type",
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
        "scanner_code",
        "scanner_name",
        "scanner_type",
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
      ],
      "pagination": "offset"
    },
    {
      "key": "master",
      "endpoint": "master",
      "id": "barcode_rule_id",
      "singular": "Mapping",
      "fields": [
        {
          "key": "rule_code",
          "type": "text",
          "required": true
        },
        {
          "key": "rule_name",
          "type": "text",
          "required": true
        },
        {
          "key": "regex",
          "type": "text",
          "required": false
        },
        {
          "key": "min_len",
          "type": "number",
          "required": false
        },
        {
          "key": "max_len",
          "type": "number",
          "required": false
        },
        {
          "key": "duplicate_policy",
          "type": "text",
          "required": false
        },
        {
          "key": "priority_no",
          "type": "number",
          "required": false
        },
        {
          "key": "parse_config",
          "type": "json",
          "required": false
        },
        {
          "key": "validation_config",
          "type": "json",
          "required": false
        },
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
        "rule_code",
        "rule_name",
        "regex",
        "duplicate_policy",
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
      "required": true
    },
    {
      "key": "plant_id",
      "type": "text",
      "required": true
    },
    {
      "key": "scanner_id",
      "type": "text",
      "required": true
    },
    {
      "key": "barcode",
      "type": "text",
      "required": true
    },
    {
      "key": "event_ts",
      "type": "text",
      "required": false
    },
    {
      "key": "shift_id",
      "type": "number",
      "required": false
    },
    {
      "key": "payload",
      "type": "json",
      "required": false
    }
  ]
};

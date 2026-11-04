export default {
  "slug": "mqtt-event-ingestion",
  "title": "MQTT / Event Ingestion",
  "tabs": [
    {
      "key": "broker",
      "id": "mqtt_broker_config_id",
      "fields": [
        {
          "key": "broker_code",
          "type": "text",
          "required": true
        },
        {
          "key": "broker_name",
          "type": "text",
          "required": true
        },
        {
          "key": "protocol",
          "type": "text",
          "required": false
        },
        {
          "key": "host",
          "type": "text",
          "required": true
        },
        {
          "key": "port",
          "type": "number",
          "required": false
        },
        {
          "key": "client_id",
          "type": "text",
          "required": false
        },
        {
          "key": "username",
          "type": "text",
          "required": false
        },
        {
          "key": "password_secret_ref",
          "type": "text",
          "required": false
        },
        {
          "key": "use_tls",
          "type": "boolean",
          "required": false
        },
        {
          "key": "keep_alive_sec",
          "type": "number",
          "required": false
        },
        {
          "key": "connect_timeout_ms",
          "type": "number",
          "required": false
        },
        {
          "key": "reconnect_interval_ms",
          "type": "number",
          "required": false
        },
        {
          "key": "clean_session",
          "type": "boolean",
          "required": false
        },
        {
          "key": "qos",
          "type": "number",
          "required": false
        },
        {
          "key": "connection_settings",
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
        "broker_code",
        "broker_name",
        "protocol",
        "host",
        "port",
        "status"
      ],
      "filters": [
        "company_id",
        "plant_id"
      ],
      "canCreate": true,
      "canEdit": true,
      "detail": true
    },
    {
      "key": "mapping",
      "id": "mqtt_topic_mapping_config_id",
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
          "key": "mqtt_broker_config_id",
          "type": "text",
          "required": true
        },
        {
          "key": "mapping_code",
          "type": "text",
          "required": true
        },
        {
          "key": "mapping_name",
          "type": "text",
          "required": true
        },
        {
          "key": "topic_pattern",
          "type": "text",
          "required": true
        },
        {
          "key": "qos",
          "type": "number",
          "required": false
        },
        {
          "key": "payload_format",
          "type": "text",
          "required": false
        },
        {
          "key": "event_type",
          "type": "text",
          "required": true
        },
        {
          "key": "destination_type",
          "type": "text",
          "required": false
        },
        {
          "key": "mapping_config",
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
        "mapping_code",
        "mapping_name",
        "topic_pattern",
        "event_type",
        "destination_type",
        "status"
      ],
      "filters": [
        "company_id",
        "plant_id"
      ],
      "canCreate": true,
      "canEdit": true,
      "detail": true
    },
    {
      "key": "rule",
      "id": "mqtt_processing_rule_config_id",
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
          "key": "mqtt_topic_mapping_config_id",
          "type": "text",
          "required": true
        },
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
          "key": "sequence_no",
          "type": "number",
          "required": false
        },
        {
          "key": "rule_type",
          "type": "text",
          "required": true
        },
        {
          "key": "source_path",
          "type": "text",
          "required": false
        },
        {
          "key": "target_field",
          "type": "text",
          "required": false
        },
        {
          "key": "data_type",
          "type": "text",
          "required": false
        },
        {
          "key": "required_flag",
          "type": "boolean",
          "required": false
        },
        {
          "key": "default_value",
          "type": "text",
          "required": false
        },
        {
          "key": "transformation_config",
          "type": "json",
          "required": false
        },
        {
          "key": "validation_config",
          "type": "json",
          "required": false
        },
        {
          "key": "on_failure",
          "type": "text",
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
        "rule_code",
        "rule_name",
        "rule_type",
        "target_field",
        "data_type",
        "status"
      ],
      "filters": [
        "company_id",
        "plant_id"
      ],
      "canCreate": true,
      "canEdit": true,
      "detail": true
    },
    {
      "key": "inbox",
      "id": "mqtt_inbox_id",
      "columns": [
        "topic",
        "processing_status",
        "message_id",
        "received_at",
        "source_system"
      ],
      "filters": [
        "company_id",
        "plant_id",
        "topic",
        "processing_status"
      ],
      "actions": [
        "process",
        "retry"
      ],
      "detail": true
    },
    {
      "key": "errors",
      "columns": [
        "error_stage",
        "error_code",
        "message",
        "created_at"
      ],
      "filters": [
        "company_id",
        "plant_id"
      ],
      "detail": true
    },
    {
      "key": "report",
      "columns": [
        "topic",
        "processing_status",
        "received_at"
      ],
      "filters": [
        "company_id",
        "plant_id"
      ],
      "canExport": true,
      "detail": true
    }
  ]
};

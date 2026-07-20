{
  "family": "__APP_SLUG__-worker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "REPLACED_BY_TERRAFORM_OR_VARS",
  "taskRoleArn": "REPLACED_BY_TERRAFORM_OR_VARS",
  "containerDefinitions": [
    {
      "name": "worker",
      "image": "REPLACED_BY_CI",
      "essential": true,
      "command": ["node", "worker.js"],
      "environment": [
        { "name": "DEPLOYMENT_MODE", "value": "saas" },
        { "name": "DATABASE_PROVIDER", "value": "postgres" },
        { "name": "STORAGE_PROVIDER", "value": "s3" },
        { "name": "LOG_STDOUT", "value": "1" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "REPLACED_BY_VARS_DATABASE_URL_SECRET_ARN" },
        { "name": "SESSION_SECRET", "valueFrom": "REPLACED_BY_VARS_SESSION_SECRET_ARN" },
        { "name": "SECRETS_ENCRYPTION_KEY", "valueFrom": "REPLACED_BY_VARS_ENCRYPTION_KEY_ARN" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/__APP_SLUG__",
          "awslogs-region": "REPLACED_BY_VARS_REGION",
          "awslogs-stream-prefix": "worker"
        }
      }
    }
  ]
}

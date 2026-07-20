{
  "family": "__APP_SLUG__-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "REPLACED_BY_TERRAFORM_OR_VARS",
  "taskRoleArn": "REPLACED_BY_TERRAFORM_OR_VARS",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "REPLACED_BY_CI",
      "essential": true,
      "command": ["node", "server.js"],
      "portMappings": [{ "containerPort": __APP_PORT__, "protocol": "tcp" }],
      "environment": [
        { "name": "DEPLOYMENT_MODE", "value": "saas" },
        { "name": "DATABASE_PROVIDER", "value": "postgres" },
        { "name": "PORT", "value": "__APP_PORT__" },
        { "name": "HOSTNAME", "value": "0.0.0.0" },
        { "name": "OUTBOX_DRAIN_ON_SUBMIT", "value": "0" },
        { "name": "STORAGE_PROVIDER", "value": "s3" },
        { "name": "LOG_STDOUT", "value": "1" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "REPLACED_BY_VARS_DATABASE_URL_SECRET_ARN" },
        { "name": "SESSION_SECRET", "valueFrom": "REPLACED_BY_VARS_SESSION_SECRET_ARN" },
        { "name": "SECRETS_ENCRYPTION_KEY", "valueFrom": "REPLACED_BY_VARS_ENCRYPTION_KEY_ARN" }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:__APP_PORT__/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 20
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/__APP_SLUG__",
          "awslogs-region": "REPLACED_BY_VARS_REGION",
          "awslogs-stream-prefix": "web"
        }
      }
    }
  ]
}

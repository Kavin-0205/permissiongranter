# Workflow Automation System - REST API Documentation

## Base URL
`/api`

## Authentication

### Register User
`POST /auth/register`
- **Body**: `{ name, email, password, managerCode? }`
- **Response**: `201 Created` with User data and JWT token.

### Login User
`POST /auth/login`
- **Body**: `{ email, password }`
- **Response**: `200 OK` with User data and JWT token.

### Get User Profile
`GET /auth/profile` (Private)
- **Response**: `200 OK` with User profile.

## Workflows

### Create Workflow
`POST /workflows` (Private/Admin/Manager)
- **Body**: `{ title, description, inputSchema, steps: [] }`
- **Response**: `201 Created`

### Get All Workflows
`GET /workflows` (Private)
- **Query Params**: `page`, `limit`, `status`
- **Response**: `200 OK`

### Get Workflow by ID
`GET /workflows/:id` (Private)
- **Response**: `200 OK`

### Update Workflow
`PUT /workflows/:id` (Private/Admin/Manager)
- **Body**: `{ title, description, inputSchema, steps: [] }`
- **Response**: `200 OK` or `201 Created` (if new version)

## Executions

### Start Execution
`POST /executions/:workflowId` (Private)
- **Body**: `{ payload: {}, priority: "low"|"medium"|"high" }`
- **Response**: `201 Created`

### Get All Executions
`GET /executions` (Private)
- **Query Params**: `page`, `limit`, `status`, `workflowId`
- **Response**: `200 OK`

### Get Execution Details
`GET /executions/:id` (Private)
- **Response**: `200 OK` with execution state and logs.

### Process Approval
`POST /executions/:id/resume` (Private/Manager)
- **Body**: `{ decision: "approved"|"rejected", comment? }`
- **Response**: `200 OK`

### Retry Execution
`PUT /executions/:id/retry` (Private/Admin)
- **Response**: `200 OK`

## Analytics

### Get Analytics
`GET /analytics` (Private/Admin/Manager)
- **Response**: `200 OK` with aggregated system metrics.

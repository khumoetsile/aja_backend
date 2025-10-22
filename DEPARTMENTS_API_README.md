# Departments and Tasks API

This document explains how to use the new departments and tasks API endpoints for bulk uploading department and task data.

## API Endpoints

### 1. Get All Departments and Tasks
```
GET /api/departments
Authorization: Bearer <token>
```

Returns all departments with their associated tasks.

### 2. Bulk Upload Departments and Tasks
```
POST /api/departments/bulk-upload
Authorization: Bearer <token>
Content-Type: application/json
```

Upload multiple departments and their tasks in one request.

### 3. Get Specific Department
```
GET /api/departments/:id
Authorization: Bearer <token>
```

Get a specific department with its tasks.

### 4. Create Department
```
POST /api/departments
Authorization: Bearer <token>
Content-Type: application/json
```

Create a single department.

### 5. Update Department
```
PUT /api/departments/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Update a department's details.

### 6. Delete Department (Soft Delete)
```
DELETE /api/departments/:id
Authorization: Bearer <token>
```

Soft delete a department and its tasks (sets is_active to false).

## Data Format

### Bulk Upload Format
```json
{
  "departments": [
    {
      "name": "Department Name",
      "description": "Department description",
      "is_active": true,
      "tasks": [
        {
          "name": "Task Name",
          "description": "Task description",
          "is_active": true
        }
      ]
    }
  ]
}
```

### Single Department Format
```json
{
  "name": "Department Name",
  "description": "Department description",
  "is_active": true
}
```

## Usage Examples

### 1. Using the API Endpoint (Recommended for Production)

```bash
# First, get an authentication token
curl -X POST http://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@aja.com", "password": "your-password"}'

# Then upload your departments data
curl -X POST http://your-api-url/api/departments/bulk-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @departments_tasks_from_E1_P1.json
```

### 2. Using the Standalone Script (For Local Development)

```bash
# Copy your JSON file to the backend directory
cp /path/to/your/departments_tasks_from_E1_P1.json aja_backend/

# Run the bulk seeding script
cd aja_backend
node bulk-seed-departments.js departments_tasks_from_E1_P1.json

# Or with options
node bulk-seed-departments.js departments_tasks_from_E1_P1.json --batch-size=3
```

### 3. Testing the API

```bash
# Test with sample data
node test-departments-api.js

# Test with your real data
node test-departments-api.js real
```

## Features

- **Duplicate Handling**: Automatically skips existing departments and tasks
- **Batch Processing**: Processes departments in configurable batches
- **Error Handling**: Comprehensive error reporting and logging
- **Validation**: Input validation for all fields
- **Soft Deletes**: Departments and tasks are soft-deleted (marked inactive)
- **Detailed Results**: Returns comprehensive statistics about the upload process

## Response Format

### Bulk Upload Response
```json
{
  "message": "Bulk upload completed",
  "results": {
    "total_departments": 10,
    "departments_created": 8,
    "departments_skipped": 2,
    "departments_errors": 0,
    "total_tasks": 150,
    "tasks_created": 140,
    "tasks_skipped": 10,
    "tasks_errors": 0,
    "details": [
      {
        "department": "Litigation",
        "status": "created",
        "tasks_processed": 25,
        "task_details": [...]
      }
    ]
  }
}
```

## Error Handling

The API provides detailed error information:

- **Validation Errors**: Field validation failures
- **Duplicate Errors**: When trying to create existing departments/tasks
- **Database Errors**: Connection or query failures
- **Authentication Errors**: Invalid or missing tokens

## Security

- All endpoints require authentication
- Input validation prevents malicious data
- Rate limiting prevents abuse
- CORS protection for web requests

## Database Schema

The API works with these database tables:

### Departments Table
- `id` (INT, Primary Key)
- `name` (VARCHAR, Unique)
- `description` (TEXT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Tasks Table
- `id` (INT, Primary Key)
- `department_id` (INT, Foreign Key)
- `name` (VARCHAR)
- `description` (TEXT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure you have valid admin credentials
   - Check that the token is properly formatted

2. **Validation Errors**
   - Check that all required fields are provided
   - Ensure data types match expected formats

3. **Database Connection Issues**
   - Verify database credentials in .env file
   - Ensure database server is running

4. **Large File Uploads**
   - Use batch processing for large datasets
   - Consider increasing server timeout settings

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will provide more detailed error messages and stack traces.

# Task description

You are a data conversion expert. Your task is to convert SQL INSERT statements into a structured JSON object format.

# Requirements
1. Parse SQL INSERT statements
2. Extract table names and data
3. Group data by table name
4. Convert to JSON object format
5. Handle different data types appropriately

# Output format
Return a JSON object where keys are table names and values are arrays of objects representing the data rows.

# Example:
Input: INSERT INTO users (id, name, email) VALUES (1, 'John', 'john@example.com');
Output: {
  "users": [
    {
      "id": 1,
      "name": "John",
      "email": "john@example.com"
    }
  ]
}

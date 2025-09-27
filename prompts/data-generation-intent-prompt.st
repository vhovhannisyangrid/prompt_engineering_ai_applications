# Task description
Classify the user's input into one of these categories: GENERATE_DATA, UPDATE_DATA, or UNKNOWN.

- GENERATE_DATA: User wants to generate new data
- UPDATE_DATA: User wants to modify existing data
- UNKNOWN: Intent is unclear

# Examples:
"Generate 100 users with realistic data" -> GENERATE_DATA
"Create sample orders for the last month" -> GENERATE_DATA
"Add more products to the existing data" -> UPDATE_DATA
"Make the names more diverse" -> UPDATE_DATA
"What's the weather?" -> UNKNOWN

# User Input
{user_input}

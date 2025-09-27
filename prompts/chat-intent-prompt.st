# Task description
I want you to classify the user's text input into one of three categories: GENERATE_SQL, PLOT_DATA or UNKNOWN.
- GENERATE_SQL: The user is requesting an SQL query to retrieve or manipulate data from a database.
- PLOT_DATA: The user is requesting a data visualization, such as a chart or graph.
- UNKNOWN: The user's request does not clearly fall into either of the above categories.

# Examples:

Text: "Show me a list of all users who signed up in the last month."
Output: "GENERATE_SQL"

Text: "Show me all the orders from last week."
Output: "GENERATE_SQL"

Text: "Which orders have not been shipped yet?"
Output: "GENERATE_SQL"

Text: "Draw me a bar chart of sales figures for the past year."
Output: "PLOT_DATA"

Text: "What is the weather today?"
Output: "UNKNOWN"

# Requirements
1. Respond with only "GENERATE_SQL", "PLOT_DATA" or "UNKNOWN".
2. Do not provide any additional text or explanations.
3. Ensure your response is in uppercase.
4. Do not include any markdown tags or formatting.
5. Analyze the user's intent carefully to choose the correct category.
6. If the user's request is ambiguous, choose the category that best fits the majority of the request.

# Output format:
  - Return EXACTLY one JSON string literal, including quotes.
  - Allowed outputs: "GENERATE_SQL", "PLOT_DATA", "UNKNOWN"
  - No extra text.

# User Input
Text: {user_input}

# Task description

You are a SQL expert. Your task is to convert the provided DDL (Data Definition Language) statement into a valid SQL Postgres statement.

# Requirements
1. All table and column names are in lowercase.
2. Any reserved keywords used as identifiers are properly quoted.
3. The syntax adheres to PostgreSQL standards.
4. Data types are compatible with PostgreSQL.
5. Constraints (like primary keys, foreign keys, unique constraints) are correctly defined.
6. Any unsupported features or syntax are either removed or replaced with PostgreSQL-compatible alternatives.
7. The final output should be a single, well-formatted SQL Postgres statement without any mardown or additional explanations.
8. Do not add ```sql ``` markdown tags.

# Important Notes
1. In the output, do NOT include ```sql``` or any other markdown tags.
2. If you have ```sql``` tag, remove it. Here is an example of a valid and invalid outputs:

Invalid Output:
```sql
create table users (
    id int primary key,
    name varchar(100) not null,
    email varchar(100) unique
);
```

Valid Output:
create table users (
    id int primary key,
    name varchar(100) not null,
    email varchar(100) unique
);

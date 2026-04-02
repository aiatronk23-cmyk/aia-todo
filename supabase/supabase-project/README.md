# Supabase Project

This project is a Supabase application that manages tasks with a PostgreSQL database. It includes features for creating, reading, updating, and deleting tasks, along with row-level security policies.

## Project Structure

```
supabase-project
├── supabase
│   ├── migrations
│   │   └── 2026-01-01T000000_init.sql
│   ├── functions
│   │   └── rpc
│   │       └── example.sql
│   ├── schema.sql
│   └── seed.sql
├── src
│   ├── main.ts
│   ├── db.ts
│   └── api
│       └── tasks.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd supabase-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up the database**:
   - Run the SQL commands in `supabase/schema.sql` to create the necessary tables and policies.
   - Use `supabase/seed.sql` to populate the database with initial data.

4. **Run the application**:
   ```bash
   npm start
   ```

## Usage Guidelines

- The application allows users to manage tasks with various attributes such as text, completion status, due date, label, and importance.
- The API endpoints for task management are defined in `src/api/tasks.ts`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
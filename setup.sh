#!/bin/bash

echo "🚀 Setting up Node.js AI Data Assistant..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Create database setup script
echo "🗄️  Creating database setup script..."
cat > setup-db.sql << 'EOF'
-- Create database and user
CREATE DATABASE ai_db;
CREATE USER ai_user WITH PASSWORD 'ai_pass';
GRANT ALL PRIVILEGES ON DATABASE ai_db TO ai_user;

-- Connect to ai_db and create source_ddl table
\c ai_db;
CREATE TABLE source_ddl (
    id VARCHAR(50) PRIMARY KEY,
    ddl TEXT NOT NULL
);
EOF

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up PostgreSQL database:"
echo "   psql -U postgres -f setup-db.sql"
echo "3. Configure Google Cloud credentials"
echo "4. Run the application:"
echo "   npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "   - Data Generation: http://localhost:3000/data"
echo "   - Chat Interface: http://localhost:3000/chat"

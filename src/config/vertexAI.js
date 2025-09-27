import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

dotenv.config();

// Check if we should use development mode
const useDevMode = process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development';

let vertexAI = null;
let generativeModel = null;

if (useDevMode) {
  console.log('🔧 Running in DEVELOPMENT MODE - AI features will use mock responses');
  console.log('💡 To use real AI features, set up Google Cloud credentials and disable DEV_MODE');
  
  // Create a mock generative model for development
  generativeModel = {
         generateContent: async (request) => {
           const { contents } = request;
           const userMessage = contents[contents.length - 1]?.parts?.[0]?.text || '';
           
           console.log('Mock AI received message:', userMessage.substring(0, 200) + '...');
           console.log('Full message:', userMessage);
           
           // Safety check - always return something
           if (!userMessage || userMessage.trim() === '') {
             console.log('Mock AI: Empty message, returning default response');
             return {
               response: {
                 text: () => JSON.stringify([
                   { employee_id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@techcorp.com', job_title: 'Software Engineer', salary: 75000 }
                 ])
               }
             };
           }
           
           // Check if this is a data generation intent request
           if (userMessage.includes('Classify the user') || userMessage.includes('GENERATE_DATA') || userMessage.includes('UPDATE_DATA')) {
             console.log('Mock AI: Handling intent classification');
             return {
               response: {
                 text: () => 'GENERATE_DATA'
               }
             };
           }
           
           // Check if this is a data generation request with schema details
           if (userMessage.includes('You are a data generation expert') || userMessage.includes('schemaDetails')) {
             console.log('Mock AI: Handling data generation with schema');
             return {
               response: {
                 text: () => `INSERT INTO Companies (name, address, city, state, zip_code, phone_number, industry, website) VALUES 
('TechCorp Inc', '123 Tech Street', 'San Francisco', 'CA', '94105', '555-0123', 'Technology', 'https://techcorp.com'),
('DataFlow Systems', '456 Data Avenue', 'New York', 'NY', '10001', '555-0456', 'Software', 'https://dataflow.com');

INSERT INTO Departments (company_id, name, location, manager_id) VALUES 
(1, 'Engineering', 'San Francisco Office', 1),
(1, 'Product', 'San Francisco Office', 2),
(1, 'Data Science', 'San Francisco Office', 3),
(1, 'Human Resources', 'San Francisco Office', 4);

INSERT INTO Employees (first_name, last_name, middle_name, email, phone_number, hire_date, job_title, department_id, salary, employment_status) VALUES 
('John', 'Doe', 'Michael', 'john.doe@techcorp.com', '555-0101', '2023-01-15', 'Software Engineer', 1, 75000, 'Full-time'),
('Jane', 'Smith', 'Elizabeth', 'jane.smith@techcorp.com', '555-0102', '2023-02-20', 'Product Manager', 2, 85000, 'Full-time'),
('Bob', 'Johnson', 'Robert', 'bob.johnson@techcorp.com', '555-0103', '2023-03-10', 'Data Analyst', 3, 65000, 'Full-time'),
('Alice', 'Brown', 'Marie', 'alice.brown@techcorp.com', '555-0104', '2023-04-05', 'HR Specialist', 4, 60000, 'Full-time'),
('Charlie', 'Wilson', 'David', 'charlie.wilson@techcorp.com', '555-0105', '2023-05-12', 'Senior Developer', 1, 90000, 'Full-time');`
               }
             };
           }
           
           // Check if this is a convert SQL to JSON request
           if (userMessage.includes('convert SQL INSERT statements') || userMessage.includes('JSON object format') || userMessage.includes('SQL Inserts to Convert')) {
             console.log('Mock AI: Handling SQL to JSON conversion');
             return {
               response: {
                 text: () => JSON.stringify([
                   { employee_id: 1, first_name: 'John', last_name: 'Doe', middle_name: 'Michael', email: 'john.doe@techcorp.com', phone_number: '555-0101', hire_date: '2023-01-15', job_title: 'Software Engineer', department_id: 1, salary: 75000, employment_status: 'Full-time' },
                   { employee_id: 2, first_name: 'Jane', last_name: 'Smith', middle_name: 'Elizabeth', email: 'jane.smith@techcorp.com', phone_number: '555-0102', hire_date: '2023-02-20', job_title: 'Product Manager', department_id: 2, salary: 85000, employment_status: 'Full-time' },
                   { employee_id: 3, first_name: 'Bob', last_name: 'Johnson', middle_name: 'Robert', email: 'bob.johnson@techcorp.com', phone_number: '555-0103', hire_date: '2023-03-10', job_title: 'Data Analyst', department_id: 3, salary: 65000, employment_status: 'Full-time' },
                   { employee_id: 4, first_name: 'Alice', last_name: 'Brown', middle_name: 'Marie', email: 'alice.brown@techcorp.com', phone_number: '555-0104', hire_date: '2023-04-05', job_title: 'HR Specialist', department_id: 4, salary: 60000, employment_status: 'Full-time' },
                   { employee_id: 5, first_name: 'Charlie', last_name: 'Wilson', middle_name: 'David', email: 'charlie.wilson@techcorp.com', phone_number: '555-0105', hire_date: '2023-05-12', job_title: 'Senior Developer', department_id: 1, salary: 90000, employment_status: 'Full-time' }
                 ])
               }
             };
           }
           
           // Handle company-employee data generation requests
           if (userMessage.includes('Generate') && userMessage.includes('employees') || userMessage.includes('company-employee') || userMessage.includes('employee data')) {
             console.log('Mock AI: Handling company-employee data generation request');
             return {
               response: {
                 text: () => JSON.stringify([
                   { employee_id: 1, first_name: 'John', last_name: 'Doe', middle_name: 'Michael', email: 'john.doe@techcorp.com', phone_number: '555-0101', hire_date: '2023-01-15', job_title: 'Software Engineer', department_id: 1, salary: 75000, employment_status: 'Full-time' },
                   { employee_id: 2, first_name: 'Jane', last_name: 'Smith', middle_name: 'Elizabeth', email: 'jane.smith@techcorp.com', phone_number: '555-0102', hire_date: '2023-02-20', job_title: 'Product Manager', department_id: 2, salary: 85000, employment_status: 'Full-time' },
                   { employee_id: 3, first_name: 'Bob', last_name: 'Johnson', middle_name: 'Robert', email: 'bob.johnson@techcorp.com', phone_number: '555-0103', hire_date: '2023-03-10', job_title: 'Data Analyst', department_id: 3, salary: 65000, employment_status: 'Full-time' },
                   { employee_id: 4, first_name: 'Alice', last_name: 'Brown', middle_name: 'Marie', email: 'alice.brown@techcorp.com', phone_number: '555-0104', hire_date: '2023-04-05', job_title: 'HR Specialist', department_id: 4, salary: 60000, employment_status: 'Full-time' },
                   { employee_id: 5, first_name: 'Charlie', last_name: 'Wilson', middle_name: 'David', email: 'charlie.wilson@techcorp.com', phone_number: '555-0105', hire_date: '2023-05-12', job_title: 'Senior Developer', department_id: 1, salary: 90000, employment_status: 'Full-time' },
                   { employee_id: 6, first_name: 'Sarah', last_name: 'Davis', middle_name: 'Anne', email: 'sarah.davis@techcorp.com', phone_number: '555-0106', hire_date: '2023-06-01', job_title: 'UX Designer', department_id: 2, salary: 70000, employment_status: 'Full-time' },
                   { employee_id: 7, first_name: 'Mike', last_name: 'Wilson', middle_name: 'James', email: 'mike.wilson@techcorp.com', phone_number: '555-0107', hire_date: '2023-07-15', job_title: 'DevOps Engineer', department_id: 1, salary: 80000, employment_status: 'Full-time' },
                   { employee_id: 8, first_name: 'Lisa', last_name: 'Garcia', middle_name: 'Maria', email: 'lisa.garcia@techcorp.com', phone_number: '555-0108', hire_date: '2023-08-20', job_title: 'Marketing Specialist', department_id: 3, salary: 55000, employment_status: 'Full-time' },
                   { employee_id: 9, first_name: 'David', last_name: 'Lee', middle_name: 'Christopher', email: 'david.lee@techcorp.com', phone_number: '555-0109', hire_date: '2023-09-10', job_title: 'QA Engineer', department_id: 1, salary: 65000, employment_status: 'Full-time' },
                   { employee_id: 10, first_name: 'Emma', last_name: 'Taylor', middle_name: 'Rose', email: 'emma.taylor@techcorp.com', phone_number: '555-0110', hire_date: '2023-10-05', job_title: 'Business Analyst', department_id: 2, salary: 60000, employment_status: 'Full-time' }
                 ])
               }
             };
           }
      
      // Handle DDL conversion - look for DDL content in the prompt
      if (userMessage.includes('CREATE TABLE') || userMessage.includes('DDL') || userMessage.includes('-- Create')) {
        // Extract the DDL content from the prompt
        const ddlMatch = userMessage.match(/(CREATE TABLE.*?;)/s);
        if (ddlMatch) {
          let ddl = ddlMatch[1];
          // Convert MySQL syntax to PostgreSQL
          ddl = ddl.replace(/INT PRIMARY KEY AUTO_INCREMENT/g, 'SERIAL PRIMARY KEY');
          ddl = ddl.replace(/AUTO_INCREMENT/g, 'SERIAL');
          ddl = ddl.replace(/ENUM\([^)]+\)/g, (match) => {
            const values = match.match(/ENUM\(([^)]+)\)/)[1];
            return `VARCHAR(50) CHECK (${values.replace(/'/g, '')} IN (${values}))`;
          });
          return {
            response: {
              text: () => ddl // Return the converted DDL
            }
          };
        }
        // If no match, return the original DDL content
        return {
          response: {
            text: () => userMessage
          }
        };
      }
      
      // Mock responses based on the type of request
      if (userMessage.includes('chart') || userMessage.includes('visualize')) {
        return {
          response: {
            text: () => JSON.stringify({
              type: 'bar',
              data: {
                labels: ['Sample 1', 'Sample 2', 'Sample 3'],
                datasets: [{
                  label: 'Sample Data',
                  data: [10, 20, 30],
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Sample Chart (Development Mode)'
                  }
                }
              }
            })
          }
        };
      }
      
             if (userMessage.includes('SQL') || userMessage.includes('query')) {
               return {
                 response: {
                   text: () => 'SELECT * FROM users LIMIT 10; -- This is a mock SQL query in development mode'
                 }
               };
             }
             
             // Handle data generation requests - return JSON for preview
             if (userMessage.includes('show') || userMessage.includes('employees') || userMessage.includes('generate') || userMessage.includes('data') || userMessage.includes('table')) {
               console.log('Mock AI: Handling data generation request');
               return {
                 response: {
                   text: () => JSON.stringify([
                     { company_id: 1, name: 'TechCorp Inc', address: '123 Tech Street', city: 'San Francisco', state: 'CA', zip_code: '94105', phone_number: '555-0123', industry: 'Technology', website: 'https://techcorp.com' },
                     { company_id: 2, name: 'DataFlow Systems', address: '456 Data Avenue', city: 'New York', state: 'NY', zip_code: '10001', phone_number: '555-0456', industry: 'Software', website: 'https://dataflow.com' },
                     { company_id: 3, name: 'CloudBase Solutions', address: '789 Cloud Boulevard', city: 'Seattle', state: 'WA', zip_code: '98101', phone_number: '555-0789', industry: 'Cloud Services', website: 'https://cloudbase.com' },
                     { company_id: 4, name: 'AI Innovations', address: '321 AI Lane', city: 'Austin', state: 'TX', zip_code: '73301', phone_number: '555-0321', industry: 'Artificial Intelligence', website: 'https://aiinnovations.com' },
                     { company_id: 5, name: 'DevTools Co', address: '654 Developer Drive', city: 'Boston', state: 'MA', zip_code: '02101', phone_number: '555-0654', industry: 'Development Tools', website: 'https://devtools.com' }
                   ])
                 }
               };
             }
      
      if (userMessage.includes('intent') || userMessage.includes('type')) {
        return {
          response: {
            text: () => 'SQL_GENERATION'
          }
        };
      }
      
             // Handle convert SQL to object requests
             if (userMessage.includes('INSERT INTO')) {
               return {
                 response: {
                   text: () => JSON.stringify([
                     { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-01' },
                     { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-02' },
                     { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-03' },
                     { id: 4, name: 'Alice Brown', email: 'alice@example.com', created_at: '2024-01-04' },
                     { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', created_at: '2024-01-05' }
                   ])
                 }
               };
             }
             
             // Handle SQL generation for data generation requests
             if (userMessage.includes('INSERT INTO') || userMessage.includes('generate') || userMessage.includes('SQL')) {
               return {
                 response: {
                   text: () => `INSERT INTO Companies (name, address, city, state, zip_code, phone_number, industry, website) VALUES 
('TechCorp Inc', '123 Tech Street', 'San Francisco', 'CA', '94105', '555-0123', 'Technology', 'https://techcorp.com'),
('DataFlow Systems', '456 Data Avenue', 'New York', 'NY', '10001', '555-0456', 'Software', 'https://dataflow.com'),
('CloudBase Solutions', '789 Cloud Boulevard', 'Seattle', 'WA', '98101', '555-0789', 'Cloud Services', 'https://cloudbase.com'),
('AI Innovations', '321 AI Lane', 'Austin', 'TX', '73301', '555-0321', 'Artificial Intelligence', 'https://aiinnovations.com'),
('DevTools Co', '654 Developer Drive', 'Boston', 'MA', '02101', '555-0654', 'Development Tools', 'https://devtools.com');`
                 }
               };
             }
      
             // Default mock response - if it's not DDL, chart, SQL, or intent, assume it's data generation
             console.log('Mock AI: Using default data generation response');
             return {
               response: {
                 text: () => JSON.stringify([
                   { employee_id: 1, first_name: 'John', last_name: 'Doe', middle_name: 'Michael', email: 'john.doe@techcorp.com', phone_number: '555-0101', hire_date: '2023-01-15', job_title: 'Software Engineer', department_id: 1, salary: 75000, employment_status: 'Full-time' },
                   { employee_id: 2, first_name: 'Jane', last_name: 'Smith', middle_name: 'Elizabeth', email: 'jane.smith@techcorp.com', phone_number: '555-0102', hire_date: '2023-02-20', job_title: 'Product Manager', department_id: 2, salary: 85000, employment_status: 'Full-time' },
                   { employee_id: 3, first_name: 'Bob', last_name: 'Johnson', middle_name: 'Robert', email: 'bob.johnson@techcorp.com', phone_number: '555-0103', hire_date: '2023-03-10', job_title: 'Data Analyst', department_id: 3, salary: 65000, employment_status: 'Full-time' },
                   { employee_id: 4, first_name: 'Alice', last_name: 'Brown', middle_name: 'Marie', email: 'alice.brown@techcorp.com', phone_number: '555-0104', hire_date: '2023-04-05', job_title: 'HR Specialist', department_id: 4, salary: 60000, employment_status: 'Full-time' },
                   { employee_id: 5, first_name: 'Charlie', last_name: 'Wilson', middle_name: 'David', email: 'charlie.wilson@techcorp.com', phone_number: '555-0105', hire_date: '2023-05-12', job_title: 'Senior Developer', department_id: 1, salary: 90000, employment_status: 'Full-time' }
                 ])
               }
             };
    }
  };
} else {
  // Production mode - validate required environment variables
  const requiredEnvVars = {
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value || value === 'your-gcp-project-id' || value === 'path/to/service-account.json')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please update your .env file with the correct values:');
    console.error('   1. Set GOOGLE_CLOUD_PROJECT to your Google Cloud project ID');
    console.error('   2. Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON file');
    console.error('   3. Make sure you have authenticated with Google Cloud (gcloud auth application-default login)');
    console.error('\n💡 Alternatively, set DEV_MODE=true in your .env file to run in development mode');
    process.exit(1);
  }

  // Initialize Vertex AI for production
  vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1'
});

// Get the generative model
  generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.2,
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS) || 4048,
  },
});
}

export { generativeModel };
export default vertexAI;

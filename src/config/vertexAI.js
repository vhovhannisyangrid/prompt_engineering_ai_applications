import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = {
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value === 'your-gcp-project-id' || value === 'path/to/service-account.json')
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n Please update your .env file with the correct values:');
  console.error('   1. Set GOOGLE_CLOUD_PROJECT to your Google Cloud project ID');
  console.error('   2. Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON file');
  console.error('   3. Make sure you have authenticated with Google Cloud (gcloud auth application-default login)');
  process.exit(1);
}

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1'
});

// Get the generative model
export const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.2,
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS) || 4048,
  },
});

export default vertexAI;

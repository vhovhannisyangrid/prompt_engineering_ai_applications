import { generativeModel } from '../config/vertexAI.js';
import { dbTools } from '../tools/dbTools.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatMemory = new Map();

class AiAssistant {
  constructor() {
    this.promptsPath = path.join(__dirname, '../../prompts');
  }

  async loadPrompt(filename) {
    try {
      const promptPath = path.join(this.promptsPath, filename);
      return await fs.readFile(promptPath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to load prompt ${filename}: ${error.message}`);
      return '';
    }
  }

  async getChatResponseType(userMessage) {
    try {
      const prompt = await this.loadPrompt('chat-intent-prompt.st');
      const fullPrompt = prompt.replace('{user_input}', userMessage);
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 100,
        }
      });
      
      const response = result.response.text().trim();
      logger.debug(`Chat response type: ${response}`);
      return response;
    } catch (error) {
      logger.error(`Failed to get chat response type: ${error.message}`);
      return 'UNKNOWN';
    }
  }

  async generateSql(userMessage, conversationId) {
    try {
      const instructions = await this.loadPrompt('query-instructions.st');
      
      // Get conversation history
      const history = this.getConversationHistory(conversationId);
      
      const prompt = `${instructions}\n\nUser: ${userMessage}`;
      
      const result = await generativeModel.generateContent({
        contents: [
          ...history,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        tools: [{ functionDeclarations: this.getToolDeclarations() }],
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO'
          }
        }
      });
      
      const response = result.response.text();
      
      this.saveToConversationHistory(conversationId, 'user', userMessage);
      this.saveToConversationHistory(conversationId, 'model', response);
      
      return response;
    } catch (error) {
      logger.error(`Failed to generate SQL: ${error.message}`);
      throw new Error('Failed to generate SQL query');
    }
  }

  async getChart(userMessage, data, conversationId) {
    try {
      const instructions = await this.loadPrompt('chart-instructions.st');
      const chartPrompt = await this.loadPrompt('chart-prompt.st');
      
      const fullPrompt = chartPrompt
        .replace('{user_input}', userMessage)
        .replace('{data}', JSON.stringify(data));
      
      const prompt = `${instructions}\n\n${fullPrompt}`;
      
      const result = await generativeModel.generateContent({
        contents: [
          ...this.getConversationHistory(conversationId),
          { role: 'user', parts: [{ text: prompt }] }
        ]
      });
      
      const response = result.response.text();
      
      this.saveToConversationHistory(conversationId, 'user', userMessage);
      this.saveToConversationHistory(conversationId, 'model', response);
      
      return JSON.parse(response);
    } catch (error) {
      logger.error(`Failed to generate chart: ${error.message}`);
      throw new Error('Failed to generate chart configuration');
    }
  }

  async getSql(ddl) {
    try {
      const instructions = await this.loadPrompt('generate-ddl-instructions.st');
      const ddlPrompt = await this.loadPrompt('generate-ddl-prompt.st');
      
      const fullPrompt = ddlPrompt.replace('{ddl_statement}', ddl);
      const prompt = `${instructions}\n\n${fullPrompt}`;
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      return result.response.text().trim();
    } catch (error) {
      logger.error(`Failed to convert DDL: ${error.message}`);
      throw new Error('Failed to convert DDL to PostgreSQL format');
    }
  }

  async getDataGenerationIntent(userMessage) {
    try {
      const prompt = await this.loadPrompt('data-generation-intent-prompt.st');
      const fullPrompt = prompt.replace('{user_input}', userMessage);
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 100,
        }
      });
      
      return result.response.text().trim();
    } catch (error) {
      logger.error(`Failed to get data generation intent: ${error.message}`);
      return 'UNKNOWN';
    }
  }

  async generateInserts(userMessage, temperature = 0.2, maxTokens = 3000) {
    try {
      const instructions = await this.loadPrompt('generate-inserts-instructions.st');
      const defaultPrompt = await this.loadPrompt('generate-inserts-prompt-default.st');
      
      const prompt = userMessage.trim() 
        ? `${instructions}\n\nUser: ${userMessage}`
        : `${instructions}\n\n${defaultPrompt}`;
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: this.getToolDeclarations() }],
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO'
          }
        },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      });
      
      return result.response.text();
    } catch (error) {
      logger.error(`Failed to generate inserts: ${error.message}`);
      throw new Error('Failed to generate SQL inserts');
    }
  }

  async updateInserts(userMessage, sql, temperature = 0.2, maxTokens = 3000) {
    try {
      const instructions = await this.loadPrompt('update-inserts-instructions.st');
      const prompt = `${instructions}\n\nSQL Inserts: ${sql}\n\nUser: ${userMessage}`;
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: this.getToolDeclarations() }],
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO'
          }
        },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      });
      
      return result.response.text();
    } catch (error) {
      logger.error(`Failed to update inserts: ${error.message}`);
      throw new Error('Failed to update SQL inserts');
    }
  }

  async convertSqlToObject(sql, temperature = 0.2, maxTokens = 3000) {
    try {
      const instructions = await this.loadPrompt('convert-inserts-instructions.st');
      const convertPrompt = await this.loadPrompt('convert-inserts-prompt.st');
      
      const fullPrompt = convertPrompt.replace('{sql_inserts}', sql);
      const prompt = `${instructions}\n\n${fullPrompt}`;
      
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      });
      
      return JSON.parse(result.response.text());
    } catch (error) {
      logger.error(`Failed to convert SQL to object: ${error.message}`);
      throw new Error('Failed to convert SQL to object format');
    }
  }

  getConversationHistory(conversationId) {
    const history = chatMemory.get(conversationId) || [];
    const maxHistory = parseInt(process.env.AI_CHAT_MAX_HISTORY_SIZE) || 10;
    return history.slice(-maxHistory);
  }

  saveToConversationHistory(conversationId, role, content) {
    if (!chatMemory.has(conversationId)) {
      chatMemory.set(conversationId, []);
    }
    
    const history = chatMemory.get(conversationId);
    history.push({ role, parts: [{ text: content }] });
    
    const maxHistory = parseInt(process.env.AI_CHAT_MAX_HISTORY_SIZE) || 10;
    if (history.length > maxHistory) {
      history.splice(0, history.length - maxHistory);
    }
    
    chatMemory.set(conversationId, history);
  }

  getToolDeclarations() {
    return [
      {
        name: 'schemaDetails',
        description: 'Get schema details of the current database',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'getTableData',
        description: 'Get all data from a specified table in the database',
        parameters: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Table name'
            }
          },
          required: ['tableName']
        }
      },
      {
        name: 'executeSqlQuery',
        description: 'Execute a SQL query on the database and return the results',
        parameters: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'AI generated SQL query for database'
            }
          },
          required: ['sql']
        }
      }
    ];
  }
}

export default new AiAssistant();

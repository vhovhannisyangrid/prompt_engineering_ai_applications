import dbExecutor from '../services/dbExecutor.js';
import { logger } from '../utils/logger.js';


export const dbTools = {

  async schemaDetails() {
    logger.debug('Tool schemaDetails request');
    try {
      const response = await dbExecutor.getSchemaDetails();
      logger.debug(`Tool schemaDetails response: ${response}`);
      return response || 'No schema found. Please upload a DDL schema first.';
    } catch (error) {
      logger.error(`Schema details tool failed: ${error.message}`);
      return 'Error retrieving schema details';
    }
  },


  async getTableData(tableName) {
    logger.debug(`Tool getTableData request for table: ${tableName}`);
    try {
      const response = await dbExecutor.executeSql(`SELECT * FROM ${tableName}`);
      logger.debug(`Tool getTableData response: ${response.length} rows`);
      return response;
    } catch (error) {
      logger.error(`Get table data tool failed: ${error.message}`);
      return [];
    }
  },

  async executeSqlQuery(sql) {
    logger.debug(`Tool executeSqlQuery request: ${sql}`);
    try {
      const response = await dbExecutor.executeSql(sql);
      logger.debug(`Tool executeSqlQuery response: ${response.length} rows`);
      return response;
    } catch (error) {
      logger.error(`Execute SQL query tool failed: ${error.message}`);
      throw new Error(`SQL execution failed: ${error.message}`);
    }
  }
};

export const getAvailableTools = () => [
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

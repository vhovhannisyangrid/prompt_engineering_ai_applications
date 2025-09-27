import pool from '../config/database.js';
import { logger } from '../utils/logger.js';

class DbExecutor {

  async executeSql(sql) {
    const client = await pool.connect();
    try {
      logger.debug(`Executing SQL: ${sql}`);
      const result = await client.query(sql);
      logger.debug(`SQL executed successfully, rows: ${result.rows.length}`);
      return result.rows;
    } catch (error) {
      logger.error(`SQL execution failed: ${error.message}`);
      throw new Error(`Database error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async executeDdl(ddl) {
    const client = await pool.connect();
    try {
      logger.debug(`Executing DDL: ${ddl}`);
      await client.query(ddl);
      logger.debug('DDL executed successfully');
    } catch (error) {
      logger.error(`DDL execution failed: ${error.message}`);
      throw new Error(`Database error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async cleanup() {
    const client = await pool.connect();
    try {
      // Get all tables in the public schema and drop them one by one
      const tablesResult = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      const tableNames = tablesResult.rows.map(row => row.tablename);
      
      if (tableNames.length > 0) {
        for (const tableName of tableNames) {
          await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
          logger.debug(`Dropped table: ${tableName}`);
        }
        logger.debug(`Dropped ${tableNames.length} tables: ${tableNames.join(', ')}`);
      } else {
        logger.debug('No tables to drop');
      }
      
      logger.debug('Database cleanup completed successfully');
      return { message: 'Database cleanup completed successfully' };
    } catch (error) {
      logger.error(`Database cleanup failed: ${error.message}`);
      throw new Error(`Cleanup error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async getSchemaDetails() {
    const client = await pool.connect();
    try {
      // Check if source_ddl table exists first
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'source_ddl'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        logger.debug('source_ddl table does not exist, returning null');
        return null;
      }
      
      const result = await client.query(`
        SELECT ddl FROM source_ddl WHERE id = $1
      `, ['ddl']);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].ddl;
    } catch (error) {
      logger.error(`Failed to get schema details: ${error.message}`);
      return null;
    } finally {
      client.release();
    }
  }

  async saveSchemaDdl(ddl) {
    const client = await pool.connect();
    try {
      // Create source_ddl table if it doesn't exist
      logger.debug('Creating source_ddl table if not exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS source_ddl (
          id VARCHAR(50) PRIMARY KEY,
          ddl TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      logger.debug('source_ddl table created/verified successfully');
      
      // Grant permissions to ai_user
      await client.query('ALTER TABLE source_ddl OWNER TO ai_user;');
      logger.debug('source_ddl table ownership granted to ai_user');
      
      await client.query(`
        INSERT INTO source_ddl (id, ddl) 
        VALUES ($1, $2) 
        ON CONFLICT (id) 
        DO UPDATE SET ddl = $2
      `, ['ddl', ddl]);
      
      logger.debug('Schema DDL saved successfully');
    } catch (error) {
      logger.error(`Failed to save schema DDL: ${error.message}`);
      logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      throw new Error(`Failed to save schema: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

export default new DbExecutor();

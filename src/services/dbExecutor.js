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
      const tablesResult = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      const tableNames = tablesResult.rows.map(row => row.tablename);
      
      if (tableNames.length > 0) {
        const dropQuery = `DROP TABLE IF EXISTS ${tableNames.join(', ')} CASCADE`;
        await client.query(dropQuery);
        logger.debug(`Dropped tables: ${tableNames.join(', ')}`);
      }
      
      await client.query('DELETE FROM source_ddl WHERE id = $1', ['ddl']);
      
      logger.debug('Database cleanup completed');
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
      await client.query(`
        INSERT INTO source_ddl (id, ddl) 
        VALUES ($1, $2) 
        ON CONFLICT (id) 
        DO UPDATE SET ddl = $2
      `, ['ddl', ddl]);
      
      logger.debug('Schema DDL saved successfully');
    } catch (error) {
      logger.error(`Failed to save schema DDL: ${error.message}`);
      throw new Error(`Failed to save schema: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

export default new DbExecutor();

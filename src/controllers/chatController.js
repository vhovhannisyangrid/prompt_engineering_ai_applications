import express from 'express';
import aiAssistant from '../services/aiAssistant.js';
import dbExecutor from '../services/dbExecutor.js';
import { dbTools } from '../tools/dbTools.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { conversationId, message, sql, rows } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    logger.debug(`Chat request: ${message}`);
    
    const responseType = await aiAssistant.getChatResponseType(message);
    
    let response = {
      conversationId,
      sql: null,
      rows: null,
      chart: null
    };
    
    switch (responseType) {
      case 'GENERATE_SQL':
        response = await handleSqlGeneration(message, conversationId, response);
        break;
      case 'PLOT_DATA':
        response = await handleDataVisualization(message, rows, conversationId, response);
        break;
      default:
        response = await handleUnknownIntent(response);
        break;
    }
    
    res.json(response);
  } catch (error) {
    logger.error(`Chat controller error: ${error.message}`);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

async function handleSqlGeneration(message, conversationId, response) {
  try {
    const sql = await aiAssistant.generateSql(message, conversationId);
    const result = await dbExecutor.executeSql(sql);
    
    response.sql = sql;
    response.rows = result;
    
    return response;
  } catch (error) {
    logger.error(`SQL generation error: ${error.message}`);
    throw error;
  }
}

async function handleDataVisualization(message, rows, conversationId, response) {
  try {
    const chart = await aiAssistant.getChart(message, rows, conversationId);
    
    response.sql = null;
    response.rows = rows;
    response.chart = chart;
    
    return response;
  } catch (error) {
    logger.error(`Data visualization error: ${error.message}`);
    throw error;
  }
}

async function handleUnknownIntent(response) {
  response.sql = null;
  response.rows = null;
  response.chart = null;
  
  return response;
}

export default router;

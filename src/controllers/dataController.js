import express from 'express';
import multer from 'multer';
import aiAssistant from '../services/aiAssistant.js';
import dbExecutor from '../services/dbExecutor.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.sql', '.ddl', '.txt', '.json'];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SQL, DDL, TXT, and JSON files are allowed.'));
    }
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const schema = req.file.buffer.toString('utf-8');
    logger.debug(`Uploaded schema: ${schema.substring(0, 100)}...`);
    
    const sql = await aiAssistant.getSql(schema);
    
    await dbExecutor.executeDdl(sql);
    
    await dbExecutor.saveSchemaDdl(sql);
    
    res.json({ message: 'Data definition executed successfully' });
  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    await dbExecutor.cleanup();
    res.json({ message: 'Schema is empty' });
  } catch (error) {
    logger.error(`Cleanup error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { prompt, temperature, maxTokens } = req.body;
    
    logger.debug(`Generate request: ${prompt}`);
    
    const intent = await aiAssistant.getDataGenerationIntent(prompt);
    
    if (intent === 'UNKNOWN') {
      return res.status(400).json({ error: 'Unable to determine data generation intent' });
    }
    
    const sql = await aiAssistant.generateInserts(
      prompt,
      parseFloat(temperature) || 0.2,
      parseInt(maxTokens) || 3000
    );
    
    const preview = await aiAssistant.convertSqlToObject(
      sql,
      parseFloat(temperature) || 0.2,
      parseInt(maxTokens) || 3000
    );
    
    res.json({
      sql,
      preview,
      intent
    });
  } catch (error) {
    logger.error(`Generate error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { prompt, sql, temperature, maxTokens } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL is required' });
    }
    
    logger.debug(`Update request: ${prompt}`);
    
    const updatedSql = await aiAssistant.updateInserts(
      prompt,
      sql,
      parseFloat(temperature) || 0.2,
      parseInt(maxTokens) || 3000
    );
    
    const preview = await aiAssistant.convertSqlToObject(
      updatedSql,
      parseFloat(temperature) || 0.2,
      parseInt(maxTokens) || 3000
    );
    
    res.json({
      sql: updatedSql,
      preview
    });
  } catch (error) {
    logger.error(`Update error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL is required' });
    }
    
    logger.debug(`Execute SQL: ${sql}`);
    
    const result = await dbExecutor.executeSql(sql);
    
    res.json({
      rows: result,
      count: result.length
    });
  } catch (error) {
    logger.error(`Execute error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

router.post('/download', async (req, res) => {
  try {
    const { sql, filename } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL is required' });
    }
    
    const result = await dbExecutor.executeSql(sql);
    
    if (result.length === 0) {
      return res.status(400).json({ error: 'No data to download' });
    }
    
    const csv = convertToCSV(result);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'data.csv'}"`);
    res.send(csv);
  } catch (error) {
    logger.error(`Download error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export default router;

import { logger } from '../utils/logger.js';

export const guardrailsMiddleware = (req, res, next) => {
  try {
    if (req.body && req.body.message) {
      const sensitiveWords = (process.env.SENSITIVE_WORDS || '').split(',');
      const userInput = req.body.message.toLowerCase();
      
      for (const word of sensitiveWords) {
        if (word.trim() && userInput.includes(word.trim().toLowerCase())) {
          logger.warn(`Sensitive word detected: ${word}`);
          return res.status(400).json({
            error: 'Sensitive content detected. Please rephrase your request.',
            code: 'SENSITIVE_CONTENT'
          });
        }
      }
    }
    
    if (req.body && req.body.message) {
      const promptInjectionPatterns = [
        /ignore\s+previous\s+instructions/i,
        /forget\s+everything/i,
        /you\s+are\s+now/i,
        /act\s+as\s+if/i,
        /pretend\s+to\s+be/i,
        /roleplay\s+as/i,
        /system\s+prompt/i,
        /jailbreak/i,
        /override/i,
        /bypass/i
      ];
      
      const userInput = req.body.message;
      
      for (const pattern of promptInjectionPatterns) {
        if (pattern.test(userInput)) {
          logger.warn(`Prompt injection detected: ${userInput.substring(0, 100)}...`);
          return res.status(400).json({
            error: 'Prompt injection detected. Please rephrase your request.',
            code: 'PROMPT_INJECTION'
          });
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error(`Guardrails middleware error: ${error.message}`);
    next();
  }
};

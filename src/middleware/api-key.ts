import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { logger } from '../config/logger';

/**
 * Middleware para autenticação via API Key
 * Aceita API Key via:
 * 1. Header X-API-Key
 * 2. Query parameter api_key
 */
export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKeyFromHeader = req.headers['x-api-key'] as string;
  const apiKeyFromQuery = req.query.api_key as string;
  
  const providedApiKey = apiKeyFromHeader || apiKeyFromQuery;

  if (!providedApiKey) {
    logger.warn('API Key not provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    
    res.status(401).json({
      success: false,
      message: 'API Key is required. Provide it via X-API-Key header or api_key query parameter.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (providedApiKey !== config.apiKey) {
    logger.warn('Invalid API Key provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    
    res.status(403).json({
      success: false,
      message: 'Invalid API Key',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // API Key válida, prosseguir
  next();
}

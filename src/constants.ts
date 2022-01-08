import path from 'path';

export const CACHE_ROOT = process.env.CACHE_ROOT_PATH || path.resolve(__dirname, '../.cache');

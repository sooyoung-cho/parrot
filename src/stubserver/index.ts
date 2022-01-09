import express, { Application, Request, Response } from 'express';
import path from 'path';
import { CACHE_ROOT } from '../constants';
import { readFile } from 'fs/promises';
import fs from 'fs';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prefix = path.join(CACHE_ROOT + '/www_mymusictaste_com');
const getCache = async (req: Request) => {
  const endpoint = req.params[0];
  const filename = `GET__${endpoint.split('/').join('_')}.json`;
  const key = req.originalUrl.replace(req.path, '');
  const filepath = path.join(prefix, endpoint, `${filename}`);

  if (!fs.existsSync(filepath)) return { message: 'Not cached yet.' };
  const cacheFile = await readFile(filepath, { encoding: 'utf-8' });
  const rawCache = JSON.parse(cacheFile);
  const cache = rawCache[key];

  return cache;
};

app.get('/parrot/*', async (req: Request, res: Response, next) => {
  const cache = await getCache(req);
  res.json(cache);
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

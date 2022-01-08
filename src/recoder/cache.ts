import fsOld from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { CacheEntity, CacheIndexEntity, CacheKey } from './types';
const fs = fsOld.promises;

const CACHE_ROOT_PATH = process.env.CACHE_ROOT_PATH || path.resolve(__dirname, '../../.cache');
const CACHE_INDEX_PATH = path.resolve(CACHE_ROOT_PATH, './index.json');

const indexPath = CACHE_INDEX_PATH;
const parsefilePath = (filename: string) => path.resolve(CACHE_ROOT_PATH, filename);
const isExist = (p: string) => fsOld.existsSync(p);

const createCacheCollection = async (filename: string = '/') => {
  if (!isExist(CACHE_ROOT_PATH)) await fs.mkdir(CACHE_ROOT_PATH);

  await fs.writeFile(path.resolve(CACHE_ROOT_PATH, filename), '{}', { encoding: 'utf-8' });
};
const readCacheCollection = async <T>(filename: string = '/'): Promise<T> => {
  const rawFile = await fs.readFile(path.resolve(CACHE_ROOT_PATH, filename), { encoding: 'utf-8' });
  return JSON.parse(rawFile) as T;
};

const _updateIndexFile = async (cacheKey: CacheKey) => {
  let index = await readCacheCollection<CacheIndexEntity>();
  if (index[cacheKey.filename]) index[cacheKey.filename] = [...new Set([...index[cacheKey.filename], cacheKey.key])];
  else index[cacheKey.filename] = [cacheKey.key];
  await fs.writeFile(CACHE_INDEX_PATH, JSON.stringify(index), { encoding: 'utf-8' });
};

const _updateCacheFile = async (p: string, data: CacheEntity) => {
  await fs.writeFile(path.resolve(CACHE_ROOT_PATH, p), JSON.stringify(data), { encoding: 'utf-8' });
};


const createCacheKey = (res: puppeteer.HTTPResponse): CacheKey => {
  const url = new URL(res.url());
  const req = res.request();
  const apiName = `${req.method()}_${url.pathname.split('/').join('_')}`;
  const queries = url.search;
  return {
    filename: apiName + '.json',
    key: queries === '' ? '/' : queries,
  };
};
const isCached = async (cacheKey: CacheKey) => {
  if (!isExist(indexPath)) throw new Error('.cache/index.json is not exist!');

  const index = await readCacheCollection<CacheIndexEntity>();
  return !!index[cacheKey.filename]?.some((key) => key === cacheKey.key);
};

////----
export const createCache = async () => {
  if (!isExist(indexPath)) {
    await createCacheCollection();
  }
};
export const readCache = async (res: puppeteer.HTTPResponse) => {
  const cacheKey = createCacheKey(res);
  if (await isCached(cacheKey)) {
    const cached = await readCacheCollection<CacheEntity>(cacheKey.filename);
    return cached[cacheKey.key];
  } else {
    const filePath = parsefilePath(cacheKey.filename);
    if (!isExist(filePath)) {
      await createCacheCollection(cacheKey.filename);
    }
    await _updateIndexFile(cacheKey);
    const cached = { [cacheKey.key]: await res.json() };
    await _updateCacheFile(cacheKey.filename, cached);
    return cached[cacheKey.key];
  }
};

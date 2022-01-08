import fsOld from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { CacheEntity, CacheIndexEntity, CacheKey } from './types';
const fs = fsOld.promises;

const CACHE_ROOT_PATH = process.env.CACHE_ROOT_PATH || path.resolve(__dirname, '../../.cache');
const CACHE_INDEX_PATH = path.resolve(CACHE_ROOT_PATH, './index.json');
const _isCacheIndexExist = () => fsOld.existsSync(CACHE_INDEX_PATH);
const _createCacheIndex = async () => {
  try {
    await fs.mkdir(CACHE_ROOT_PATH);
  } catch {
    // .cache already exists
  }
  await fs.writeFile(CACHE_INDEX_PATH, '{}', { encoding: 'utf-8' });
};
const _readIndexFile = async () => {
  const rawIndex = await fs.readFile(path.resolve(CACHE_INDEX_PATH), { encoding: 'utf-8' });
  return JSON.parse(rawIndex) as CacheIndexEntity;
};
const _updateIndexFile = async (cacheKey: CacheKey) => {
  let index = await _readIndexFile();
  if (index[cacheKey.filename]) index[cacheKey.filename] = [...new Set([...index[cacheKey.filename],cacheKey.key])];
  else index[cacheKey.filename] = [cacheKey.key];
  await fs.writeFile(CACHE_INDEX_PATH, JSON.stringify(index), { encoding: 'utf-8' });
};

const _isCacheFileExist = (p: string) => fsOld.existsSync(path.resolve(CACHE_ROOT_PATH, p));
const _createCacheFile = async (p: string) => {
  await fs.writeFile(path.resolve(CACHE_ROOT_PATH, p), '{}', { encoding: 'utf-8' });
};
const _readCacheFile = async (p: string) => {
  const rawCache = await fs.readFile(path.resolve(CACHE_ROOT_PATH, p), { encoding: 'utf-8' });
  return JSON.parse(rawCache) as CacheEntity;
};
const _updateCacheFile = async (p: string, data: CacheEntity) => {
  await fs.writeFile(path.resolve(CACHE_ROOT_PATH, p), JSON.stringify(data), { encoding: 'utf-8' });
};
const _createCacheKey = (res: puppeteer.HTTPResponse): CacheKey => {
  const url = new URL(res.url());
  const req = res.request();
  const apiName = `${req.method()}_${url.pathname.split('/').join('_')}`;
  const queries = url.search;
  return {
    filename: apiName + '.json',
    key: queries === '' ? '/' : queries,
  };
};
const _isCached = async (cacheKey: CacheKey) => {
  if (!_isCacheIndexExist()) throw new Error('.cache/index.json is not exist!');

  const index = await _readIndexFile();
  return !!index[cacheKey.filename]?.some((key) => key === cacheKey.key);
};

////----
export const createCache = async () => {
  if (!_isCacheIndexExist()) {
    await _createCacheIndex();
  }
};
export const readCache = async (res: puppeteer.HTTPResponse) => {
  const cacheKey = _createCacheKey(res);
  console.log(cacheKey);
  if (await _isCached(cacheKey)) {
    const cached = await _readCacheFile(cacheKey.filename);
    return cached[cacheKey.key];
  } else {
    if (!_isCacheFileExist(cacheKey.filename)) {
      await _createCacheFile(cacheKey.filename);
    }
    await _updateIndexFile(cacheKey);
    const cached = { [cacheKey.key]: await res.json() };
    await _updateCacheFile(cacheKey.filename, cached);
    return cached[cacheKey.key];
  }
};

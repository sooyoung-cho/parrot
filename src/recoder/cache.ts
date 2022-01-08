import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { CACHE_ROOT } from '../constants';
import { CacheEntity, CacheIndexEntity, CacheKey } from './types';
import { mkdir, readFile, writeFile } from 'fs/promises';

export default class Recorder {
  private hostRootPath = '';
  private indexPath = '';
  constructor() {}
  public async set({ host }: { host: string }) {
    const siteName = new URL(host).hostname.replaceAll('.', '_');
    try {
      const hPath = path.join(CACHE_ROOT, siteName);
      if (!this.isExist(hPath)) {
        await mkdir(hPath, { recursive: true });
      }
      const iPath = path.join(CACHE_ROOT, siteName, 'index.json');
      if (!this.isExist(iPath)) {
        await writeFile(iPath, '{}', { encoding: 'utf-8' });
      }
      this.hostRootPath = hPath;
      this.indexPath = iPath;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  // >> entry
  public async run(res: puppeteer.HTTPResponse) {
    try {
      const cacheKey = this.generateCacheKey(res);
      if (await this.isCached(cacheKey)) {
        const cached = await this.readCacheFile(cacheKey);
        return cached[cacheKey.key];
      } else {
        const cached = await this.updateCache(cacheKey, res);
        return cached[cacheKey.key];
      }
    } catch (e) {
      console.error(e);
    }
  }
  // >>> utils
  private generateCacheKey(res: puppeteer.HTTPResponse): CacheKey {
    const url = new URL(res.url());
    const req = res.request();
    const filename = `${req.method()}_${url.pathname.split('/').join('_')}.json`;
    const queries = url.search;
    return {
      path: path.join(this.hostRootPath, url.pathname),
      filename,
      key: queries === '' ? '.' : queries,
    };
  }
  private async isCached(cacheKey: CacheKey) {
    const rawIndex = await readFile(this.indexPath, { encoding: 'utf-8' });
    const index = JSON.parse(rawIndex) as CacheIndexEntity;
    return !!index[cacheKey.filename]?.find((key) => key === cacheKey.key);
  }

  private async createCacheFile(cacheKey: CacheKey, cache?: string) {
    await mkdir(cacheKey.path, { recursive: true });
    await writeFile(path.join(cacheKey.path, cacheKey.filename), cache || '{}', { encoding: 'utf-8' });
  }
  private async readCacheFile(cacheKey: CacheKey) {
    const filepath = path.join(cacheKey.path, cacheKey.filename);
    const rawFile = await readFile(filepath, { encoding: 'utf-8' });
    return JSON.parse(rawFile) as CacheEntity;
  }

  private async updateCache(cacheKey: CacheKey, res: puppeteer.HTTPResponse) {
    const filepath = path.join(cacheKey.path, cacheKey.filename);
    if (!this.isExist(filepath)) {
      await this.createCacheFile(cacheKey);
    }
    const cached = await this.readCacheFile(cacheKey);

    cached[cacheKey.key] = await res.json();
    await this.createCacheFile(cacheKey, JSON.stringify(cached));
    return cached;
  }

  private isExist(p: string) {
    return fs.existsSync(p);
  }
}

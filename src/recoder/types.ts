import puppeteer from 'puppeteer';

export type DataEntity = {
  host: string;
  namespace: string;
  endpoints: Array<string>;
};

export type CacheIndexEntity = Record<string, Array<string>>; // filename: ["query1", "query2", ..]
export type CacheEntity = Record<string, puppeteer.HTTPResponse>;
export type CacheKey = { path: string; filename: string; key: string };

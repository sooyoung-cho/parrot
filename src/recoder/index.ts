import puppeteer from 'puppeteer';
import { createCache, readCache } from './cache';
import { createFilter, getData } from './util';
const intiailize = async () => {
  await createCache();
};

const run = async () => {
  await intiailize();
  const data = await getData();
  const urlFilter = createFilter(data);

  const brower = await puppeteer.launch({ headless: false });
  const page = await brower.newPage();

  page.on('response', async (res) => {
    const endpoint = res.url();
    if (urlFilter(endpoint)) {
      console.log('>> API endpoint: ', endpoint);
      return readCache(res);
    }
  });

  page.goto(data.host);
};

run();


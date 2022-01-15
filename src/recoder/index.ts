import puppeteer from 'puppeteer';
import Recorder from './cache';
import { createFilter, getData, initializeApp } from './util';

const run = async () => {
  await initializeApp();
  const data = await getData();
  const recorder = new Recorder();
  await recorder.set({ host: data.host });

  const urlFilter = createFilter(data);

  const brower = await puppeteer.launch({
    headless: false,
    args: [`--window-size=${500},${300}`, '--ignore-certificate-errors'],
  });
  const page = await brower.newPage();

  page.on('response', async (res) => {
    const endpoint = res.url();
    if (urlFilter(endpoint)) {
      return recorder.run(res);
    }
  });

  page.goto(data.host);
};

run();

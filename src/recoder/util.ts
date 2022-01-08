// NOTE: util functions are should be pure!
import path from 'path';
import { readFile } from 'fs/promises';
import { DataEntity } from './types';
import urljoin from 'url-join';

export const getData = async () => {
  try {
    const data = await readFile(path.resolve(__dirname, '../../data.json'), {
      encoding: 'utf8',
      flag: 'r',
    });
    return JSON.parse(data) as DataEntity;
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
};
export const createFilter = (data: DataEntity) => {
  const list = data.endpoints.map((e) => urljoin(data.host, data.namespace, e));
  if(data.endpoints.length === 0) list.push(urljoin(data.host, data.namespace));
  return function (current: string) {
    return list.some((url) => current.indexOf(url) > -1);
  };
};

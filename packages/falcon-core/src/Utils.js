// @flow
import fs from 'fs';
import path from 'path';
import pf from 'portfinder';

export function homedir() {
  return (
    process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] || 'HOME'
  );
}

export function getConfigPath() {
  return process.env.NODE_ENV === 'test'
    ? path.join(__dirname, '..', 'test', 'fixtures', '.tmp.sqlectron.json')
    : path.join(homedir(), '.sqlectron.json');
}

export function fileExists(filename: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.stat(filename, (err, stats) => {
      if (err) return resolve(false);
      return resolve(stats.isFile());
    });
  });
}

export function fileExistsSync(filename: string) {
  try {
    return fs.statSync(filename).isFile();
  } catch (e) {
    return false;
  }
}

export function writeFile(filename: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, err => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

export function writeJSONFile(filename: string, data: Object) {
  return writeFile(filename, JSON.stringify(data, null, 2));
}

export function writeJSONFileSync(filename: string, data: Object) {
  return fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

export function resolveHomePathToAbsolute(filename: string) {
  if (!/^~\//.test(filename)) {
    return filename;
  }

  return path.join(homedir(), filename.substring(2));
}

export function readFile(filename: string): Promise<string> {
  const filePath = resolveHomePathToAbsolute(filename);
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filePath), (err, data) => {
      if (err) return reject(err);
      return resolve(data.toString());
    });
  });
}

export function readJSONFile(filename: string): Promise<Object> {
  return readFile(filename).then(data => JSON.parse(data));
}

export function readJSONFileSync(filename: string) {
  const filePath = resolveHomePathToAbsolute(filename);
  const data = fs.readFileSync(path.resolve(filePath), { enconding: 'utf-8' });
  return JSON.parse(data.toString());
}

export function getPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    pf.getPort({ host: 'localhost' }, (err, port) => {
      if (err) return reject(err);
      return resolve(port);
    });
  });
}

const wait = time => new Promise(resolve => setTimeout(resolve, time));

export function createCancelablePromise(error: Error, timeIdle: number = 100) {
  let canceled = false;
  let discarded = false;

  return {
    async wait() {
      while (!canceled && !discarded) {
        await wait(timeIdle);
      }

      if (canceled) {
        const err = new Error(error.message || 'Promise canceled.');

        Object.getOwnPropertyNames(error).forEach(
          key => (err[key] = error[key])
        );

        throw new Error(err);
      }
    },
    cancel() {
      canceled = true;
    },
    discard() {
      discarded = true;
    }
  };
}

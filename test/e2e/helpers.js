import path from 'path';
import os from 'os';
import fs from 'fs';
import { ClientFunction, Selector } from 'testcafe';

const APP_NAME = 'Electron';

export const getPageTitle = ClientFunction(() => document.title);
export const getPageUrl = ClientFunction(() => window.location.href);
export const cardlistSelector = Selector('.CardList');
export const titleSelector = Selector('#title');
export const cardSelector = Selector('.Card');
export const scrollBottom = ClientFunction(() =>
  window.scrollTo(0, document.body.scrollHeight)
);

export function assertGoesToPageWithLinkText(t, linkText, urlRoute) {
  return t
    .click(Selector('a').withExactText(linkText))
    .expect(getPageUrl())
    .contains(urlRoute);
}

export function createNewConnection(
  t,
  connectionName = 'New Test Connection',
  databaseName = path.join(__dirname, 'temp.sqlite')
) {
  return t
    .click('[e2eData="header-create-new-connection-button"]')
    .expect(getPageUrl())
    .contains('/login')
    .expect(Selector('[e2eData="login-container"]').visible)
    .ok()
    .typeText('[e2eData="create-connection-name"]', connectionName)
    .typeText('[e2eData="create-connection-database-name"]', databaseName)
    .click('[e2eData="create-connection-submit"]')
    .click(
      Selector('a')
        .withExactText(connectionName)
        .parent()
    )
    .expect(getPageUrl())
    .contains('/content');
}

export function clearConfig() {
  const appConfigPath = (() => {
    switch (os.type()) {
      case 'Darwin':
        return path.join(
          os.homedir(),
          'Library',
          'Application Support',
          APP_NAME,
          'config.json'
        );
      case 'Windows_NT':
        return path.join(
          os.homedir(),
          process.env.APPDATA,
          APP_NAME,
          'config.json'
        );
      case 'Linux':
        return path.join(os.homedir(), '.config', APP_NAME, 'config.json');
      default:
        return path.join(os.homedir(), '.config', APP_NAME, 'config.json');
    }
  })();

  if (fs.existsSync(appConfigPath)) {
    return fs.unlinkSync(appConfigPath);
  }
}

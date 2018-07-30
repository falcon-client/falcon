import path from 'path';
import { Selector } from 'testcafe';
import {
  getPageTitle,
  getPageUrl,
  clearConfig,
  createNewConnection
} from './helpers';

fixture`Connections`.page('../../app/app.html').beforeEach(async t => {
  await clearConfig();
});

function createNewBadConnection(
  t,
  connectionName = 'New Bad Connection Test',
  databaseName = path.join(__dirname, 'badSqliteFile.db')
) {
  return t
    .click('[data-e2e="header-create-new-connection-button"]')
    .expect(getPageUrl())
    .contains('/login')
    .expect(Selector('[data-e2e="login-container"]').visible)
    .ok()
    .typeText('[data-e2e="create-connection-name"]', connectionName)
    .typeText('[data-e2e="create-connection-database-name"]', databaseName)
    .click('[data-e2e="create-connection-submit"]');
}

test('it should not handle bad sqlite files', async t => {
  await createNewBadConnection(t);
  await t.expect(getPageUrl()).contains('/login');
});

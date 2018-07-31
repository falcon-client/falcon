import path from 'path';
import { Selector } from 'testcafe';
import { createNewConnection, getPageUrl, clearConfig } from './helpers';

fixture`Connections`.page('../../app/app.html').beforeEach(async () => {
  await clearConfig();
});

const loginErrorMessageElement = Selector(
  '[data-e2e="login-error-message-box"]'
);

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

test('it should open "demo.sqlite"', async t => {
  await createNewConnection(
    t,
    'Demo SQLite Connection',
    path.join(__dirname, 'demo.sqlite')
  );
});

test('it should open "temp.sqlite"', async t => {
  await createNewConnection(
    t,
    'Temp SQLite Connection',
    path.join(__dirname, 'temp.sqlite')
  );
});

test('it should open "oracle-sample.db"', async t => {
  await createNewConnection(
    t,
    'Temp SQLite Connection',
    path.join(__dirname, 'oracle-sample.db')
  );
});

test('it should not handle bad sqlite files', async t => {
  await createNewBadConnection(t);
  await t
    .expect(getPageUrl())
    .contains('/login')
    .expect(
      loginErrorMessageElement.withExactText('"database" is not valid').visible
    )
    .ok();
});

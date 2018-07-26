import { Selector, ClientFunction } from 'testcafe';
import {
  getPageTitle,
  getPageUrl,
  cardlistSelector,
  cardSelector,
  scrollBottom
} from './helpers';

fixture`Login`.page('../../app/app.html');

test('it should have the expected title', async t => {
  await t.expect(getPageTitle()).eql('Falcon');
});

test('it should load structure page', async t => {
  await t
    .click(Selector('a').withExactText('Structure'))
    .expect(getPageUrl())
    .contains('/structure');
});

test('it should load query page', async t => {
  await t
    .click(Selector('a').withExactText('Query'))
    .expect(getPageUrl())
    .contains('/query');
});

test('it should load logs page', async t => {
  await t
    .click(Selector('a').withExactText('Logs'))
    .expect(getPageUrl())
    .contains('/logs');
});

test.skip('it should create a new connection', async t => {
  await t
    .click('[data-e2e="header-create-new-connection-button"]')
    .expect(getPageUrl())
    .contains('/login')
    .expect(Selector('[data-e2e="login-container"]').visible)
    .ok()
    .typeText('[data-e2e="create-connection-connection-name"]', 'Foo connection')
    .typeText('[data-e2e="create-connection-database-name"]', 'foobar')
    .click('[data-e2e="create-connection-submit"]')
    .click(Selector('a').withExactText('Foo Connection').parent());
});

test.skip('it should refresh connection', async t => {
  const url = await getPageUrl();
  await t
    .eval(() => {
      window.location.reload()
    })
  await t
    .click('[data-e2e="header-connection-refresh-button"]');
  await t
    .expect(url)
    .eql(await getPageUrl());
});

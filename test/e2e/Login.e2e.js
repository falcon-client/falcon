import path from 'path';
import { Selector } from 'testcafe';
import {
  getPageTitle,
  getPageUrl,
  clearConfig,
  createNewConnection
} from './helpers';

fixture`Login`.page('../../app/app.html').beforeEach(async t => {
  await clearConfig();
  await createNewConnection(t);
});

function assertGoesToPageWithLinkText(t, linkText, urlRoute) {
  return t
    .click(Selector('a').withExactText(linkText))
    .expect(getPageUrl())
    .contains(urlRoute);
}

test('it should have the expected title', async t => {
  await t.expect(getPageTitle()).eql('Falcon');
});

test('it should load structure page', async t => {
  await assertGoesToPageWithLinkText(t, 'Structure', '/structure');
});

test('it should load query page', async t => {
  await assertGoesToPageWithLinkText(t, 'Query', '/query');
});

test('it should load logs page', async t => {
  await assertGoesToPageWithLinkText(t, 'Logs', '/logs');
});

test('it should load graph page', async t => {
  await assertGoesToPageWithLinkText(t, 'Graph', '/graph');
});

test('it should refresh connection', async t => {
  const url = await getPageUrl();
  await t.click('[data-e2e="header-connection-refresh-button"]');
  await t.expect(url).eql(await getPageUrl());
});

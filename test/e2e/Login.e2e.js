import path from 'path';
import { Selector } from 'testcafe';
import {
  getPageTitle,
  getPageUrl,
  clearConfig,
  createNewConnection,
  assertGoesToPageWithLinkText
} from './helpers';

fixture`Login`.page('../../app/app.html').beforeEach(async t => {
  await clearConfig();
  await createNewConnection(t);
});

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

async function assertGraphPageLink(t, linkText) {
  // eslint-disable-next-line
  for (const text of linkText) {
    // eslint-disable-next-line
    await t
      .expect(Selector('.graphql-voyager a').withExactText(text).visible)
      .ok();
  }
}

test('it should refresh connection', async t => {
  const url = await getPageUrl();
  await t.click('[dataE2e="header-connection-refresh-button"]');
  await t.expect(url).eql(await getPageUrl());
});

fixture`Graph`.page('../../app/app.html').beforeEach(async t => {
  await clearConfig();
  await createNewConnection(t);
  await assertGoesToPageWithLinkText(t, 'Graph', '/graph');
});

test('it should load graph page', async t => {
  await assertGraphPageLink(t, [
    'Query',
    'Album',
    'Artist',
    'Customer',
    'Employee',
    'Genre',
    'Invoice',
    'InvoiceItem',
    'MediaType',
    'Playlist',
    'Track'
  ]);
});

test('it should refresh connection', async t => {
  const url = await getPageUrl();
  await t.click('[e2eData="header-connection-refresh-button"]');
  await t.expect(url).eql(await getPageUrl());
});

test('it should load graph page for different connection', async t => {
  await createNewConnection(t, 'Bar', path.join(__dirname, 'oracle-sample.db'));
  await t.click(Selector('a').withExactText('Bar'));
  await assertGoesToPageWithLinkText(t, 'Graph', '/graph');
  await assertGraphPageLink(t, ['Query', 'Dept', 'Emp']);
});

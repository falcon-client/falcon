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

import path from 'path';
import { config } from '../src';
import { readJSONFile, writeJSONFile } from '../src/Utils';

const FIXTURE_PATH = path.join(__dirname, 'fixtures', '.sqlectron.json');
const TMP_FIXTURE_PATH = path.join(
  __dirname,
  'fixtures',
  '.tmp.sqlectron.json'
);

function loadConfig() {
  return readJSONFile(TMP_FIXTURE_PATH);
}

// BUG: getConfigPath() isnt mocked properly. Investigate
describe('config', () => {
  describe('.prepare', () => {
    beforeEach(async () => {
      const data = await readJSONFile(FIXTURE_PATH);
      await writeJSONFile(TMP_FIXTURE_PATH, data);
    });

    it('should include id for those servers without it', async () => {
      const findItem = data =>
        data.servers.find(srv => srv.name === 'without-id');

      const fixtureBefore = await loadConfig();
      await config.prepare();
      const fixtureAfter = await loadConfig();

      expect(findItem(fixtureBefore)).toMatchSnapshot();
      expect(findItem(fixtureAfter)).toHaveProperty('id');
    });
  });
});

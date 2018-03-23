import path from 'path';
import { servers } from '../src';
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

describe.skip('servers', () => {
  beforeEach(async () => {
    const data = await readJSONFile(FIXTURE_PATH);
    await writeJSONFile(TMP_FIXTURE_PATH, data);
  });

  describe('.getAll', () => {
    it('should load servers from file', async () => {
      const fixture = await loadConfig();
      const result = await servers.getAll();
      expect(result).toEqual(fixture.servers);
    });
  });

  describe('.add', () => {
    it('should add new server', async () => {
      const configBefore = await loadConfig();
      const newServer = {
        name: 'My New Mysql Server',
        client: 'mysql',
        ssl: true,
        host: '10.10.10.15',
        port: 3306,
        database: 'authentication',
        user: 'root',
        password: 'password'
      };
      const createdServer = await servers.add(newServer);
      expect(createdServer).toHaveProperty('id');
      delete createdServer.id;
      expect(createdServer).toEqual(newServer);

      const configAfter = await loadConfig();
      expect(configAfter.servers).toHaveLength(configBefore.servers.length + 1);
    });

    it('should add new server with ssh', async () => {
      const configBefore = await loadConfig();
      const newServer = {
        name: 'My New Mysql Server',
        client: 'mysql',
        ssl: true,
        host: '10.10.10.15',
        port: 3306,
        database: 'authentication',
        user: 'root',
        password: 'password',
        ssh: {
          host: '10.10.10.10',
          port: 22,
          user: 'root',
          privateKey: '~/.ssh/id_rsa',
          privateKeyWithPassphrase: true
        }
      };
      const createdServer = await servers.add(newServer);
      expect(createdServer).toHaveProperty('id');
      delete createdServer.id;
      expect(createdServer).toEqual(newServer);

      const configAfter = await loadConfig();
      expect(configAfter.servers).toHaveLength(configBefore.servers.length + 1);
    });
  });

  describe('.update', () => {
    it('should update existing server', async () => {
      const id = 'ed2d52a7-d8ff-4fdd-897a-7033dee598f4';
      const configBefore = await loadConfig();
      const serverToUpdate = {
        id,
        name: 'mysql-vm',
        client: 'mysql',
        ssl: false,
        host: '10.10.10.10',
        port: 3306,
        database: 'mydb',
        user: 'usr',
        password: 'pwd'
      };
      const updatedServer = await servers.update(serverToUpdate);
      expect(updatedServer).toEqual(serverToUpdate);

      const configAfter = await loadConfig();
      expect(configAfter.servers).toHaveLength(configBefore.servers.length);
      expect(configAfter.servers.find(srv => srv.id === id)).toEqual(
        serverToUpdate
      );
    });
  });

  describe('.addOrUpdate', () => {
    describe('given is a new server', () => {
      it('should add the new server', async () => {
        const configBefore = await loadConfig();
        const newServer = {
          name: 'My New Mysql Server',
          client: 'mysql',
          ssl: false,
          host: '10.10.10.15',
          port: 3306,
          database: 'authentication',
          user: 'root',
          password: 'password'
        };
        const createdServer = await servers.addOrUpdate(newServer);
        expect(createdServer).toHaveProperty('id');
        delete createdServer.id;
        expect(createdServer).toEqual(newServer);

        const configAfter = await loadConfig();
        expect(configAfter.servers).toHaveLength(
          configBefore.servers.length + 1
        );
      });
    });

    describe('given is an existing server', () => {
      it('should update this existing server', async () => {
        const configBefore = await loadConfig();
        const id = 'ed2d52a7-d8ff-4fdd-897a-7033dee598f4';
        const serverToUpdate = {
          id,
          name: 'mysql-vm',
          client: 'mysql',
          ssl: false,
          host: '10.10.10.10',
          port: 3306,
          database: 'mydb',
          user: 'usr',
          password: 'pwd'
        };
        const updatedServer = await servers.addOrUpdate(serverToUpdate);
        expect(updatedServer).toEqual(serverToUpdate);

        const configAfter = await loadConfig();
        expect(configAfter.servers).toHaveLength(configBefore.servers.length);
        expect(configAfter.servers.find(srv => srv.id === id)).toEqual(
          serverToUpdate
        );
      });
    });
  });

  describe('.remove', () => {
    it('should remove an existing server', async () => {
      const configBefore = await loadConfig();
      await servers.removeById('c94cbafa-8977-4142-9f34-c84d382d8731');
      const configAfter = await loadConfig();

      expect(configAfter.servers).toHaveLength(configBefore.servers.length - 1);
      expect(configAfter.servers.find(srv => srv.name === 'pg-vm')).toEqual(
        undefined
      );
    });
  });
});

// @flow
/* eslint no-await-in-loop: 0 */
import Connections from '../src/config/ConnectionManager';

async function connectionFactory(connections, connectionCount: number = 1) {
  const array = new Array(connectionCount);
  for (let i = 0; i < array.length; i++) {
    array[i] = await connections.add({
      id: `test-id-${i + 1}`,
      type: 'sqlite',
      name: `test-connection-${i + 1}`,
      database: '/Users/amila/Desktop/demo.sqlite'
    });
  }
  return Promise.all(array);
}

describe('Connections', function testConnections() {
  beforeEach(async () => {
    this.connections = new Connections();
    await connectionFactory(this.connections, 3);
  });

  afterEach(async () => {
    await this.connections.removeAll();
  });

  it('should get all connections', async () => {
    const connections = await this.connections.getAll();
    expect(connections).toMatchSnapshot();
  });

  it('should delete a single connection', async () => {
    const connections = await this.connections.getAll();
    const connectionIdToDelete = connections[0].id;
    await this.connections.remove(connectionIdToDelete);
    const newConnections = await this.connections.getAll();
    expect(newConnections).toMatchSnapshot();
  });

  it('should update a single connection', async () => {
    const connections = await this.connections.getAll();
    const connectionIdToDelete = connections[0].id;
    await this.connections.update(connectionIdToDelete, {
      id: 'test-id-foo',
      name: 'test-connection-foo',
      password: 'test-password',
      type: 'sqlite'
    });
    const newConnections = await this.connections.getAll();
    expect(newConnections).toMatchSnapshot();
  });

  it('should get a single connection', async () => {
    const connections = await this.connections.getAll();
    const connectionId = connections[2].id;
    const connection = await this.connections.get(connectionId);
    expect(connection).toMatchSnapshot();
  });

  it('should perform basic validation', async () => {
    expect(() => {
      this.connections.validateBeforeCreation({
        id: 12,
        database: 'aJ@#LJ#@KL$KL@#sdf',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.connections.validateBeforeCreation({
        id: 12,
        database: '/usr/foo',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.connections.validateBeforeCreation({
        id: 'foo',
        database: '/usr/foo',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.connections.validateBeforeCreation({
        id: 'foo',
        name: 'foo',
        database: '/usr/foo',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.connections.validateBeforeCreation({
        id: 'foo',
        name: 'foo',
        database: '/usr/local/bin/npm',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
  });

  it('should check if a sqlite file is valid or not', async () => {
    expect(
      this.connections.validateBeforeCreation({
        id: 'foo',
        name: 'foo',
        database: '/Users/amila/Desktop/demo.sqlite',
        type: 'sqlite'
      })
    ).toEqual(undefined);
  });
});

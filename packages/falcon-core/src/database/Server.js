// @flow
import Client from './Client';
import { CLIENTS } from './provider_clients';
import type {
  ProviderInterface,
  databasesType
} from './provider_clients/ProviderInterface';

type serverType = {
  db: { [dbName: string]: ProviderInterface },
  sshTunnel?: { close: () => void }
};

/**
 * The config passed by the user to the external createServer() API
 */
type serverConfigType = {
  +database: string,
  +client: databasesType,
  +socketPath?: string,
  +host?: string
};

/**
 * Create and persist a server session. Returns a server object that
 * contains this state.
 *
 * This API is exposed to users. Users pass the configuration of their
 * server to this function
 */
export function createServer(serverConfig: serverConfigType) {
  if (!serverConfig) {
    throw new Error('Missing server configuration');
  }

  if (!CLIENTS.some(cli => cli.key === serverConfig.client)) {
    throw new Error(`Invalid SQL client: "${serverConfig.client}"`);
  }

  const server: serverType = {
    /**
     * All connected dbs. This is the 'connection pool'
     */
    db: {},

    config: {
      ...serverConfig,
      host: serverConfig.host || serverConfig.socketPath
    }
  };

  /**
   * Server public API
   */
  return {
    /**
     * Retrieve the database connection pool if it exists
     * @TODO: Use use Map as dictionary instead of object literal
     */
    db(dbName: string): ProviderInterface {
      if (dbName in server.db) {
        return server.db[dbName];
      }
      throw new Error('DB does not exist in databse connection pool');
    },

    /**
     * Kill the server and close the ssh tunnel
     */
    end() {
      // disconnect from all DBs
      Object.keys(server.db).forEach(key => server.db[key].disconnect());

      // close SSH tunnel
      if (server.sshTunnel) {
        server.sshTunnel.close();
        server.sshTunnel = null;
      }
    },

    /**
     * After the server session has been created, connect to a given
     * database
     */
    async createConnection(dbName: string): Promise<ProviderInterface> {
      // If connection to database already exists in pool, return in
      if (server.db[dbName]) {
        return server.db[dbName];
      }

      const database = {
        database: dbName,
        connection: null,
        connecting: false
      };

      // Add the connection to the 'connection pool'
      server.db[dbName] = await Client(server, database);
      // @TODO: Handles only sqlite/sqlite3/db files
      return server.db[dbName];
    }
  };
}

export default createServer;

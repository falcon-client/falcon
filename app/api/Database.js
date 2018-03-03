// @flow
import { db } from 'falcon-core';
import path from 'path';
import type { exportOptionsType, ProviderInterface } from 'falcon-core';

/**
 * @TODO: Make this the default export. Classese are a better choice for
 *        database connections, which are stateful. They require a constant
 *        connunication with the database. A purely functional approach would require
 *        Killing the database connection after each request, which isn't all
 *        that performant
 *
 * @TODO: Consider using **object pools**
 *
 * This class should be treated as a singleton. Creating multiple connections will waste
 * memory.
 */
export type TableColumnType = {
  cid: number,
  name: string,
  type: string,
  notnull: 0 | 1,
  dflt_value: string | null,
  pk: 0 | 1 | 2
};

export default class Database {
  /**
   * @HACK: The database is temporarily hardcoded to a fixed sqlite database.
   *        This is just for demo purposes for the time being
   */
  constructor(type: string, database: string) {
    this.config = {
      serverInfo: {
        database,
        client: 'sqlite'
      }
    };
    this.session = db.createServer(this.config.serverInfo);
  }

  async connect() {
    this.connection = await this.session.createConnection(
      this.config.serverInfo.database
    );
    if (!this.connection) {
      throw new Error('Connection has not been established yet');
    }
    this.connection.connect(this.config.serverInfo);
  }
}

/**
 * Creates a test connection and attempts an operation. If an error occurs,
 * returns the error message thrown by falcon-core. Otherwise return true
 */
export async function verifySqlite(
  databasePath: string
): Promise<string | true> {
  try {
    const serverInfo = {
      database: databasePath,
      client: 'sqlite'
    };
    const serverSession = db.createServer(serverInfo);
    const connection = await serverSession.createConnection(databasePath);
    await connection.connect(serverInfo);
    await connection.executeQuery('pragma schema_version');
    return true;
  } catch (e) {
    return e.message;
  }
}

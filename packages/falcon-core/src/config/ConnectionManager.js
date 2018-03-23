// @flow
// Manage saved connections to databases. Encrypts passwords
import BaseManager from './BaseManager';
import sqliteConnectionValidation from './validation/SqliteConnectionValidation';
import type { ManagerInterface } from './ManagerInterface';
import type { databasesType } from '../database/provider_clients/ProviderInterface';

export type connectionValidationType = {
  passed: boolean,
  data?: {
    connection: connectionType
  },
  errorMessages: Array<{
    fieldName: string,
    message: string
  }>,
};

export type connectionType = {
  // The internal id for the connection
  id: string,
  // The name of the connection
  name: string,
  // The color of the connection
  color?: string | 'default',
  // Which database the connection is for
  type: databasesType,
  // An optional database to connect to
  database?: string,
  // These are properties that are specific to certain databases.
  // The pervious properties are required for all databases
  meta?: {
    password?: string,
    database?: string,
    port?: number,
    host?: string,
    username?: string,
    [otherKeys: string]: string
  }
};

/**
 * This class is a general manager for falcon database connections.
 * It can be extended to fit the needs of specific databases. For
 * example, if a specific database requires encryption, the .get()
 * method can be modified
 */
export default class ConnectionManager<T> extends BaseManager
  implements ManagerInterface<T> {
  itemType = 'connections';

  /**
   * @TODO
   * @private
   */
  async validateBeforeCreation(connection: connectionType) {
    switch (connection.type) {
      case 'sqlite': {
        await sqliteConnectionValidation(connection);
        break;
      }
      default: {
        throw new Error(
          `Unknown database type "${
            connection.type
          }". This probably means it is not supported`
        );
      }
    }
  }
}

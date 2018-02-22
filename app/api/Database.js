// @flow
import { db } from 'falcon-core';
import path from 'path';
import type { exportOptionsType, ProviderInterfaceType } from 'falcon-core';
import type { DatabaseType } from '../types/DatabaseType';

// const electron = require('electron');
// console.log(electron);
// console.log(electron.remote);
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

type configType = {
  serverInfo: {
    database: string
  }
};

export type TableColumnType = {
  cid: number,
  name: string,
  type: string,
  notnull: 0 | 1,
  dflt_value: string | null,
  pk: 0 | 1
};

// Interface used by Falcon to interact with connected database
export type DatabaseApiType = {
  connection: {
    client: 'sqlite' | 'mysql' | 'postgresql',
    connect: configType => void,
    executeQuery: (
      conn: string
    ) => Promise<Array<ProviderInterfaceType.queryResponseType>>
  },
  config: configType,
  session: {
    createConnection: string => ProviderInterfaceType
  },
  connect: () => void,
  sendQueryToDatabase: (
    query: string
  ) => Promise<Array<ProviderInterfaceType.queryResponseType>>,
  getTableColumns: (
    table: string,
    raw: boolean
  ) => Promise<Array<TableColumnType>>,
  getPrimaryKeyColumn: (table: string) => Promise<TableColumnType>,
  insertRows: (table: string, values: { [string]: any }) => void,
  deleteRows: (table: string, keys: Array<string> | Array<number>) => void,
  renameTable: (oldTableName: string, newTableName: string) => Promise<boolean>,
  dropTable: (table: string) => Promise<string>,
  addTableColumn: (
    table: string,
    columnName: string,
    columnType: string
  ) => Promise<string>,
  renameTableColumns: (
    table: string,
    columns: Array<{ oldColumnName: string, newColumnName: string }>
  ) => Promise<string>,
  dropTableColumns: (
    table: string,
    columnsToDrop: Array<string>
  ) => Promise<string>,
  getDatabasePrimaryKeys: () => Array<{tableName: string, primaryKey: string}>
};

/**
 * Adapter between falcon's table and its backend
 */
export class Database {
  /**
   * @TODO: Write a flow-typed definition for falcon-core so we can just import
   *        the type here. Migrate from weak types
   */
  connection: {
    client: 'sqlite' | 'mysql' | 'postgresql',
    connect: configType => void,
    executeQuery: (
      conn: string
    ) => Promise<Array<ProviderInterfaceType.queryResponseType>>,
    getTableColumns: (
      table: string,
      raw: boolean
    ) => Promise<Array<TableColumnType>>,
    getPrimaryKeyColumn: (table: string) => Promise<TableColumnType>,
    delete: (
      table: string,
      keys: Array<string> | Array<number>
    ) => Promise<boolean>,
    insert: (
      table: string,
      values: Array<{ [string]: any }>
    ) => Promise<boolean>,
    update: (
      table: string,
      records: Array<{ rowPrimaryKeyValue: string, changes: { [string]: any } }>
    ) => Promise<boolean>,
    renameTable: (
      oldTableName: string,
      newTableName: string
    ) => Promise<boolean>,
    dropTable: (table: string) => Promise<string>,
    addTableColumn: (
      table: string,
      columnName: string,
      columnType: string
    ) => Promise<string>,
    renameTableColumns: (
      table: string,
      columns: Array<{ oldColumnName: string, newColumnName: string }>
    ) => Promise<string>,
    dropTableColumns: (
      table: string,
      columnsToDrop: Array<string>
    ) => Promise<string>
  };

  config: configType;

  // @TODO
  // pool: Map<string, { databaseName: string }>

  session: {
    createConnection: (databaseName: string) => ProviderInterfaceType
  };

  /**
   * @HACK: The database is temporarily hardcoded to a fixed sqlite database.
   *        This is just for demo purposes for the time being
   */
  constructor(databasePath: string) {
    this.config = {
      serverInfo: {
        database: databasePath,
        client: 'sqlite'
      }
    };
    this.session = db.createServer(this.config.serverInfo);
  }

  async connect() {
    this.connection = await this.session.createConnection(this.config.serverInfo.database);
    if (!this.connection) {
      throw new Error('Connection has not been established yet');
    }
    this.connection.connect(this.config.serverInfo);
  }

  async sendQueryToDatabase(query: string): Promise<Array<ProviderInterfaceType.queryResponseType>> {
    return this.connection.executeQuery(query);
  }

  async getTableColumns(
    table: string,
    raw: boolean = false
  ): Promise<Array<TableColumnType>> {
    return this.connection.getTableColumns(table, raw);
  }

  async getPrimaryKeyColumn(table: string): Promise<TableColumnType> {
    return this.connection.getPrimaryKeyColumn(table);
  }

  /**
   * Deletes rows in a tables. If keys are empty, will do nothing
   * @TODO: Method assumes that primary key is an integer and that
   *        rows in table were created in the order the table gave it.
   *        Find a way to map index-primary key relationship
   * @param {*} table - name of the table being edited
   * @param {*} keys  - rows with these keys will be deleted
   */
  async deleteRows(table: string, keys: Array<string | number>) {
    if (keys.length === 0) {
      return;
    }
    // React Table gives 1-based indexing. if keys are numbers, need to incremt
    const incrementedKeys = keys.map(key => key + 1);
    const results = await this.connection.delete(table, incrementedKeys);
    return results;
  }

  async insertRows(tableName: string, rows: Array<{ [string]: any }>) {
    if (rows.length === 0) {
      return;
    }
    await this.connection.insert(tableName, rows);
  }

  async updateRows(
    table: string,
    records: Array<{ rowPrimaryKeyValue: string, changes: { [string]: any } }>
  ) {
    if (records.length === 0) {
      return;
    }
    await this.connection.update(table, records);
  }

  async renameTable(oldTableName: string, newTableName: string) {
    await this.connection.renameTable(oldTableName, newTableName);
  }

  async dropTable(tableName: string) {
    await this.connection.dropTable(tableName);
  }

  async addTableColumn(table: string, columnName: string, columnType: string) {
    return this.connection.addTableColumn(table, columnName, columnType);
  }

  async renameTableColumns(
    table: string,
    columns: Array<{ oldColumnName: string, newColumnName: string }>
  ) {
    return this.connection.renameTableColumns(table, columns);
  }

  async dropTableColumns(table: string, columnsToDrop: Array<string>) {
    return this.connection.dropTableColumns(table, columnsToDrop);
  }

  static getDatabases = getDatabases;
}

export async function getVersion(databasePath: string | number): Promise<string> {
  const serverInfo = {
    database: databasePath,
    client: 'sqlite'
  };

  const serverSession = db.createServer(serverInfo);
  const connection = await serverSession.createConnection(databasePath);
  await connection.connect(serverInfo);

  return connection.getVersion();
}

export async function getDatabases(databasePath: string): Promise<Array<DatabaseType>> {
  const serverInfo = {
    database: databasePath,
    client: 'sqlite'
  };
  const serverSession = db.createServer(serverInfo);
  const connection = await serverSession.createConnection(databasePath);
  await connection.connect(serverInfo);
  const databases: Array<string> = await connection.listDatabases();
  const tables: Array<string> = await connection
    .listTables()
    .then(each => each.map(s => s.name));

  return Promise.all(databases.map(databaseName =>
    // @TODO: Dynamically create connections for each table. For now, we're
    //        expecting there to be only one database, and therefore only one
    //        connection
    Promise
    // Get the values of each table
      .all(tables.map(table => connection.getTableValues(table)))
    // For each table of the current database, format the rows
      .then((databaseTableValues: Array<Array<Object>>) =>
        databaseTableValues.map((table, tableIndex) =>
          // console.log(tableIndex);
          // console.log(table);
          ({
            databaseName,
            tableName: tables[tableIndex],
            columns: Object.keys(table[0]),
            rows: table.map((value, index) => ({
              rowID: value[Object.keys(value)[index]],
              value: Object.values(value)
            }))
          }))))).then(_databases =>
    _databases.map((database, databaseIndex) => ({
      tables: database,
      // @TODO: databaseName currently returns database path rather than name
      //        Used substring to get just the name
      databaseName: databases[databaseIndex].substring(databases[databaseIndex].lastIndexOf('/') + 1)
    })));
}

/**
 * Exports the contents of an sqlite file to a path
 */
export async function exportFile(
  type: 'json' | 'csv',
  exportPath: string,
  exportOptions: exportOptionsType
): Promise<string> {
  const databasePath = path.join('app', 'demo.sqlite');
  const serverInfo = {
    database: databasePath,
    client: 'sqlite'
  };
  const serverSession = db.createServer(serverInfo);
  const connection = await serverSession.createConnection(databasePath);

  await connection.connect(serverInfo);
  switch (type) {
    case 'json':
      return connection.exportJson(exportPath, exportOptions);
    case 'csv':
      return connection.exportCsv(exportPath, exportOptions);
    default:
      throw new Error(`Invalid or unsupported export type "${type}"`);
  }
}

/**
 * Creates a test connection and attempts an operation. If an error occurs,
 * returns the error message thrown by falcon-core. Otherwise return true
 */
export async function verifySqlite(databasePath: string): Promise<string | true> {
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

/**
 * Creates a test connection and attempts an operation. If an error occurs,
 * returns the error message thrown by falcon-core. Otherwise return true
 */
export async function getTableColumns(databasePath: string, tableName: string): Promise<string | true> {
  try {
    const serverInfo = {
      database: databasePath,
      client: 'sqlite'
    };
    const serverSession = db.createServer(serverInfo);
    const connection = await serverSession.createConnection(databasePath);
    return connection.getTableColumns(tableName);
  } catch (e) {
    return e.message;
  }
}

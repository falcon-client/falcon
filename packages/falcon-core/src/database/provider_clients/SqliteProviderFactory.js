// @flow
import sqlite3 from 'sqlite3';
import getPort from 'get-port';
import cors from 'cors';
import { identify } from 'sql-query-identifier';
import type { Application } from 'express';
import createLogger from '../../Logger';
import BaseProvider from './BaseProvider';
import type {
  ProviderInterface,
  FactoryType,
  serverType,
  exportOptionsType,
  queryType,
  queryResponseType,
  databaseType,
  logType
} from './ProviderInterface';

type queryArgsType = {
  query: string,
  multiple?: boolean,
  params?: Array<string>
};

type connectionType = {
  dbConfig: {
    database: string
  },
  run: (queryText: string, args?: Array<string>, cb?: () => void) => void,
  all: (queryText: string, args?: Array<string>, cb?: () => void) => void
};

/**
 * Contains data about a column/property/key in a table
 */
type tableKeyType = {
  cid: number,
  name: string,
  type: string,
  notnull: 0 | 1,
  dflt_value: string,
  pk: 0 | 1 | 2
};

// @TODO: Why does logging in constructor vs logging in driver execute
// return two different things
class SqliteProvider extends BaseProvider implements ProviderInterface {
  connection: connectionType;

  graphQLServer: Application;

  graphQLServerPort: ?number;

  /**
   * @private
   */
  privateGraphQLServerIsRunning: boolean = false;

  constructor(server: Object, database: Object, connection: Object) {
    super(server, database);
    this.connection = connection;
  }

  // @NOT_SUPPORTED
  disconnect() {
    // SQLite does not have connection poll. So we open and close connections
    // for every query request. This allows multiple request at same time by
    // using a different thread for each connection.
    // This may cause connection limit problem. So we may have to change this at some point.
  }

  wrapIdentifier(value: string): string {
    if (value === '*') {
      return value;
    }

    const matched = value.match(/(.*?)(\[[0-9]\])/); // eslint-disable-line no-useless-escape

    return matched
      ? this.wrapIdentifier(matched[1]) + matched[2]
      : `"${value.replace(/"/g, '""')}"`;
  }

  getQuerySelectTop(table: string, limit: number) {
    return Promise.resolve(
      `SELECT * FROM ${this.wrapIdentifier(table)} LIMIT ${limit}`
    );
  }

  async getLogs(): Promise<Array<logType>> {
    return this.logs.map(log => ({
      ...log,
      query: log.query.replace(/(\r\n|\n|\r)/gm, '')
    }));
  }

  /**
   * @TODO
   */
  async setLogs() {
    return Promise.resolve();
  }

  query(queryText: string): Promise<queryType> {
    let queryConnection = null;
    const self = this;

    return Promise.resolve({
      execute() {
        return self.runWithConnection(() => {
          try {
            queryConnection = self.connection;
            return self.executeQuery(queryText);
          } catch (err) {
            if (err.code === self.CANCELED) {
              err.sqlectronError = 'CANCELED_BY_USER';
            }
            throw err;
          }
        });
      },
      cancel() {
        if (!queryConnection) {
          throw new Error('Query not ready to be canceled');
        }
        queryConnection.interrupt();
      }
    });
  }

  async executeQuery(queryText: string) {
    const result = await this.driverExecuteQuery({
      query: queryText,
      multiple: true
    });
    return result.map(this.parseRowQueryResult);
  }

  getConnectionType() {
    return Promise.resolve('local');
  }

  /**
   * Inserts a record into a table. If values is an empty object, will insert
   * an empty row
   */
  async insert(
    table: string,
    rows: Array<{ [string]: any }>
  ): Promise<{ timing: number }> {
    const tableColumns = await this.getTableColumnNames(table);
    const rowSqls = rows.map(row => {
      const rowData = tableColumns.map(
        key => (row[key] ? `'${row[key]}'` : 'NULL')
      );
      return `(${rowData.join(', ')})`;
    });
    const query = `
     INSERT INTO ${table} (${tableColumns.join(', ')})
     VALUES
     ${rowSqls.join(',\n')};
    `;
    return this.driverExecuteQuery({ query }).then(res => res.data);
  }

  /**
   * Each item in records will update new values in changes
   * @param changes - Object contaning column:newValue pairs
   * @param rowPrimaryKey - The row's (record's) identifier
   */
  async update(
    table: string,
    records: Array<{
      rowPrimaryKeyValue: string,
      changes: { [string]: any }
    }>
  ): Promise<{ timing: number }> {
    const tablePrimaryKey = await this.getPrimaryKeyColumn(table);
    const queries = records.map(record => {
      const columnNames = Object.keys(record.changes);
      const edits = columnNames.map(
        columnName => `${columnName} = '${record.changes[columnName]}'`
      );
      return `
        UPDATE ${table}
        SET ${edits.join(', ')}
        WHERE ${tablePrimaryKey.name} = ${record.rowPrimaryKeyValue};
    `;
    });
    const finalQuery = queries.join('\n');
    return this.driverExecuteQuery({ query: finalQuery }).then(res => res.data);
  }

  getGraphQLServerPort() {
    return this.graphQLServerPort;
  }

  async startGraphQLServer(): Promise<void> {
    const [graphqlHTTP, tuql, express] = await Promise.all([
      import('express-graphql'),
      import('tuql'),
      import('express')
    ]);
    const { buildSchemaFromDatabase } = tuql

    if (this.graphQLServerIsRunning()) {
      return;
    }

    const app = express();
    const schema = await buildSchemaFromDatabase(
      this.connection.dbConfig.database
    );
    const port = await getPort();
    app.use('/graphql', cors(), graphqlHTTP({ schema }));

    await new Promise(resolve => {
      this.graphQLServer = app.listen(port, () => {
        this.graphQLServerPort = port;
        console.log(` > Running at http://localhost:${port}/graphql`);
        resolve();
      });
      this.privateGraphQLServerIsRunning = true;
    });
  }

  async stopGraphQLServer(): Promise<void> {
    if (this.graphQLServerIsRunning()) {
      this.graphQLServer.close();
      this.graphQLServer = undefined;
      this.graphQLServerPort = undefined;
      this.privateGraphQLServerIsRunning = false;
    }
  }

  graphQLServerIsRunning() {
    return this.privateGraphQLServerIsRunning;
  }

  /**
   * Deletes records from a table. Finds table's primary key then deletes
   * specified columns
   */
  async delete(
    table: string,
    keys: Array<string | number>
  ): Promise<{ timing: number }> {
    const primaryKey = await this.getPrimaryKeyColumn(table);
    const conditions = keys.map(key => `${primaryKey.name} = "${key}"`);
    const query = `
      DELETE FROM ${table}
      WHERE ${conditions.join(' OR ')}
    `;
    const results = await this.driverExecuteQuery({ query }).then(
      res => res.data
    );
    return results;
  }

  getVersion(): Promise<number | string> {
    return this.driverExecuteQuery({ query: 'SELECT sqlite_version()' }).then(
      res => res.data[0]['sqlite_version()']
    );
  }

  /**
   * Gets data about columns (properties) in a table
   */
  async getTableColumns(
    table: string,
    raw: boolean = false
  ): Promise<Array<tableKeyType>> {
    const sql = `PRAGMA table_info(${table})`;
    const rawResults = this.driverExecuteQuery({ query: sql }).then(
      res => res.data
    );
    return raw ? rawResults : rawResults.then(res => res);
  }

  async getPrimaryKeyColumn(table: string): Promise<tableKeyType> {
    const columns = await this.getTableColumns(table);
    const primaryKeyColumn = columns.find(key => key.pk === 1);
    if (!primaryKeyColumn) {
      throw new Error(`No primary key exists in table ${table}`);
    }
    return primaryKeyColumn;
  }

  async getTableValues(table: string) {
    const sql = `
      SELECT *
      FROM '${table}';
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  async getTableNames() {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type='table'
    `;
    return this.driverExecuteQuery({ query: sql }).then(res =>
      res.data.map(table => table.name)
    );
  }

  /**
   * Renames a table in the database
   */
  async renameTable(oldTableName: string, newTableName: string) {
    const sql = `
      ALTER TABLE ${oldTableName}
        RENAME TO ${newTableName};
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  /**
   * Drops a table from the database
   */
  async dropTable(table: string) {
    const sql = `
      DROP TABLE ${table};
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  /**
   * Adds a column to the table
   */
  async addTableColumn(table: string, columnName: string, columnType: string) {
    const sql = `
    ALTER TABLE ${table}
      ADD COLUMN "${columnName}" ${columnType};
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  async renameTableColumns(
    table: string,
    columns: Array<{ oldColumnName: string, newColumnName: string }>
  ) {
    // Used to make verify that each columns actually exist within the table
    const originalColumns = await this.getTableColumnNames(table);
    columns.forEach(column => {
      if (!originalColumns.includes(column.oldColumnName)) {
        throw new Error(`${column.oldColumnName} is not a column in ${table}`);
      }
    });

    const propertiesArr = await this.getTablePropertiesSql(table);
    let sql = `
    PRAGMA foreign_keys=off;
    BEGIN TRANSACTION;
    ALTER TABLE ${table} RENAME TO ${table}_temp;


    CREATE TABLE ${table} (${propertiesArr.join()}
    );

    INSERT INTO ${table} (${originalColumns.join(', ')})
      SELECT ${originalColumns.join(', ')}
      FROM ${table}_temp;

    DROP TABLE ${table}_temp;

    COMMIT;
    PRAGMA foreign_keys=on;`;

    // @TODO: Can probably make this more efficient
    columns.forEach(column => {
      sql = sql.replace(column.oldColumnName, column.newColumnName);
    });

    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  /**
   * Drops columns from a table. Does this by creating a new table then
   * importing the data from the original and ignorng columnsToDrop
   * @param {*} table the table to drop columns from
   * @param {*} columnsToDrop array of columns which client wants to drop
   */
  async dropTableColumns(table: string, columnsToDrop: Array<string>) {
    const temp = await this.getTableColumnNames(table);

    columnsToDrop.forEach(e => {
      if (!temp.includes(e)) {
        throw new Error(`${e} is not a column in ${table}`);
      }
    });

    const permittedColumns = temp.filter(col => !columnsToDrop.includes(col));
    // Create an sql statement that creates a new table excluding dropped columns
    const propertiesArr = await this.getTablePropertiesSql(table);
    const filteredPropertiesArr = propertiesArr.filter(
      row =>
        !columnsToDrop.includes(
          row.substring(row.indexOf('"') + 1, row.lastIndexOf('"'))
        )
    );
    const sql = `
    PRAGMA foreign_keys=off;
    BEGIN TRANSACTION;
    ALTER TABLE ${table} RENAME TO ${table}_temp;


    CREATE TABLE ${table} (${filteredPropertiesArr.join()}
    );

    INSERT INTO ${table} (${permittedColumns.join(', ')})
      SELECT ${permittedColumns.join(', ')}
      FROM ${table}_temp;

    DROP TABLE ${table}_temp;

    COMMIT;
    PRAGMA foreign_keys=on;`;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  /**
   * Returns the sql statement to generate this table. Returns it in a uniform
   * format
   * Format - after "(", each column creation and foreign key constraint
   * will be in its own line
   */
  async getCreateTableSql(table: string): Promise<string> {
    const createTableArgs = await this.getTablePropertiesSql(table);
    return `CREATE TABLE ${table} (${createTableArgs.join()})`;
  }

  /**
   * Used to get the arguments within a CREATE TABLE table(...)
   * in a format such that getCreateTableSql() and dropTable() can
   */
  async getTablePropertiesSql(table: string): Promise<Array<String>> {
    const sql = `
      SELECT sql
      FROM sqlite_master
      WHERE name='${table}';
    `;
    const creationScript = await this.driverExecuteQuery({
      query: sql
    }).then(res => res.data[0].sql.trim());

    // Gets all the text between '(' and ')' of script
    const betweenParaentheses = creationScript
      .substring(creationScript.indexOf('(') + 1)
      .replace(/\)$/, '')
      .split(',');

    // Formats each argument to start on a new line with no extra white space
    // and wraps the column name in an "<identifier>" format. Does not
    // wrap constraints
    return betweenParaentheses.map(
      row =>
        `\n\t${
          row.includes('PRIMARY') || row.includes('FOREIGN')
            ? row
                .trim()
                .replace(/\r|\n|/g, '')
                .replace(/\s{2,}/g, ' ')
            : row
                .trim()
                .replace(/\r|\n|/g, '')
                .replace(/\s{2,}/g, ' ')
                .replace(/\[|\]|"|'/g, '')
                .replace(/\[\w+\]|"\w+"|'\w+'|\w+/, '"$&"')
        }`
    );
  }

  async listTables() {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  async listViews() {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'view'
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  // @NOT_SUPPORTED
  listRoutines() {
    return Promise.resolve([]);
  }

  async getTableColumnNames(table: string) {
    this.checkIsConnected();
    const columns = await this.listTableColumns(table);
    return columns.map(column => column.columnName);
  }

  // @TODO: Find out how this is different from getTableColumns(table)
  async listTableColumns(table: string) {
    const sql = `PRAGMA table_info(${table})`;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => ({
      columnName: row.name,
      dataType: row.type
    }));
  }

  async listTableTriggers(table: string) {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'trigger'
        AND tbl_name = '${table}'
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.name);
  }

  async listTableIndexes(table: string) {
    const sql = `PRAGMA INDEX_LIST('${table}')`;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.name);
  }

  // @NOT_SUPPORTED
  listSchemas() {
    return Promise.resolve([]);
  }

  async listDatabases() {
    const result = await this.driverExecuteQuery({
      query: 'PRAGMA database_list;'
    });

    if (!result) {
      throw new Error('No results');
    }

    return result.data.map(row => row.file || ':memory:');
  }

  // @TODO
  getTableReferences() {
    return Promise.resolve([]);
  }

  async getTableCreateScript(table: string) {
    const sql = `
      SELECT sql
      FROM sqlite_master
      WHERE name = '${table}';
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.sql);
  }

  async getViewCreateScript(view) {
    const sql = `
      SELECT sql
      FROM sqlite_master
      WHERE name = '${view}';
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.sql);
  }

  // @NOT_SUPPORTED
  async getRoutineCreateScript() {
    return '';
  }

  /**
   * SQLITE is a local file in there's no concept of being 'online'. Or
   * are we online when we can verify that the path to the sqlite database
   * exists?
   */
  isOnline() {
    return Promise.resolve(true);
  }

  truncateTable(table: string): Promise<void> {
    return this.runWithConnection(async () => {
      const truncateSingleQuery = `DELETE FROM ${table}`;

      // @TODO: Check if sqlite_sequence exists then execute:
      //        DELETE FROM sqlite_sequence WHERE name='${table}';
      const result = await this.driverExecuteQuery({
        query: truncateSingleQuery
      });
      return result;
    });
  }

  truncateAllTables(): Promise<void> {
    return this.runWithConnection(async () => {
      const tables: Array<{ name: string }> = await this.listTables();

      const truncateAllQuery = tables
        .map(
          table => `
          DELETE FROM ${table.name};
        `
        )
        .join('');

      // @TODO: Check if sqlite_sequence exists then execute:
      //        DELETE FROM sqlite_sequence WHERE name='${table}';
      const result = await this.driverExecuteQuery({ query: truncateAllQuery });
      return result;
    });
  }

  parseRowQueryResult({ data, statement, changes }): queryResponseType {
    // Fallback in case the identifier could not reconize the command
    const isSelect = Array.isArray(data);
    const rows = data || [];

    return {
      rows,
      command: statement.type || (isSelect && 'SELECT'),
      fields: Object.keys(rows[0] || {}).map(name => ({ name })),
      rowCount: rows.length,
      affectedRows: changes || 0
    };
  }

  identifyCommands(queryText) {
    try {
      return identify(queryText, { strict: false });
    } catch (err) {
      return [];
    }
  }

  /**
   * 1. Various methods use driverExecutQuery to execute sql statements.
   * 2. driverExecuteQuery creates identifyStatementsRunQuery() which uses
   * the also created runQuery()
   * 3. driverExecuteQuery calls runWithConnection(identifyStatementsRunQuery)
   * 4. runWithConnection creates a node-sqlite3 db object which uses identifyStatementsRunQuery
   * to executes the sql statement and runQuery is given to node-sqlite3 to
   * return the results of the query
   * @private
   */
  async driverExecuteQuery(queryArgs: queryArgsType): Promise<Object> {
    const runQuery = (connection: connectionType, { executionType, text }) =>
      new Promise((resolve, reject) => {
        const method = this.resolveExecutionType(executionType);
        // Callback used by node-sqlite3 to return results of query
        function queryCallback(err?: Error, data?: Object) {
          if (err) {
            return reject(err);
          }
          return resolve({
            data,
            lastID: this.lastID,
            changes: this.changes
          });
        }

        switch (method) {
          case 'run': {
            return connection.run(text, queryArgs.params || [], queryCallback);
          }
          case 'all': {
            return connection.all(text, queryArgs.params || [], queryCallback);
          }
          default: {
            throw new Error(`Unknown connection method "${method}"`);
          }
        }
      });

    // Called in runWithConnection. connection is the node-sqlite3 db object
    const identifyStatementsRunQuery = async (connection: connectionType) => {
      const statements = this.identifyCommands(queryArgs.query);
      const results = statements.map(statement =>
        runQuery(connection, statement).then(result => ({
          ...result,
          statement
        }))
      );

      return queryArgs.multiple
        ? Promise.all(results)
        : Promise.resolve(results[0]);
    };

    return this.connection.connection
      ? await identifyStatementsRunQuery(this.connection.connection)
      : this.runWithConnection(identifyStatementsRunQuery);
  }

  runWithConnection(run: () => Promise<Array<Object>>): Promise<void> {
    return new Promise((resolve, reject) => {
      sqlite3.verbose();

      const db = new sqlite3.Database(
        this.connection.dbConfig.database,
        async err => {
          if (err) {
            return reject(err);
          }

          db.on('trace', (query, duration) => {
            this.logs.push({
              query,
              duration: duration || 0,
              type: 'trace'
            });
          });
          db.on('profile', (query, duration) => {
            this.logs.push({
              query,
              duration: duration || 0,
              type: 'profile'
            });
          });

          try {
            db.serialize();
            return resolve(run(db));
          } catch (runErr) {
            reject(runErr);
          } finally {
            db.close();
          }
        }
      );
    });
  }

  /**
   * @private
   */
  resolveExecutionType(executionType: string): 'run' | 'all' {
    switch (executionType) {
      case 'MODIFICATION':
        return 'run';
      default:
        return 'all';
    }
  }

  /**
   * @private
   */
  checkUnsupported(exportOptions: exportOptionsType) {
    const unsupportedOptions = ['views', 'procedures', 'functions', 'rows'];
    const hasUnsupported = Object.keys(exportOptions).some(option =>
      unsupportedOptions.includes(option)
    );

    if (hasUnsupported) {
      throw new Error(
        `Unsupported properties passed: ${JSON.stringify(exportOptions)}`
      );
    }
  }
}

function configDatabase(server, database) {
  return {
    database: database.database
  };
}

async function SqliteFactory(
  server: serverType,
  database: databaseType
): FactoryType {
  const logger = createLogger('db:clients:sqlite');
  const dbConfig = configDatabase(server, database);
  const connection = { dbConfig };
  logger().debug('create driver client for sqlite3 with config %j', dbConfig);

  const provider = new SqliteProvider(server, database, connection);

  // Light solution to test connection with with the server
  await provider.driverExecuteQuery({ query: 'SELECT sqlite_version()' });

  return provider;
}

export default SqliteFactory;

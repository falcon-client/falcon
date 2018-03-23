/* eslint-disable */
// @TODO: Add flow annotation
import mysql from 'mysql';
import { identify } from 'sql-query-identifier';
import BaseProvider from './BaseProvider';
import createLogger from '../../Logger';
import { createCancelablePromise } from '../../Utils';
import errors from '../../Errors';
import type {
  ProviderInterface,
  FactoryType,
  serverType,
  databaseType,
  queryArgsType
} from './ProviderInterface';

type driverExecuteResponse = {
  data: Array<Object>
};

/**
 * @TODO: Why are we using this.connection.connection? Seems hard to follow
 *        Refactor to use just this.connection instead
 *
 *        Add typings for the responses of driverExecuteQuery(). Each response
 *        is different
 */
class MysqlProvider extends BaseProvider implements ProviderInterface {
  mysqlErrors = {
    EMPTY_QUERY: 'ER_EMPTY_QUERY',
    CONNECTION_LOST: 'PROTOCOL_CONNECTION_LOST'
  };

  connection: {
    connection: {
      pool: {},
      query: (
        query: string,
        args: Array<string>,
        cb: (
          err?: Error,
          data: Array<{
            column_name: string,
            data_type: string,

            scheme: string
          }>,
          fields: Array<string>
        ) => void
      ) => void
    },
    pool: {
      end: () => void,
      getConnection: (cb: (errPool, connection) => void) => void
    }
  };

  constructor(server: serverType, database: databaseType, connection) {
    super(server, database);
    this.connection = connection;
  }

  disconnect() {
    this.connection.pool.end();
  }

  async runWithConnection(run) {
    const { pool } = this.connection;
    let rejected = false;

    return new Promise((resolve, reject) => {
      const rejectErr = err => {
        if (!rejected) {
          rejected = true;
          reject(err);
        }
      };

      return pool.getConnection(async (errPool, _connection) => {
        if (errPool) {
          return rejectErr(errPool);
        }

        _connection.on('error', error => {
          // it will be handled later in the next query execution
          logger().error('Connection fatal error %j', error);
        });

        try {
          resolve(await run(_connection));
        } catch (err) {
          rejectErr(err);
        } finally {
          _connection.release();
        }

        return _connection;
      });
    });
  }

  getRealError(err: Error) {
    /* eslint no-underscore-dangle: 0 */
    return this.connection &&
      this.connection._protocol &&
      this.connection._protocol._fatalError
      ? this.connection._protocol._fatalError
      : err;
  }

  driverExecuteQuery(queryArgs: queryArgsType): Promise<driverExecuteResponse> {
    const runQuery = connection =>
      new Promise((resolve, reject) => {
        connection.query(
          queryArgs.query,
          queryArgs.params,
          (err?: Error, data?: Array<{ scheme: string }>, fields) => {
            if (err && err.code === this.mysqlErrors.EMPTY_QUERY) {
              return resolve({});
            }
            if (err) return reject(this.getRealError(connection, err));

            return resolve({ data, fields });
          }
        );
      });

    return this.connection.connection
      ? runQuery(this.connection.connection)
      : this.runWithConnection(runQuery);
  }

  async listTables() {
    const sql = `
      SELECT table_name as name
      FROM information_schema.tables
      WHERE table_schema = database()
      AND table_type NOT LIKE '%VIEW%'
      ORDER BY table_name
    `;

    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  listViews() {
    const sql = `
      SELECT table_name as name
      FROM information_schema.views
      WHERE table_schema = database()
      ORDER BY table_name
    `;

    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  async listRoutines() {
    const sql = `
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = database()
      ORDER BY routine_name
    `;

    type res = {
      data: Array<{
        routine_type: string,
        routine_name: string
      }>
    };

    const { data }: res = await this.driverExecuteQuery({ query: sql });

    return data.map(row => ({
      routineName: row.routine_name,
      routineType: row.routine_type
    }));
  }

  async listTableColumns(table: string) {
    const sql = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = database()
      AND table_name = ?
    `;
    const params = [table];

    type res = {
      data: Array<{
        column_name: string,
        data_type: string
      }>
    };

    const { data }: res = await this.driverExecuteQuery({ query: sql, params });

    return data.map(row => ({
      columnName: row.column_name,
      dataType: row.data_type
    }));
  }

  async listTableTriggers(table: string) {
    const sql = `
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_schema = database()
      AND event_object_table = ?
    `;
    const params = [table];
    const { data } = await this.driverExecuteQuery({ query: sql, params });

    return data.map(row => row.trigger_name);
  }

  async listTableIndexes(database: string, table: string) {
    const sql = 'SHOW INDEX FROM ?? FROM ??';
    const params = [table, database];
    const { data } = await this.driverExecuteQuery({ query: sql, params });

    return data.map(row => row.Key_name);
  }

  listSchemas() {
    return Promise.resolve([]);
  }

  async getTableReferences(table: string) {
    const sql = `
      SELECT referenced_table_name
      FROM information_schema.key_column_usage
      WHERE referenced_table_name IS NOT NULL
      AND table_schema = database()
      AND table_name = ?
    `;
    const params = [table];
    const { data } = await this.driverExecuteQuery({ query: sql, params });

    return data.map(row => row.referenced_table_name);
  }

  async getTableColumns(database: string, table: string) {
    const sql = `
      SELECT constraint_name, column_name, referenced_table_name,
        CASE WHEN (referenced_table_name IS NOT NULL) THEN 'FOREIGN'
        ELSE constraint_name
        END as key_type
      FROM information_schema.key_column_usage
      WHERE table_schema = database()
      AND table_name = ?
      AND ((referenced_table_name IS NOT NULL) OR constraint_name LIKE '%PRIMARY%')
    `;
    const params = [table];
    const { data } = await this.driverExecuteQuery({ query: sql, params });

    return data.map(row => ({
      constraintName: `${row.constraint_name} KEY`,
      columnName: row.column_name,
      referencedTable: row.referenced_table_name,
      keyType: `${row.key_type} KEY`
    }));
  }

  async getTableValues(tableName: string) {
    const sql = `
      SELECT * FROM ${tableName};
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });
    return data;
  }

  getQuerySelectTop(table: string, limit: number) {
    return `SELECT * FROM ${this.wrapIdentifier(table)} LIMIT ${limit}`;
  }

  filterDatabase(item, { database } = {}, databaseField) {
    if (!database) {
      return true;
    }

    const value = item[databaseField];
    if (typeof database === 'string') {
      return database === value;
    }

    const { only } = database;

    return !(only && only.length);
  }

  async executeQuery(queryText: string) {
    const { fields, data } = await this.driverExecuteQuery({
      query: queryText
    });
    if (!data) {
      return [];
    }

    const commands = this.identifyCommands(queryText).map(item => item.type);

    if (!this.isMultipleQuery(fields)) {
      return [this.parseRowQueryResult(data, fields, commands[0])];
    }

    return data.map((_, index) =>
      this.parseRowQueryResult(data[index], fields[index], commands[index])
    );
  }

  query(queryText: string) {
    let pid = null;
    let canceling = false;
    const cancelable = createCancelablePromise({
      ...errors.CANCELED_BY_USER,
      sqlectronError: 'CANCELED_BY_USER'
    });

    return {
      execute() {
        return this.runWithConnection(async connection => {
          const connectionClient = { connection };
          const { data: dataPid } = await this.driverExecuteQuery(
            connectionClient,
            {
              query: 'SELECT connection_id() AS pid'
            }
          );

          pid = dataPid[0].pid;

          try {
            const data = await Promise.race([
              cancelable.wait(),
              this.executeQuery(connectionClient, queryText)
            ]);

            pid = null;

            return data;
          } catch (err) {
            if (canceling && err.code === this.mysqlErrors.CONNECTION_LOST) {
              canceling = false;
              err.sqlectronError = 'CANCELED_BY_USER';
            }

            throw err;
          } finally {
            cancelable.discard();
          }
        });
      },

      async cancel() {
        if (!pid) {
          throw new Error('Query not ready to be canceled');
        }

        canceling = true;

        try {
          await this.driverExecuteQuery({
            query: `kill ${pid};`
          });
          cancelable.cancel();
        } catch (err) {
          canceling = false;
          throw new Error(err);
        }
      }
    };
  }

  async listDatabases(filter) {
    const sql = 'show databases';
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data
      .filter(item => this.filterDatabase(item, filter, 'Database'))
      .map(row => row.Database);
  }

  async getTableCreateScript(table: string) {
    const sql = `SHOW CREATE TABLE ${table}`;
    const { data } = await this.driverExecuteQuery({ query: sql });
    return data.map(row => row['Create Table']);
  }

  async getViewCreateScript(view) {
    const sql = `SHOW CREATE VIEW ${view}`;
    const { data } = await this.driverExecuteQuery({ query: sql });
    return data.map(row => row['Create View']);
  }

  async getRoutineCreateScript(routine, type: string) {
    const sql = `SHOW CREATE ${type.toUpperCase()} ${routine}`;
    const { data } = await this.driverExecuteQuery({ query: sql });
    return data.map(row => row[`Create ${type}`]);
  }

  wrapIdentifier(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  }

  async getSchema(): Promise<string> {
    const sql = "SELECT database() AS 'schema'";
    const { data } = await this.driverExecuteQuery({ query: sql });
    return data[0].schema;
  }

  truncateAllTables() {
    return this.runWithConnection(async () => {
      const schema = await this.getSchema();
      const sql = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${schema}'
        AND table_type NOT LIKE '%VIEW%'
      `;

      const { data } = await this.driverExecuteQuery({ query: sql });

      const truncateAllQuery = data
        .map(
          row => `
          SET FOREIGN_KEY_CHECKS = 0;
          TRUNCATE TABLE ${this.wrapIdentifier(schema)}.${this.wrapIdentifier(
            row.table_name
          )};
          SET FOREIGN_KEY_CHECKS = 1;
        `
        )
        .join('');

      return this.driverExecuteQuery({ query: truncateAllQuery });
    });
  }

  parseRowQueryResult(data, fields, command) {
    // Fallback in case the identifier could not reconize the command
    const isSelect = Array.isArray(data);
    return {
      command: command || (isSelect && 'SELECT'),
      rows: isSelect ? data : [],
      fields: fields || [],
      rowCount: isSelect ? (data || []).length : undefined,
      affectedRows: !isSelect ? data.affectedRows : undefined
    };
  }

  isMultipleQuery(fields) {
    if (!fields) {
      return false;
    }
    if (!fields.length) {
      return false;
    }
    return Array.isArray(fields[0]) || fields[0] === undefined;
  }

  identifyCommands(queryText) {
    try {
      return identify(queryText);
    } catch (err) {
      return [];
    }
  }
}

function configDatabase(server: serverType, database: databaseType) {
  const config = {
    host: server.config.host,
    port: server.config.port,
    user: server.config.user,
    password: server.config.password,
    database: database.database,
    multipleStatements: true,
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true
  };

  if (server.sshTunnel) {
    config.host = server.config.localHost;
    config.port = server.config.localPort;
  }

  if (server.config.ssl) {
    config.ssl = {
      // It is not the best recommend way to use SSL with node-mysql
      // https://github.com/felixge/node-mysql#ssl-options
      // But this way we have compatibility with all clients.
      rejectUnauthorized: false
    };
  }

  return config;
}

async function MysqlProviderFactory(
  server: serverType,
  database: databaseType
): FactoryType {
  const databaseConfig = configDatabase(server, database);
  const logger = createLogger('db:clients:mysql');
  logger().debug(
    'create driver client for mysql with config %j',
    databaseConfig
  );

  const connection = {
    pool: mysql.createPool(databaseConfig)
  };
  const provider = new MysqlProvider(server, database, connection);

  // light solution to test connection with with the server
  await provider.driverExecuteQuery({ query: 'select version();' });

  return provider;
}

export default MysqlProviderFactory;

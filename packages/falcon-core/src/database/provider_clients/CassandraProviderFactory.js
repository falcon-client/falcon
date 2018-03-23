/* eslint-disable */
// @TODO: Add flow annotation
import { Client } from 'cassandra-driver';
import { identify } from 'sql-query-identifier';
import BaseProvider from './BaseProvider';
import createLogger from '../../Logger';
import type {
  FactoryType,
  ProviderInterface,
  serverType,
  databaseType
} from './ProviderInterface';

class CassandraProvider extends BaseProvider implements ProviderInterface {
  connection: Client;

  constructor(server, database, connection: Client) {
    super(server, database);
    this.connection = connection;
  }

  disconnect() {
    this.connection.shutdown();
  }

  listTables(database) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT table_name as name
        FROM system_schema.tables
        WHERE keyspace_name = ?
      `;
      const params = [database];
      this.connection.execute(sql, params, (err, data) => {
        if (err) return reject(err);
        return resolve(data.rows.map(row => ({ name: row.name })));
      });
    });
  }

  listViews() {
    return Promise.resolve([]);
  }

  listRoutines() {
    return Promise.resolve([]);
  }

  listTableColumns(database: string, table: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT position, column_name, type
        FROM system_schema.columns
        WHERE keyspace_name = ?
          AND table_name = ?
      `;
      const params = [database, table];
      this.connection.execute(sql, params, (err, data) => {
        if (err) return reject(err);
        return resolve(
          data.rows
            // force pks be placed at the results beginning
            .sort((a, b) => b.position - a.position)
            .map(row => ({
              columnName: row.column_name,
              dataType: row.type
            }))
        );
      });
    });
  }

  listTableTriggers() {
    return Promise.resolve([]);
  }
  listTableIndexes() {
    return Promise.resolve([]);
  }

  listSchemas() {
    return Promise.resolve([]);
  }

  getTableReferences() {
    return Promise.resolve([]);
  }

  getTableColumns(database: string, table: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT column_name
        FROM system_schema.columns
        WHERE keyspace_name = ?
          AND table_name = ?
          AND kind = 'partition_key'
        ALLOW FILTERING
      `;
      const params = [database, table];

      this.connection.execute(sql, params, (err, data) => {
        if (err) return reject(err);
        return resolve(
          data.rows.map(row => ({
            constraintName: null,
            columnName: row.column_name,
            referencedTable: null,
            keyType: 'PRIMARY KEY'
          }))
        );
      });
    });
  }

  getTableValues() {
    return Promise.resolve([]);
  }

  query() {
    throw new Error('"query" is not implementd by cassandra this.connection.');
  }

  // @TODO
  insert(database: string, table: string, objectToInsert: Object) {
    return Promise.resolve([objectToInsert]);
  }

  executeQuery(queryText: string) {
    const commands = this.identifyCommands(queryText).map(item => item.type);

    return new Promise((resolve, reject) => {
      this.connection.execute(queryText, (err, data) => {
        if (err) return reject(err);
        return resolve([this.parseRowQueryResult(data, commands[0])]);
      });
    });
  }

  listDatabases() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT keyspace_name FROM system_schema.keyspaces';
      const params = [];
      this.connection.execute(sql, params, (err, data) => {
        if (err) return reject(err);
        return resolve(data.rows.map(row => row.keyspace_name));
      });
    });
  }

  getQuerySelectTop(table: string, limit: number) {
    return Promise.resolve(
      `SELECT * FROM ${this.wrapIdentifier(table)} LIMIT ${limit}`
    );
  }

  getTableCreateScript() {
    return Promise.resolve('');
  }

  getViewCreateScript() {
    return Promise.resolve('');
  }

  getRoutineCreateScript() {
    return Promise.resolve('');
  }

  wrapIdentifier(value) {
    if (value === '*') return value;
    const matched = value.match(/(.*?)(\[[0-9]\])/); // eslint-disable-line no-useless-escape
    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
    return `"${value.replace(/"/g, '""')}"`;
  }

  async truncateAllTables(database) {
    const sql = `
      SELECT table_name
      FROM system_schema.tables
      WHERE keyspace_name = '${database}'
    `;
    const [result] = await this.executeQuery(sql);
    const tables = result.rows.map(row => row.table_name);
    const promises = tables.map(t => {
      const truncateSQL = `
      TRUNCATE TABLE ${this.wrapIdentifier(database)}.${this.wrapIdentifier(t)};
    `;
      return this.executeQuery(truncateSQL);
    });

    return Promise.all(promises);
  }

  parseRowQueryResult(data, command) {
    // Fallback in case the identifier could not reconize the command
    const isSelect = command ? command === 'SELECT' : Array.isArray(data.rows);
    return {
      command: command || (isSelect && 'SELECT'),
      rows: data.rows || [],
      fields: data.columns || [],
      rowCount: isSelect ? data.rowLength || 0 : undefined,
      affectedRows:
        !isSelect && !isNaN(data.rowLength) ? data.rowLength : undefined
    };
  }

  identifyCommands(queryText: string) {
    try {
      return identify(queryText);
    } catch (err) {
      return [];
    }
  }
}

function configDatabase(server: Object, database: Object) {
  const config = {
    contactPoints: [server.config.host],
    protocolOptions: {
      port: server.config.port
    },
    keyspace: database.database
  };

  if (server.sshTunnel) {
    config.contactPoints = [server.config.localHost];
    config.protocolOptions.port = server.config.localPort;
  }

  if (server.config.ssl) {
    // TODO: sslOptions
  }

  return config;
}

/**
 * Construct the CassandraProvider. Wait for the client to connect and then instantiate
 * the provider
 */
async function CassandraFactory(
  server: serverType,
  database: databaseType
): FactoryType {
  const dbConfig = configDatabase(server, database);
  const logger = createLogger('db:clients:cassandra');

  logger().debug('creating database client %j', dbConfig);
  const client = new Client(dbConfig);

  logger().debug('connecting');
  await client.connect();

  return new CassandraProvider(server, database, client);
}

export default CassandraFactory;

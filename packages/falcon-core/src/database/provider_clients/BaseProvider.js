// @flow
import util from 'util';
import { writeFile } from 'fs';
import json2csv from 'json2csv';
import SqliteJsonExport from 'sqlite-json-export';
import promisify from 'util.promisify';
import clients from './';
import * as config from '../../Config';
import createLogger from '../../Logger';
import type {
  serverType,
  databaseType,
  exportOptionsType,
  logType
} from './ProviderInterface';

promisify.shim();

const writeFileAsync = util.promisify(writeFile);

const logger = createLogger('db');

/**
 * Common superclass of all other providers. Contains common functionalities
 */
export default class BaseProvider {
  server: serverType;

  database: databaseType;

  logs: Array<logType> = [];

  _graphQLServerIsRunning: boolean = false;

  static DEFAULT_LIMIT: number = 1000;

  static limitSelect = null;

  constructor(server: Object, database: Object) {
    this.server = server;
    this.database = database;
  }

  async connect() {
    if (this.database.connecting) {
      throw new Error(
        'There is already a connection in progress for this server. Aborting this new request.'
      );
    }

    if (this.database.connecting) {
      throw new Error(
        'There is already a connection in progress for this database. Aborting this new request.'
      );
    }

    try {
      this.database.connecting = true;

      // terminate any previous lost connection for this DB
      if (this.database.connection) {
        this.database.connection.disconnect();
      }

      const driver = clients[this.server.config.client];
      const connection = await driver(this.server, this.database);
      this.database.connection = connection;
    } catch (err) {
      logger().error('Connection error %j', err);
      this.disconnect();
      throw err;
    } finally {
      this.database.connecting = false;
    }
  }

  buildSchemaFilter(
    { schema }: Object = {},
    schemaField: string = 'schema_name'
  ) {
    if (!schema) {
      return null;
    }

    if (typeof schema === 'string') {
      return `${schemaField} = '${schema}'`;
    }

    const where = [];
    const { only, ignore } = schema;

    if (only && only.length) {
      where.push(
        `${schemaField} IN (${only.map(name => `'${name}'`).join(',')})`
      );
    }
    if (ignore && ignore.length) {
      where.push(
        `${schemaField} NOT IN (${ignore.map(name => `'${name}'`).join(',')})`
      );
    }

    return where.join(' AND ');
  }

  buildDatabseFilter({ database }: Object = {}, databaseField: string) {
    if (!database) {
      return null;
    }

    if (typeof database === 'string') {
      return `${databaseField} = '${database}'`;
    }

    const where = [];
    const { only, ignore } = database;

    if (only && only.length) {
      where.push(
        `${databaseField} IN (${only.map(name => `'${name}'`).join(',')})`
      );
    }

    if (ignore && ignore.length) {
      where.push(
        `${databaseField} NOT IN (${ignore.map(name => `'${name}'`).join(',')})`
      );
    }

    return where.join(' AND ');
  }

  disconnect() {
    this.database.connecting = false;

    if (this.database.connection) {
      this.database.connection.disconnect();
      this.database.connection = null;
    }

    if (this.server.db[this.database.database]) {
      delete this.server.db[this.database.database];
    }
  }

  async getQuerySelectTop(table: string, limit: number, schema: string) {
    this.checkIsConnected();
    let limitValue = limit;

    await this.loadConfigLimit();
    limitValue =
      BaseProvider.limitSelect === 'number'
        ? BaseProvider.limitSelect
        : BaseProvider.DEFAULT_LIMIT;

    return this.database.connection.getQuerySelectTop(
      table,
      limitValue,
      schema
    );
  }

  async getTableSelectScript(table: string, schema?: string) {
    const columnNames = await this.getTableColumnNames(table);
    const schemaSelection = this.resolveSchema(schema);
    return [
      `SELECT ${this.wrap(columnNames).join(', ')}`,
      `FROM ${schemaSelection}${this.wrap(table)};`
    ].join(' ');
  }

  async getTableInsertScript(table: string, schema?: string) {
    const columnNames = await this.getTableColumnNames(table);
    const schemaSelection = this.resolveSchema(schema);
    return [
      `INSERT INTO ${schemaSelection}${this.wrap(table)}`,
      `(${this.wrap(columnNames).join(', ')})\n`,
      `VALUES (${columnNames.fill('?').join(', ')});`
    ].join(' ');
  }

  async getTableColumnNames(table: string) {
    this.checkIsConnected();
    const columns = await this.database.connection.listTableColumns(
      this.database.database,
      table
    );
    return columns.map(column => column.columnName);
  }

  async getTableUpdateScript(table: string, schema?: string) {
    const columnNames = await this.getTableColumnNames(table);
    const setColumnForm = this.wrap(columnNames)
      .map(col => `${col}=?`)
      .join(', ');
    const schemaSelection = this.resolveSchema(schema);
    return [
      `UPDATE ${schemaSelection}${this.wrap(table)}\n`,
      `SET ${setColumnForm}\n`,
      'WHERE <condition>;'
    ].join(' ');
  }

  getTableDeleteScript(table: string, schema?: string) {
    const schemaSelection = this.resolveSchema(schema);
    return [
      `DELETE FROM ${schemaSelection}${this.wrap(table)}`,
      'WHERE <condition>;'
    ].join(' ');
  }

  resolveSchema(schema?: string) {
    return schema ? `${this.wrap(schema)}.` : '';
  }

  wrap(identifier: any) {
    this.checkIsConnected();
    return !Array.isArray(identifier)
      ? this.database.connection.wrapIdentifier(identifier)
      : identifier.map(item => this.database.connection.wrapIdentifier(item));
  }

  async loadConfigLimit() {
    if (BaseProvider.limitSelect === null) {
      const { limitQueryDefaultSelectTop } = await config.get();
      BaseProvider.limitSelect = limitQueryDefaultSelectTop;
    }
    return BaseProvider.limitSelect;
  }

  checkIsConnected() {
    if (this.database.connecting || !this.database.connection) {
      throw new Error('There is no connection available.');
    }
    return true;
  }

  checkUnsupported(exportOptions: exportOptionsType) {
    if (!exportOptions) {
      throw new Error('No exportOptions passed');
    }
  }

  async getJsonString(exportOptions: exportOptionsType) {
    const exporter = new SqliteJsonExport(this.connection.dbConfig.database);
    this.checkUnsupported(exportOptions);

    if ('tables' in exportOptions && 'table' in exportOptions) {
      throw new Error('You cannot give both "tables" and "table". Choose one');
    }

    const getSingleTable = (tableName: string): Promise<string> =>
      new Promise((resolve, reject) => {
        const options = {
          table: tableName
        };
        exporter.json(options, (err: Error, json: string) => {
          if (err) return reject(err);
          return resolve(json);
        });
      });

    // Multiple tables
    if ('tables' in exportOptions) {
      const results = await Promise.all(
        exportOptions.tables.map(tableName => getSingleTable(tableName))
      ).then(tableJsonStrings => tableJsonStrings.join(','));

      return ['[', ...results, ']'].join('');
    }

    // Single table
    return getSingleTable(exportOptions.table);
  }

  async getCsvString(exportOptions: exportOptionsType) {
    if ('tables' in exportOptions) {
      throw new Error(
        'Exporting multiple tables to csv is currently not supported'
      );
    }

    const jsonString = await this.getJsonString(exportOptions);
    const parsedJson = JSON.parse(jsonString);

    return json2csv({
      data: parsedJson,
      fields: Object.keys(parsedJson[0])
    });
  }

  async exportJson(filename: string, exportOptions: exportOptionsType) {
    const jsonString = await this.getJsonString(exportOptions);
    await writeFileAsync(filename, jsonString);
    return jsonString;
  }

  async exportCsv(filename: string, exportOptions: exportOptionsType) {
    const csvString = await this.getCsvString(exportOptions);
    await writeFileAsync(filename, csvString);
    return csvString;
  }
}

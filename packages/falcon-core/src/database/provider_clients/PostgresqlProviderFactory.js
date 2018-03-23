/* eslint-disable */
// @TODO: Add flow annotation
import pg from 'pg';
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

/**
 * Do not convert DATE types to JS date.
 * It gnores of applying a wrong timezone to the date.
 *
 * @TODO: Do not convert as well these same types with array
 *        (types 1115, 1182, 1185)
 */
pg.types.setTypeParser(1082, 'text', val => val); // date
pg.types.setTypeParser(1114, 'text', val => val); // timestamp without timezone
pg.types.setTypeParser(1184, 'text', val => val); // timestamp

type connectionType = {
  pool: {},
  release: () => void,
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
  ) => void,
  pool: {
    end: () => void,
    connect: () => void,
    getConnection: (
      cb: (errPool: Array<Error>, connection: connectionType) => void
    ) => void
  }
};

class PostgresqlProvider extends BaseProvider implements ProviderInterface {
  connection: connectionType;

  pgErrors = {
    CANCELED: '57014'
  };

  constructor(
    server: serverType,
    database: databaseType,
    connection: connectionType
  ) {
    super(server, database);
    this.connection = connection;
  }

  disconnect() {
    this.connection.pool.end();
  }

  async listTables(filter) {
    const schemaFilter = this.buildSchemaFilter(filter, 'table_schema');
    const sql = `
      SELECT
        table_schema as schema,
        table_name as name
      FROM information_schema.tables
      WHERE table_type NOT LIKE '%VIEW%'
      ${schemaFilter ? `AND ${schemaFilter}` : ''}
      ORDER BY table_schema, table_name
    `;

    const data = await this.driverExecuteQuery({ query: sql });

    return data.rows;
  }

  async listViews(filter) {
    const schemaFilter = this.buildSchemaFilter(filter, 'table_schema');
    const sql = `
      SELECT
        table_schema as schema,
        table_name as name
      FROM information_schema.views
      ${schemaFilter ? `WHERE ${schemaFilter}` : ''}
      ORDER BY table_schema, table_name
    `;

    const data = await this.driverExecuteQuery({ query: sql });

    return data.rows;
  }

  async listRoutines(filter) {
    const schemaFilter = this.buildSchemaFilter(filter, 'routine_schema');
    const sql = `
      SELECT
        routine_schema,
        routine_name,
        routine_type
      FROM information_schema.routines
      ${schemaFilter ? `WHERE ${schemaFilter}` : ''}
      GROUP BY routine_schema, routine_name, routine_type
      ORDER BY routine_schema, routine_name
    `;

    const data = await this.driverExecuteQuery({ query: sql });

    return data.rows.map(row => ({
      schema: row.routine_schema,
      routineName: row.routine_name,
      routineType: row.routine_type
    }));
  }

  async listTableColumns(database, table, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const sql = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
    `;

    const params = [schema, table];

    type dataType = {
      rows: Array<{
        columnName: string,
        dataType: string
      }>
    };

    const data: dataType = await this.driverExecuteQuery({
      query: sql,
      params
    });

    return data.rows.map(row => ({
      columnName: row.column_name,
      dataType: row.data_type
    }));
  }

  async listTableTriggers(table, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const sql = `
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_schema = $1
      AND event_object_table = $2
    `;
    const params = [schema, table];
    const data = await this.driverExecuteQuery({ query: sql, params });
    return data.rows.map(row => row.trigger_name);
  }

  async listTableIndexes(table, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const sql = `
      SELECT indexname as index_name
      FROM pg_indexes
      WHERE schemaname = $1
      AND tablename = $2
    `;
    const params = [schema, table];
    const data = await this.driverExecuteQuery({ query: sql, params });

    return data.rows.map(row => row.index_name);
  }

  async listSchemas(filter) {
    const schemaFilter = this.buildSchemaFilter(filter);
    const sql = `
      SELECT schema_name
      FROM information_schema.schemata
      ${schemaFilter ? `WHERE ${schemaFilter}` : ''}
      ORDER BY schema_name
    `;
    const data = await this.driverExecuteQuery({ query: sql });

    return data.rows.map(row => row.schema_name);
  }

  async getTableReferences(table, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const sql = `
      SELECT ctu.table_name AS referenced_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_table_usage AS ctu
      ON ctu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
      AND tc.table_schema = $2
    `;
    const params = [table, schema];
    const data = await this.driverExecuteQuery({ query: sql, params });

    return data.rows.map(row => row.referenced_table_name);
  }

  async getTableColumns(database, table, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const sql = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        CASE WHEN tc.constraint_type LIKE '%FOREIGN%' THEN ctu.table_name
        ELSE NULL
        END AS referenced_table_name,
        tc.constraint_type
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        USING (constraint_schema, constraint_name)
      JOIN information_schema.constraint_table_usage as ctu
        USING (constraint_schema, constraint_name)
      WHERE tc.table_name = $1
      AND tc.table_schema = $2
      AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')

    `;
    const params = [table, schema];
    const data = await this.driverExecuteQuery({ query: sql, params });

    return data.rows.map(row => ({
      constraintName: row.constraint_name,
      columnName: row.column_name,
      referencedTable: row.referenced_table_name,
      keyType: row.constraint_type
    }));
  }

  query(queryText) {
    let pid = null;
    let canceling = false;
    const cancelable = createCancelablePromise({
      ...errors.CANCELED_BY_USER,
      sqlectronError: 'CANCELED_BY_USER'
    });

    return {
      execute() {
        return this.runWithConnection(async () => {
          // const connectionClient = { connection };

          const dataPid = await this.driverExecuteQuery({
            query: 'SELECT pg_backend_pid() AS pid'
          });

          pid = dataPid.rows[0].pid;

          try {
            const data = await Promise.race([
              cancelable.wait(),
              this.executeQuery(this.connection, queryText)
            ]);

            pid = null;

            return data;
          } catch (err) {
            if (canceling && err.code === this.pgErrors.CANCELED) {
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
          const data = await this.driverExecuteQuery({
            query: `SELECT pg_cancel_backend(${pid});`
          });

          if (!data.rows[0].pg_cancel_backend) {
            throw new Error(`Failed canceling query with pid ${pid}.`);
          }

          cancelable.cancel();
        } catch (err) {
          canceling = false;
          throw err;
        }
      }
    };
  }

  async executeQuery(queryText: string) {
    const data = await this.driverExecuteQuery({
      query: queryText,
      multiple: true
    });
    const commands = this.identifyCommands(queryText).map(item => item.type);

    return data.map((result, index) =>
      this.parseRowQueryResult(result, commands[index])
    );
  }

  async listDatabases(filter) {
    const databaseFilter = this.buildDatabseFilter(filter, 'datname');
    const sql = `
      SELECT datname
      FROM pg_database
      WHERE datistemplate = $1
      ${databaseFilter ? `AND ${databaseFilter}` : ''}
      ORDER BY datname
    `;
    const params = [false];
    const data = await this.driverExecuteQuery({ query: sql, params });
    return data.rows.map(row => row.datname);
  }

  async getQuerySelectTop(table, limit, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    return `SELECT * FROM ${this.wrapIdentifier(schema)}.${this.wrapIdentifier(
      table
    )} LIMIT ${limit}`;
  }

  async getTableCreateScript(table, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    // Reference http://stackoverflow.com/a/32885178
    const sql = `
      SELECT
        'CREATE TABLE ' || quote_ident(tabdef.schema_name) || '.' || quote_ident(tabdef.table_name) || E' (\n' ||
        array_to_string(
          array_agg(
            '  ' || quote_ident(tabdef.column_name) || ' ' ||  tabdef.type || ' '|| tabdef.not_null
          )
          , E',\n'
        ) || E'\n);\n' ||
        CASE WHEN tc.constraint_name IS NULL THEN ''
            ELSE E'\nALTER TABLE ' || quote_ident($2) || '.' || quote_ident(tabdef.table_name) ||
            ' ADD CONSTRAINT ' || quote_ident(tc.constraint_name)  ||
            ' PRIMARY KEY ' || '(' || substring(constr.column_name from 0 for char_length(constr.column_name)-1) || ')'
        END AS createtable
      FROM
      ( SELECT
          c.relname AS table_name,
          a.attname AS column_name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
          CASE
            WHEN a.attnotnull THEN 'NOT NULL'
          ELSE 'NULL'
          END AS not_null,
          n.nspname as schema_name
        FROM pg_class c,
        pg_attribute a,
        pg_type t,
        pg_namespace n
        WHERE c.relname = $1
        AND a.attnum > 0
        AND a.attrelid = c.oid
        AND a.atttypid = t.oid
        AND n.oid = c.relnamespace
        AND n.nspname = $2
        ORDER BY a.attnum DESC
      ) AS tabdef
      LEFT JOIN information_schema.table_constraints tc
      ON  tc.table_name       = tabdef.table_name
      AND tc.table_schema     = tabdef.schema_name
      AND tc.constraint_Type  = 'PRIMARY KEY'
      LEFT JOIN LATERAL (
        SELECT column_name || ', ' AS column_name
        FROM   information_schema.key_column_usage kcu
        WHERE  kcu.constraint_name = tc.constraint_name
        AND kcu.table_name = tabdef.table_name
        AND kcu.table_schema = tabdef.schema_name
        ORDER BY ordinal_position
      ) AS constr ON true
      GROUP BY tabdef.schema_name, tabdef.table_name, tc.constraint_name, constr.column_name;
    `;
    const params = [table, schema];
    const data = await this.driverExecuteQuery({ query: sql, params });
    return data.rows.map(row => row.createtable);
  }

  async getViewCreateScript(view, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const createViewSql = `CREATE OR REPLACE VIEW ${this.wrapIdentifier(
      schema
    )}.${view} AS`;
    const sql = 'SELECT pg_get_viewdef($1::regclass, true)';
    const params = [view];
    const data = await this.driverExecuteQuery({ query: sql, params });
    return data.rows.map(row => `${createViewSql}\n${row.pg_get_viewdef}`);
  }

  async getRoutineCreateScript(routine, _, defaultSchema: string) {
    const schema = defaultSchema || (await this.getSchema());
    const sql = `
      SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE proname = $1
      AND n.nspname = $2
    `;
    const params = [routine, schema];
    const data = await this.driverExecuteQuery({ query: sql, params });

    return data.rows.map(row => row.pg_get_functiondef);
  }

  wrapIdentifier(value: string) {
    if (value === '*') {
      return value;
    }

    const matched = value.match(/(.*?)(\[[0-9]\])/); // eslint-disable-line no-useless-escape

    return matched
      ? this.wrapIdentifier(matched[1]) + matched[2]
      : `"${value.replace(/"/g, '""')}"`;
  }

  async getSchema() {
    const sql = 'SELECT current_schema() AS schema';
    const data = await this.driverExecuteQuery({ query: sql });
    return data.rows[0].schema;
  }

  async truncateAllTables(schema) {
    return this.runWithConnection(async () => {
      const sql = `
        SELECT quote_ident(table_name) as table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        AND table_type NOT LIKE '%VIEW%'
      `;

      const params = [schema];

      const data = await this.driverExecuteQuery({ query: sql, params });

      const truncateAll = data.rows
        .map(
          row => `
          TRUNCATE TABLE ${this.wrapIdentifier(schema)}.${this.wrapIdentifier(
            row.table_name
          )}
          RESTART IDENTITY CASCADE;
        `
        )
        .join('');

      await this.driverExecuteQuery({
        query: truncateAll,
        multiple: true
      });
    });
  }

  parseRowQueryResult(data, command) {
    const isSelect = data.command === 'SELECT';
    return {
      command: command || data.command,
      rows: data.rows,
      fields: data.fields,
      rowCount: isSelect ? data.rowCount : undefined,
      affectedRows:
        !isSelect && !isNaN(data.rowCount) ? data.rowCount : undefined
    };
  }

  identifyCommands(queryText) {
    try {
      return identify(queryText);
    } catch (err) {
      return [];
    }
  }

  driverExecuteQuery(queryArgs: queryArgsType) {
    const runQuery = () => {
      const args = {
        text: queryArgs.query,
        values: queryArgs.params,
        multiResult: queryArgs.multiple
      };

      // node-postgres has support for Promise query
      // but that always returns the "fields" property empty
      return new Promise((resolve, reject) => {
        this.connection.query(args, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    };

    return this.connection ? runQuery() : this.runWithConnection(runQuery);
  }

  async runWithConnection(run) {
    await this.connection.pool.connect();

    try {
      return await run();
    } finally {
      this.connection.release();
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
    max: 5 // max idle connections per time (30 secs)
  };

  if (server.sshTunnel) {
    config.host = server.config.localHost;
    config.port = server.config.localPort;
  }

  if (server.config.ssl) {
    config.ssl = server.config.ssl;
  }

  return config;
}

async function PostgresqlProviderFactory(
  server: serverType,
  database: databaseType
): FactoryType {
  const dbConfig = configDatabase(server, database);
  const logger = createLogger('db:clients:postgresql');
  logger().debug('create driver client for postgres with config %j', dbConfig);

  const connection = {
    pool: new pg.Pool(dbConfig)
  };

  logger().debug('connected');

  const provider = new PostgresqlProvider(server, database, connection);
  await provider.getSchema();

  return provider;
}

export default PostgresqlProviderFactory;

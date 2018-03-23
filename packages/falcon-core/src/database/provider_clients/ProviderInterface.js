// @flow
import type { sshTunnelType, tunnelConfigType } from '../Tunnel';

export type databasesType =
  | 'mysql'
  | 'sqlite'
  | 'postgresql'
  | 'sqlserver'
  | 'cassandra';

export type serverType = {
  db: {
    [dbName: string]: ProviderInterface
  },
  sshTunnel: sshTunnelType,
  config: {
    ...tunnelConfigType,
    ssl?: {
      rejectUnauthorized: boolean
    },
    client: string,
    user?: string
  }
};

export type exportOptionsType = {
  views?: Array<string>,
  procedures?: Array<string>,
  functions?: Array<string>,
  rows?: Array<string>
} & ({ tables: Array<string> } | { table: string });

/**
 * Used to configure the database.
 */
export type databaseType = {
  // The name of the database to connect to
  database: string,
  // Wraps the existing connection in a tunnel. Only used for SSH
  connection: {
    getQuerySelectTop: (table: string, limit: number, schema: string) => void,
    listTableColumns: (table: string) => Array<Object>,
    wrapIdentifier: (item: any) => any,
    disconnect: () => void
  } | null,
  // Boolean indicating if connection is active and successful
  connecting: boolean
};

export type queryType = {
  execute: () => void,
  cancel: () => void
};

export type queryArgsType = {
  query: string,
  multiple?: boolean,
  params?: Array<string>
};

export type queryResponseType = {
  command: string,
  rows: Array<Object>,
  fields: Array<Object>,
  rowCount: number,
  affectedRows: number
};

type connectionValidationType = {
  success: boolean,
  errorMessages: Array<string>
};

export type logType = {
  type: 'falcon' | 'user' | 'profile' | 'trace',
  query: string,
  duration: number,
  time: Date
};

/**
 * @TODO: Add documentation for each of these methods
 */
export interface ProviderInterface {
  /**
   * Database config properties
   */
  server: serverType;
  database: databaseType;

  /**
   * @TODO: What does this to? What is an identifier?
   */
  wrapIdentifier: (value: string) => string;

  /**
   * Connection operations:
   *
   * Create a connection to a database using `this.server.config` that is passed
   * from ProviderFactory constructor -> BaseProvider constructor
   */
  connect: () => void;
  disconnect: () => void;

  /**
   * Log related types
   */
  logs: Array<logType>;
  getLogs: () => Promise<Array<logType>>;
  setLogs: () => Promise<void>;

  graphQLServerPort: number;
  getGraphQLServerPort: () => number;

  /**
   * @TODO: Table creation methods
   */
  //  table: (tableName: string) => ({
  //    delete: () => void,
  //    create: () => void,
  //    update: () => void,
  //  })

  /**
   * List operations:
   */
  listTables: () => Promise<Array<{ name: string }>>;
  listViews: () => Promise<Array<string>>;
  listRoutines: () => Promise<Array<string>>;
  listTableTriggers: (table: string) => Promise<Array<string>>;
  listTableIndexes: (table: string) => Promise<Array<string>>;
  listSchemas: () => Promise<Array<string>>;
  listDatabases: () => Promise<Array<string>>;
  listTableColumns: (
    table: string
  ) => Promise<
    Array<{
      columnName: string,
      dataType: string
    }>
  >;

  /**
   * Retrival operations
   */
  getVersion: () => Promise<string | number>;
  getConnectionType: () => Promise<'local' | 'ssh' | 'insecure'>;
  getTableReferences: (table: string) => Promise<Array<string>>;
  getTableValues: (table: string) => Promise<Array<Object>>;
  getTableNames: () => Promise<Array<string>>;
  /**
   * Gets columns of a table
   * @TODO: Can this be renamed getTableColumnData
   */
  getTableColumns: (
    table: string
  ) => Promise<
    Array<{
      constraintName: string,
      columnName: string,
      referencedTable: string,
      keyType: string
    }>
  >;
  /**
   * Gets the primary key of a table
   */
  getPrimaryKeyColumn: (
    table: string
  ) => {
    constraintName: string,
    columnName: string,
    referencedTable: string,
    keyType: string
  };

  /**
   * Dynamically generate a graphql schema for a database and start
   * a graphql server based on that schema
   */
  startGraphQLServer: () => Promise<void>;
  stopGraphQLServer: () => Promise<void>;
  graphQLServer: Object;
  _graphQLServerIsRunning: boolean;
  graphQLServerIsRunning: () => boolean;

  /**
   * @TODO: Basic CRUD Operations. Given a database name, table name,
   *        dynamically generate a query string from the given properties of
   *        the table. Perform any necessary bookkeeping and validation
   */
  // @TODO: What exactly did sqlectron expected should be returned here?
  delete: (
    table: string,
    keys: Array<string | number>
  ) => Promise<{ timing: number }>;
  insert: (
    table: string,
    values: Array<{ [value: string]: any }>
  ) => Promise<{ timing: number }>;
  update: (
    table: string,
    records: Array<Object>
  ) => Promise<{ timing: number }>;

  /**
   * Table schema CRUD operations
   */
  renameTable: (oldTableName: string, newTableName: string) => Promise<string>;
  dropTable: (table: string) => Promise<string>;
  addTableColumn: (
    table: string,
    columnName: string,
    columnType: string
  ) => Promise<string>;
  renameTableColumns: (
    table: string,
    columns: Array<{ oldColumnName: string, newColumnName: string }>
  ) => Promise<string>;
  dropTableColumns: (
    table: string,
    columnsToDrop: Array<string>
  ) => Promise<string>;
  getCreateTableSql: (table: string) => Promise<string>;
  getTablePropertiesSql: (table: string) => Promise<Array<String>>;
  /**
   * @TODO: What is the difference between query() driverExecuteQuery() and executeQuery()?
   */
  // Returns a query that can be canceled
  query: (
    queryText: string
  ) => Promise<{ execute: () => Promise<any>, cancel: () => void }>;
  // Used to execute raw SQL statements
  driverExecuteQuery: (
    queryArgs: queryArgsType
  ) => Promise<{ data: Array<Object> }>;
  // Builds on top of driverExecuteQuery(). Adds additional metadata
  executeQuery: (queryText: string) => Promise<Array<queryResponseType>>;

  /**
   * Create a JSON or CSV buffer to export the database to
   * @TODO: Specify a `.supportExports` property. Each database has its own export
   *        formats. For example, mysql has a `.sql` export format, which other DB's
   *        don't support
   */
  getJsonString: (exportOptions: exportOptionsType) => Promise<string>;
  getCsvString: (exportOptions: exportOptionsType) => Promise<string>;
  exportJson: (
    absolutePath: string,
    exportOptions: exportOptionsType
  ) => Promise<string>;
  exportCsv: (
    absolutePath: string,
    exportOptions: exportOptionsType
  ) => Promise<string>;

  /**
   * Run a query inside of an existing connection pool
   */
  runWithConnection: (query: () => queryResponseType) => void;

  /**
   * Determine if the connection is still alive and the database is still conencted
   * to
   */
  isOnline: () => Promise<boolean>;

  testConnection: (connection: Object) => Promise<connectionValidationType>;

  /**
   * The following methods return sql query statements that are specific to the
   * currently connected database
   *
   * @TODO: All the following API methods should return strings
   *        If returns a string currently, manually create a promise out of it
   */
  getQuerySelectTop: (table: string, limit: number) => Promise<string> | string;
  getTableCreateScript: (
    table: string,
    schema?: string
  ) => Promise<string> | string;
  getTableSelectScript: (
    table: string,
    schema?: string
  ) => Promise<string> | string;
  getTableInsertScript: (
    table: string,
    schema?: string
  ) => Promise<string> | string;
  getTableUpdateScript: (
    table: string,
    schema?: string
  ) => Promise<string> | string;
  /** Deletes existing records within a table */
  getTableDeleteScript: (
    table: string,
    scheme?: string
  ) => Promise<string> | string;
  getViewCreateScript: (view: string) => Promise<string> | string;
  getRoutineCreateScript: (
    routine: string,
    schema: string
  ) => Promise<string> | string;
  truncateAllTables: () => Promise<string> | string;

  /**
   * All the supported features of each database
   */
  getSupportedFeatures: {
    views: boolean,
    procedures: boolean,
    tables: boolean,
    functions: boolean,
    triggers: boolean,
    events: boolean,

    /**
     * A list of generic types that all databases will either have or not have. The actual
     * types of each database might have a different name. For example, sqlite supports
     * "BIGINT" types so here, we would mark integer as true
     */
    types: {
      integer: boolean,
      float: boolean,
      decimal: boolean,
      double: boolean,
      increments: boolean,
      string: boolean,
      varchar: boolean,
      boolean: boolean,
      enum: boolean,
      binary: boolean,
      json: boolean,
      date: boolean
    }
  };

  /**
   * Map a type to its actual name:
   * Ex: 'integer': 'BIGINT'
   */
  genericTypeMappings: {
    [genericType:
      | 'integer'
      | 'float'
      | 'string'
      | 'varchar'
      | 'boolean'
      | 'enum'
      | 'binary'
      | 'json']: string
  };
}

export type FactoryType = Promise<ProviderInterface>;

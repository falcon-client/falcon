// @flow
import sqlite from './SqliteProviderFactory';
// import cassandra from './CassandraProviderFactory';
// import mysql from './MysqlProviderFactory';
// import postgresql from './PostgresqlProviderFactory';
// import sqlserver from './SqlserverProviderFactory';

/**
 * List of supported database clients
 */
export const CLIENTS = [
  {
    key: 'mysql',
    name: 'MySQL',
    defaultPort: 3306,
    disabledFeatures: ['server:schema', 'server:domain']
  },
  {
    key: 'postgresql',
    name: 'PostgreSQL',
    defaultDatabase: 'postgres',
    defaultPort: 5432,
    disabledFeatures: ['server:domain']
  },
  {
    key: 'sqlserver',
    name: 'Microsoft SQL Server',
    defaultPort: 1433
  },
  {
    key: 'sqlite',
    name: 'SQLite',
    defaultDatabase: ':memory:',
    disabledFeatures: [
      'server:ssl',
      'server:host',
      'server:port',
      'server:socketPath',
      'server:user',
      'server:password',
      'server:schema',
      'server:domain',
      'server:ssh',
      'scriptCreateTable',
      'cancelQuery'
    ]
  },
  {
    key: 'cassandra',
    name: 'Cassandra',
    defaultPort: 9042,
    disabledFeatures: [
      'server:ssl',
      'server:socketPath',
      'server:user',
      'server:password',
      'server:schema',
      'server:domain',
      'scriptCreateTable',
      'cancelQuery'
    ]
  }
];

export default {
  // sqlserver,
  // postgresql,
  // mysql,
  // cassandra,
  sqlite
};

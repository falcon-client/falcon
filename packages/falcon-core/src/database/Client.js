// @flow
import SqliteProviderFactory from './provider_clients/SqliteProviderFactory';
// import CassandraProviderFactory from './provider_clients/CassandraProviderFactory';
// import MysqlProviderFactory from './provider_clients/MysqlProviderFactory';
// import PostgresqlProviderFactory from './provider_clients/PostgresqlProviderFactory';
import type {
  FactoryType,
  serverType,
  databaseType
} from './provider_clients/ProviderInterface';

export default function Client(
  server: serverType,
  database: databaseType
): FactoryType {
  switch (server.config.client) {
    case 'sqlite':
      return SqliteProviderFactory(server, database);
    // case 'cassandra':
    //   return CassandraProviderFactory(server, database);
    // case 'mysql':
    //   return MysqlProviderFactory(server, database);
    // case 'postgresql':
    //   return PostgresqlProviderFactory(server, database);
    default:
      throw new Error(
        `Database client type "${server.config.client}" not recognized`
      );
  }
}

// @flow
import type { TableType } from './TableType';

export type DatabaseType = {
  databaseName: string,
  tables: Array<TableType>
};

// @flow
export type TableType = {
  databaseName: string,
  tableName: string,
  columns: Array<string>,
  rows: Array<{
    rowID: string,
    value: Array<string | number>
  }>
};

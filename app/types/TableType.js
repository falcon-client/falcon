// @flow
export type TableType = {
  databaseName: string,
  tableName: string,
  columns: Array<string>,
  rows: Array<{
    // @TODO: Check why some rowIDs are undefined (causes flow to throw error)
    rowID: number | string | undefined,
    value: Array<string | number | null>
  }>
};

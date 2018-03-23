// @flow
export type TableType = {
  databaseName?: string,
  name: string,
  columns?: Array<TableColumnType>,
  rows?: Array<{
    // @TODO: Check why some rowIDs are undefined (causes flow to throw error)
    rowID: number | string | undefined,
    value: Array<string | number | null>
  }>
};

export type connectionType = {
  // The internal id for the connection
  id: string,
  // The name of the connection
  name: string,
  // The color of the connection
  color?: string | 'default',
  // Which database the connection is for
  type: databasesType,
  // An optional database to connect to
  database?: string,
  // These are properties that are specific to certain databases.
  // The pervious properties are required for all databases
  meta?: {
    password?: string,
    database?: string,
    port?: number,
    host?: string,
    username?: string,
    [otherKeys: string]: string
  }
};

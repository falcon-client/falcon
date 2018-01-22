// @flow

// Used in HomePage.js to display database contents
export type LoginDatabaseType = {
  type: 'Cassandra' | 'MySQL' | 'SQLite',
  fields: {
    nickname: string
  }
};

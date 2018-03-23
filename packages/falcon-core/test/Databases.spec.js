// @flow
import path from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { expect as chaiExpect } from 'chai';
import { db } from '../src';
import config from './databases/config';
import setupSQLite from './databases/sqlite/setup';
import setupCassandra from './databases/cassandra/setup';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

/**
 * List of supported DB clients.
 * The "integration" tests will be executed for all supported DB clients.
 * And ensure all these clients has the same API and output results.
 */
const SUPPORTED_DB_CLIENTS = [
  'mysql',
  'postgresql',
  'sqlserver',
  'sqlite',
  'cassandra'
];

const dbSchemas = {
  postgresql: 'public',
  sqlserver: 'dbo'
};

const delay = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

/**
 * List of selected databases to be tested in the current task
 */
const dbsToTest = (process.env.DB_CLIENTS || '')
  .split(',')
  .filter(client => !!client);

describe('Database', () => {
  const dbClients = dbsToTest.length ? dbsToTest : SUPPORTED_DB_CLIENTS;

  if (dbClients.some(dbClient => !SUPPORTED_DB_CLIENTS.includes(dbClient))) {
    throw new Error('Invalid selected db client for tests');
  }

  if (dbClients.includes('sqlite')) {
    setupSQLite(config.sqlite);
  } else if (dbClients.includes('cassandra')) {
    setupCassandra(config.cassandra);
  }

  it('should fail on unsupported database', async () => {
    const serverInfo = {
      database: 'foo',
      name: 'bar',
      client: 'baz'
    };

    expect(() => {
      db.createServer(serverInfo);
    }).toThrowErrorMatchingSnapshot();
  });

  dbClients.forEach(dbClient => {
    const dbSchema = dbSchemas[dbClient];

    describe(dbClient, () => {
      describe('.connect', () => {
        it(`should connect into a ${dbClient} database`, async () => {
          const serverInfo = {
            ...config[dbClient],
            name: dbClient,
            client: dbClient
          };

          const serverSession = db.createServer(serverInfo);
          const dbConn = await serverSession.createConnection(
            serverInfo.database
          );
          await dbConn.connect();
        });

        it('should fail to connect to non-existent database', async () => {
          const serverInfo = {
            ...config[dbClient],
            database: 'foo',
            name: dbClient,
            client: dbClient
          };

          const serverSession = db.createServer(serverInfo);
          const dbConn = await serverSession.createConnection(
            serverInfo.database
          );

          await dbConn.connect();
        });

        it('should connect into server without database specified', async () => {
          const serverInfo = {
            ...config[dbClient],
            database: db.CLIENTS.find(c => c.key === dbClient).defaultDatabase,
            name: dbClient,
            client: dbClient
          };

          const serverSession = db.createServer(serverInfo);
          const dbConn = await serverSession.createConnection(
            serverInfo.database
          );

          await dbConn.connect();
        });
      });

      describe('given is already connected', () => {
        const serverInfo = {
          ...config[dbClient],
          name: dbClient,
          client: dbClient
        };
        let serverSession;
        let dbConn;

        beforeEach(async () => {
          serverSession = db.createServer(serverInfo);
          dbConn = await serverSession.createConnection(serverInfo.database);
          await dbConn.connect();

          const includePrimaryKey = dbClient === 'cassandra';

          await dbConn.executeQuery(`
            INSERT INTO roles (${includePrimaryKey ? 'id,' : ''} name)
            VALUES (${includePrimaryKey ? '1,' : ''} 'developer')
          `);
          await dbConn.executeQuery(`
            INSERT INTO users (${
              includePrimaryKey ? 'id,' : ''
            } username, email, password, role_id, createdat)
            VALUES (${
              includePrimaryKey ? '1,' : ''
            } 'maxcnunes', 'maxcnunes@gmail.com', '123456', 1,'2016-10-25')
          `);
        });

        afterEach(async () => {
          await dbConn.truncateAllTables();
        });

        describe('.disconnect', () => {
          it('should close all connections in the pool', () => {
            dbConn.disconnect();
          });
        });

        describe('CRUD', () => {
          describe('.delete', () => {
            it('should add 2 then delete 3 rows in the table', async () => {
              const usersValuesBefore = await dbConn.getTableValues('users');
              expect(usersValuesBefore).toHaveLength(1);
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              await dbConn.delete('users', ['1', '3']);
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              await dbConn.delete('users', [2], true);
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              const usersValuesAfter = await dbConn.getTableValues('users');
              expect(usersValuesAfter).toHaveLength(0);
            });
          });

          describe('.insert', () => {
            it('should insert 1 empty record and 1 filled record', async () => {
              const usersValuesBefore = await dbConn.getTableValues('users');
              expect(usersValuesBefore).toHaveLength(1);
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              expect(usersValuesBefore[0]).toEqual({
                id: 1,
                username: 'maxcnunes',
                email: 'maxcnunes@gmail.com',
                password: '123456',
                role_id: 1,
                createdat: '2016-10-25'
              });
              await dbConn.insert('users', [
                {},
                {
                  username: 'jooohhn',
                  email: 'jptran318@gmail.com',
                  password: 'password123',
                  role_id: 1,
                  createdat: '2017-7-20'
                }
              ]);
              const usersValuesAfter = await dbConn.getTableValues('users');
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              expect(usersValuesAfter[1]).toEqual({
                id: 2,
                username: null,
                email: null,
                password: null,
                role_id: null,
                createdat: null
              });
              expect(usersValuesAfter[2]).toEqual({
                id: 3,
                username: 'jooohhn',
                email: 'jptran318@gmail.com',
                password: 'password123',
                role_id: 1,
                createdat: '2017-7-20'
              });
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
            });
          });

          describe('.update', () => {
            it('should insert an empty record then update it', async () => {
              const usersValuesBefore = await dbConn.getTableValues('users');
              expect(usersValuesBefore).toHaveLength(1);
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              expect(usersValuesBefore[0]).toEqual({
                id: 1,
                username: 'maxcnunes',
                email: 'maxcnunes@gmail.com',
                password: '123456',
                role_id: 1,
                createdat: '2016-10-25'
              });
              expect(usersValuesBefore).toHaveLength(1);
              await dbConn.insert('users', [{}]);
              await dbConn.update('users', [
                {
                  rowPrimaryKeyValue: '2',
                  changes: {
                    username: 'jooohhn',
                    email: 'jptran318@gmail.com',
                    password: 'password123',
                    role_id: 1,
                    createdat: '2017-7-20'
                  }
                }
              ]);
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
              const usersValuesAfter = await dbConn.getTableValues('users');
              expect(usersValuesAfter).toHaveLength(2);
              expect(usersValuesAfter[1]).toEqual({
                id: 2,
                username: 'jooohhn',
                email: 'jptran318@gmail.com',
                password: 'password123',
                role_id: 1,
                createdat: '2017-7-20'
              });
              expect(await dbConn.getTableValues('users')).toMatchSnapshot();
            });
          });
        });

        describe('List', () => {
          describe('.listDatabases', () => {
            it('should list all databases', async () => {
              const databases = await dbConn.listDatabases();

              if (dbClient === 'sqlite') {
                // The database of sqlite is the absolute path to the database file
                // This differs between machines. Instead, we just test the filename substring
                expect(databases[0]).toContain('sqlectron.db');
              } else {
                expect(databases).toMatchSnapshot();
              }
            });
          });

          describe('.listTables', () => {
            it('should list all tables', async () => {
              const tables = await dbConn.listTables();
              expect(tables).toMatchSnapshot();
            });
          });

          if (dbClient !== 'cassandra') {
            describe('.listViews', () => {
              it('should list all views', async () => {
                const views = await dbConn.listViews();
                expect(views).toMatchSnapshot();
              });
            });
          }

          describe('.listRoutines', () => {
            it('should list all routines with their type', async () => {
              const routines = await dbConn.listRoutines();
              expect(routines).toMatchSnapshot();
            });
          });

          describe('.getConnectionType', () => {
            it('should get connection type of database', async () => {
              const connectiontType = await dbConn.getConnectionType();
              expect(['local', 'ssh', 'ssl', 'socket']).toContain(
                connectiontType
              );
            });
          });

          describe('.listTableColumns', () => {
            it('should list all columns and their type from users table', async () => {
              const columns = await dbConn.listTableColumns('users');
              expect(columns).toHaveLength(6);
              const column = name =>
                columns.find(col => col.columnName === name);
              expect(columns).toMatchSnapshot();
              expect(column('id')).toMatchSnapshot();
              expect(column('username')).toMatchSnapshot();
              expect(column('email')).toMatchSnapshot();
              expect(column('password')).toMatchSnapshot();
              expect(column('role_id')).toMatchSnapshot();
              expect(column('createdat')).toMatchSnapshot();
            });
          });

          describe('.listTableTriggers', () => {
            it('should list all table related triggers', async () => {
              const triggers = await dbConn.listTableTriggers('users');
              expect(triggers).toMatchSnapshot();
            });
          });

          describe('.listTableIndexes', () => {
            it('should list all indexes', async () => {
              const indexes = await dbConn.listTableIndexes('users');
              expect(indexes).toMatchSnapshot();
            });
          });

          describe('.listSchemas', () => {
            it('should list all schema', async () => {
              // @TODO: passing schemas to listSchemas() is currently not supported by falcon
              // const schemas =
              //   await dbConn.listSchemas({ schema: { only: [dbSchema, 'dummy_schema'] } });
              const schemas = await dbConn.listSchemas();
              expect(schemas).toMatchSnapshot();
            });
          });
        });

        describe('Get', () => {
          describe('.getTableReferences', () => {
            it('should list all tables that selected table has references to', async () => {
              const references = await dbConn.getTableReferences('users');
              expect(references).toMatchSnapshot();
            });
          });

          describe('.getTableColumns', () => {
            it('should list all tables keys', async () => {
              const tableKeys = await dbConn.getTableColumns('users');
              expect(tableKeys).toMatchSnapshot();
            });
          });

          describe('.getVersion', () => {
            it('should get version of database', async () => {
              const version = await dbConn.getVersion();
              expect(typeof version).toBe('string');
              expect(version).toMatchSnapshot();
            });
          });

          describe('.getTableValues', () => {
            it('should list all tables keys', async () => {
              const tableKeys = await dbConn.getTableValues('users');
              expect(tableKeys).toMatchSnapshot();
            });
          });

          describe('.getTablenames', () => {
            it('should list all tables names', async () => {
              const tableNames = await dbConn.getTableNames();
              expect(tableNames).toMatchSnapshot();
            });
          });

          describe('.getTableCreateScript', () => {
            it('should return table create script', async () => {
              const [createScript] = await dbConn.getTableCreateScript('users');
              expect(createScript).toMatchSnapshot();
            });
          });

          describe('.getTableSelectScript', () => {
            it('should return SELECT table script', async () => {
              const selectQuery = await dbConn.getTableSelectScript('users');
              expect(selectQuery).toMatchSnapshot();
            });

            it('should return SELECT table script with schema if defined', async () => {
              const selectQuery = await dbConn.getTableSelectScript(
                'users',
                'public'
              );
              expect(selectQuery).toMatchSnapshot();
            });
          });

          describe('.getTableInsertScript', () => {
            it('should return INSERT INTO table script', async () => {
              const insertQuery = await dbConn.getTableInsertScript('users');
              expect(insertQuery).toMatchSnapshot();
            });

            it('should return INSERT INTO table script with schema if defined', async () => {
              const insertQuery = await dbConn.getTableInsertScript(
                'users',
                'public'
              );
              expect(insertQuery).toMatchSnapshot();
            });
          });

          describe('.getTableUpdateScript', () => {
            it('should return UPDATE table script', async () => {
              const updateQuery = await dbConn.getTableUpdateScript('users');
              expect(updateQuery).toMatchSnapshot();
            });

            it('should return UPDATE table script with schema if defined', async () => {
              const updateQuery = await dbConn.getTableUpdateScript(
                'users',
                'public'
              );
              expect(updateQuery).toMatchSnapshot();
            });
          });

          describe('.getTableDeleteScript', () => {
            it('should return table DELETE script', async () => {
              const deleteQuery = await dbConn.getTableDeleteScript('roles');
              expect(deleteQuery).toMatchSnapshot();
            });

            it('should return table DELETE script with schema if defined', async () => {
              const deleteQuery = await dbConn.getTableDeleteScript(
                'roles',
                'public'
              );
              expect(deleteQuery).toMatchSnapshot();
            });
          });

          describe('.getViewCreateScript', () => {
            it('should return CREATE VIEW script', async () => {
              const [createScript] = await dbConn.getViewCreateScript(
                'email_view'
              );
              expect(createScript).toMatchSnapshot();
            });
          });

          describe('.getRoutineCreateScript', () => {
            if (dbClient !== 'sqlite') {
              it('should return CREATE PROCEDURE/FUNCTION script', async () => {
                const [createScript] = await dbConn.getRoutineCreateScript(
                  'users_count',
                  'Procedure'
                );
                expect(createScript).toMatchSnapshot();
              });
            }
          });
        });

        if (dbClient !== 'cassandra') {
          describe('.query', () => {
            it('should execute query', async () => {
              const query = await dbConn.query(`
                SELECT name
                FROM sqlite_master
                WHERE type='table'
              `);
              expect(await query.execute()).toMatchSnapshot();
            });

            it.skip('should cancel query', async () => {
              const query = await dbConn.query(`
                SELECT name
                FROM sqlite_master
                WHERE type='table'
              `);
              await query.execute();
              expect(await query.cancel()).toMatchSnapshot();
            });

            it.skip('should be able to cancel the current query', async () => {
              const sleepCommands = {
                postgresql: 'SELECT pg_sleep(10);',
                mysql: 'SELECT SLEEP(10000);',
                sqlserver: "WAITFOR DELAY '00:00:10'; SELECT 1 AS number",
                sqlite: ''
              };

              // Since sqlite does not has a query command to sleep
              // we have to do this by selecting a huge data source.
              // This trick makes select from the same table multiple times.
              if (dbClient === 'sqlite') {
                const fromTables = Array(1)
                  .fill('sqlite_master')
                  .join(',');
                sleepCommands.sqlite = `SELECT last.name FROM ${fromTables} as last`;
              }

              // This hack makes flow happy
              if (dbClient === 'cassandra') {
                return;
              }

              const query = await dbConn.query(sleepCommands[dbClient]);
              const executing = query.execute();

              // wait a 5 secs before cancel
              delay(5000);

              await Promise.all([executing, query.cancel()]);
            });
          });
        }

        describe('GraphQL', () => {
          it('should start and stop graphql server', async () => {
            expect(dbConn.graphQLServerIsRunning()).toEqual(false);
            await dbConn.startGraphQLServer();
            expect(dbConn.graphQLServerIsRunning()).toEqual(true);
            await dbConn.stopGraphQLServer();
            expect(dbConn.graphQLServerIsRunning()).toEqual(false);
          });

          it('should have a port number', async () => {
            expect(dbConn.graphQLServerIsRunning()).toEqual(false);
            await dbConn.startGraphQLServer();
            chaiExpect(dbConn.getGraphQLServerPort()).to.be.a('number');
            await dbConn.stopGraphQLServer();
            expect(dbConn.graphQLServerIsRunning()).toEqual(false);
            expect(dbConn.getGraphQLServerPort()).toEqual(undefined);
          });
        });

        // @TODO
        // describe('Import', () => {})

        describe('Metadata', () => {
          it('should check if database is online', async () => {
            expect(await dbConn.isOnline()).toEqual(true);
          });
        });

        describe('Helpers', () => {
          it('should wrap * identifier', () => {
            expect(dbConn.wrapIdentifier('*')).toEqual('*');
          });
        });

        describe('Export', () => {
          const exportedJsonFilepath = path.join(
            __dirname,
            'fixtures',
            '.tmp.export.json'
          );
          const exportedCsvFilepath = path.join(
            __dirname,
            'fixtures',
            '.tmp.export.csv'
          );

          afterAll(() => {
            unlinkSync(exportedCsvFilepath);
            unlinkSync(exportedJsonFilepath);
          });

          it('shoud fail on unsupported option', async () => {
            // For the time being, our sqlite backend doesn't support views
            await dbConn
              .getJsonString({
                tables: ['users', 'roles'],
                views: ['foo']
              })
              .catch(res => {
                expect(() => {
                  throw res;
                }).toThrowErrorMatchingSnapshot();
              });
          });

          it('shoud fail when passing both "tables" and "table"', async () => {
            await dbConn
              .getJsonString({
                tables: ['users', 'roles'],
                table: 'foo'
              })
              .catch(res => {
                expect(() => {
                  throw res;
                }).toThrowErrorMatchingSnapshot();
              });
          });

          describe('JSON', () => {
            it('shoud get database json string', async () => {
              const sqliteDatabaseString = await dbConn.getJsonString({
                table: 'users'
              });
              expect(sqliteDatabaseString).toMatchSnapshot();
              expect(JSON.parse(sqliteDatabaseString)).toMatchSnapshot();
            });

            it('shoud get selected tables json string', async () => {
              const sqliteDatabaseString = await dbConn.getJsonString({
                tables: ['users', 'roles']
              });
              expect(sqliteDatabaseString).toMatchSnapshot();
              expect(JSON.parse(sqliteDatabaseString)).toMatchSnapshot();
            });

            it('should export json file to filepath', async () => {
              await dbConn.exportJson(exportedJsonFilepath, {
                tables: ['users', 'roles']
              });
              const exportedJsonFile = readFileSync(
                exportedJsonFilepath
              ).toString();
              expect(exportedJsonFile).toMatchSnapshot();
            });
          });

          describe('CSV', () => {
            it('should get csv string', async () => {
              const sqliteDatabaseString = await dbConn.getCsvString({
                table: 'users'
              });
              expect(sqliteDatabaseString).toMatchSnapshot();
            });

            it('should fail on exporting multiple tables', async () => {
              const filepath = path.join(
                __dirname,
                'fixtures',
                '.tmp.export.csv'
              );
              await dbConn
                .exportCsv(filepath, {
                  tables: ['users', 'roles']
                })
                .catch(res => {
                  expect(() => {
                    throw res;
                  }).toThrowErrorMatchingSnapshot();
                });
            });

            it('should export single table', async () => {
              await dbConn.exportCsv(exportedCsvFilepath, {
                table: 'users'
              });
              const exportedCsvFile = readFileSync(
                exportedCsvFilepath
              ).toString();
              expect(exportedCsvFile).toMatchSnapshot();
            });
          });
        });

        describe('Query', () => {
          describe('.executeQuery', () => {
            const includePrimaryKey = dbClient === 'cassandra';

            beforeEach(async () => {
              await dbConn.executeQuery(`
                INSERT INTO roles (${includePrimaryKey ? 'id,' : ''} name)
                VALUES (${includePrimaryKey ? '1,' : ''} 'developer')
              `);

              await dbConn.executeQuery(`
                INSERT INTO users (${
                  includePrimaryKey ? 'id,' : ''
                } username, email, password, role_id, createdat)
                VALUES (${
                  includePrimaryKey ? '1,' : ''
                } 'maxcnunes', 'maxcnunes@gmail.com', '123456', 1,'2016-10-25')
              `);
            });

            afterEach(async () => {
              await dbConn.truncateAllTables();
            });

            describe('SELECT', () => {
              it('should get query selector top', async () => {
                expect(
                  await dbConn.getQuerySelectTop('users', 10)
                ).toMatchSnapshot();
              });

              it('should execute an empty query', async () => {
                const results = await dbConn.executeQuery('');
                expect(results).toEqual([]);
              });

              it('should execute an query with only comments', async () => {
                const results = await dbConn.executeQuery('-- my comment');
                expect(results).toMatchSnapshot();
              });

              it('should execute a single query with empty result', async () => {
                const results = await dbConn.executeQuery(
                  'select * from users where id = 0'
                );
                expect(results).toMatchSnapshot();
              });

              it('should execute a single query', async () => {
                const results = await dbConn.executeQuery(
                  'select * from users'
                );
                expect(results).toMatchSnapshot();
                const [result] = results;
                const field = name =>
                  result.fields.find(item => item.name === name);

                expect(field('id')).toMatchSnapshot();
                expect(field('username')).toMatchSnapshot();
                expect(field('email')).toMatchSnapshot();
                expect(field('password')).toMatchSnapshot();
                expect(field('role_id')).toMatchSnapshot();
                expect(field('createdat')).toMatchSnapshot();
              });

              if (dbClient === 'mysql' || dbClient === 'postgresql') {
                it('should not cast DATE types to native JS Date objects', async () => {
                  const results = await dbConn.executeQuery(
                    'select createdat from users'
                  );
                  expect(results).toMatchSnapshot();
                });
              }

              it('should execute multiple queries', async () => {
                const results = await dbConn.executeQuery(`
                  select * from users;
                  select * from roles;
                `);
                expect(results).toMatchSnapshot();
              });
            });

            describe('INSERT', () => {
              it('should execute a single query', async () => {
                const results = await dbConn.executeQuery(`
                  insert into users (${
                    includePrimaryKey ? 'id,' : ''
                  } username, email, password)
                  values (${
                    includePrimaryKey ? '1,' : ''
                  } 'user', 'user@hotmail.com', '123456')
                `);
                expect(results).toMatchSnapshot();
              });

              it('should execute multiple queries', async () => {
                const results = await dbConn.executeQuery(`
                  insert into users (username, email, password)
                  values ('user', 'user@hotmail.com', '123456');

                  insert into roles (name)
                  values ('manager');
                `);
                expect(results).toMatchSnapshot();
              });
            });

            describe('DELETE', () => {
              it('should execute a single query', async () => {
                const results = await dbConn.executeQuery(`
                  delete from users where id = 1
                `);
                expect(results).toMatchSnapshot();
              });

              it('should execute multiple queries', async () => {
                const results = await dbConn.executeQuery(`
                  delete from users where username = 'maxcnunes';
                  delete from roles where name = 'developer';
                `);
                expect(results).toMatchSnapshot();
              });
            });

            describe('UPDATE', () => {
              it('should execute a single query', async () => {
                const results = await dbConn.executeQuery(`
                  update users set username = 'max' where id = 1
                `);
                expect(results).toMatchSnapshot();
              });

              it('should execute multiple queries', async () => {
                const results = await dbConn.executeQuery(`
                  update users set username = 'max' where username = 'maxcnunes';
                  update roles set name = 'dev' where name = 'developer';
                `);

                // MSSQL treats multiple non select queries as a single query result
                expect(results).toMatchSnapshot();
              });
            });

            if (dbClient !== 'cassandra' && dbClient !== 'sqlite') {
              describe('CREATE', () => {
                describe('DATABASE', () => {
                  beforeEach(async () => {
                    try {
                      await dbConn.executeQuery(
                        'drop database db_test_create_database'
                      );
                    } catch (err) {
                      // just ignore
                    }
                  });

                  it('should execute a single query', async () => {
                    const results = await dbConn.executeQuery(
                      'create database db_test_create_database'
                    );
                    expect(results).toMatchSnapshot();
                  });
                });
              });
            }

            if (dbClient !== 'cassandra' && dbClient !== 'sqlite') {
              describe('DROP', () => {
                describe('DATABASE', () => {
                  beforeEach(async () => {
                    try {
                      await dbConn.executeQuery(
                        'create database db_test_create_database'
                      );
                    } catch (err) {
                      // just ignore
                    }
                  });

                  it('should execute a single query', async () => {
                    const results = await dbConn.executeQuery(
                      'drop database db_test_create_database'
                    );
                    expect(results).toHaveLength(1);
                    expect(results).toMatchSnapshot();
                  });
                });
              });
            }

            if (dbClient === 'postgresql') {
              describe('EXPLAIN', () => {
                it('should execute a single query', async () => {
                  const results = await dbConn.executeQuery(
                    'explain select * from users'
                  );
                  expect(results).toHaveLength(1);
                  expect(results).toMatchSnapshot();
                });
              });
            }
          });
        });

        describe('Timing', () => {
          // This prevents snapshot tests from failing when profiles return with different
          // timings
          function standardizeQueryDuration(logs) {
            return logs.map(log => ({
              ...log,
              duration: 1
            }));
          }

          it('should log traces', async () => {
            const logs = await dbConn.getLogs();
            expect(standardizeQueryDuration(logs)).toMatchSnapshot();
          });

          it('should log profiles', async () => {
            const logs = await dbConn.getLogs();
            expect(standardizeQueryDuration(logs)).toMatchSnapshot();
          });
        });

        describe('Table/Schema Alteration', () => {
          it('should rename and drop table, add and drop fooColumn, renames columns', async () => {
            expect(await dbConn.getTableNames()).toEqual(['roles', 'users']);
            await dbConn.renameTable('users', 'foo');
            expect(await dbConn.getTableNames()).toEqual(['roles', 'foo']);
            await dbConn.dropTable('foo');
            expect(await dbConn.getTableNames()).toEqual(['roles']);

            await dbConn.addTableColumn('roles', 'fooColumn', 'INTEGER');
            await await delay(1000);
            expect(await dbConn.getTableColumnNames('roles')).toEqual([
              'id',
              'name',
              'fooColumn'
            ]);
            await dbConn.dropTableColumns('roles', ['fooColumn']);
            await delay(2000);
            expect(await dbConn.getTableColumnNames('roles')).toEqual([
              'id',
              'name'
            ]);

            await dbConn.renameTableColumns('roles', [
              { oldColumnName: 'name', newColumnName: 'NAME' },
              { oldColumnName: 'id', newColumnName: 'ID' }
            ]);
            await delay(2000);
            expect(await dbConn.getTableColumnNames('roles')).toEqual([
              'ID',
              'NAME'
            ]);
          });
        });
      });
    });
  });
});

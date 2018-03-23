// @flow
/* eslint no-await-in-loop: 0 */
import Queries from '../src/config/QueryManager';

async function queryFactory(queries, queryCount: number = 1) {
  const array = new Array(queryCount);
  for (let i = 0; i < array.length; i++) {
    array[i] = await queries.add({
      id: `test-id-${i + 1}`,
      name: `test-query-${i + 1}`,
      type: 'sqlite',
      query: 'SELECT * FROM users',
      color: 'default'
    });
  }
  return Promise.all(array);
}

describe('Queries', function testQueries() {
  beforeEach(async () => {
    this.queries = new Queries();
    await queryFactory(this.queries, 3);
  });

  afterEach(async () => {
    await this.queries.removeAll();
  });

  it('should get all queries', async () => {
    const queries = await this.queries.getAll();
    expect(queries).toMatchSnapshot();
  });

  it('should delete a single query', async () => {
    const queries = await this.queries.getAll();
    const queryIdToDelete = queries[0].id;
    await this.queries.remove(queryIdToDelete);
    const newQueries = await this.queries.getAll();
    expect(newQueries).toMatchSnapshot();
  });

  it('should update a single query', async () => {
    const queries = await this.queries.getAll();
    const queryIdToDelete = queries[0].id;
    await this.queries.update(queryIdToDelete, {
      id: 'test-id-foo',
      name: 'test-query-foo',
      password: 'test-password',
      type: 'sqlite'
    });
    const newQueries = await this.queries.getAll();
    expect(newQueries).toMatchSnapshot();
  });

  it('should get a single query', async () => {
    const queries = await this.queries.getAll();
    const queryId = queries[2].id;
    const query = await this.queries.get(queryId);
    expect(query).toMatchSnapshot();
  });

  it('should perform basic validation', async () => {
    expect(() => {
      this.queries.validateBeforeCreation({
        id: 12,
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.queries.validateBeforeCreation({
        id: 12,
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.queries.validateBeforeCreation({
        id: 'foo',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.queries.validateBeforeCreation({
        id: 'foo',
        name: 'foo',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      this.queries.validateBeforeCreation({
        id: 'foo',
        name: 'foo',
        type: 'sqlite'
      });
    }).toThrowErrorMatchingSnapshot();
  });
});

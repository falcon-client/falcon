import fs from 'fs';
import path from 'path';
import cassandraDriver from 'cassandra-driver';

export default function run(config) {
  beforeAll(async () => {
    const client = new cassandraDriver.Client({
      contactPoints: [config.host]
    });
    const script = fs.readFileSync(path.join(__dirname, 'schema/schema.cql'), {
      encoding: 'utf8'
    });
    const queries = script.split(';').filter(query => query.trim().length);
    await Promise.all(queries.map(query => executeQuery(client, query)));
  });
}

function executeQuery(client, query) {
  return new Promise((resolve, reject) => {
    client.execute(query, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

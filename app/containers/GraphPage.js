import React, { Component } from 'react';
import { Voyager } from 'graphql-voyager/dist/voyager';
import { db, config } from 'falcon-core';
import path from 'path';
import os from 'os';

const serverInfo = {
  database: path.join(os.homedir(), 'Desktop/demo.sqlite'),
  client: 'sqlite'
};

export default class GraphPage extends Component {
  render() {
    return (
      <Voyager
        introspection={introspectionProvider}
        workerURI="https://unpkg.com/voyager-worker-test@1.0.0/index.js"
      />
    );
  }
}

async function introspectionProvider(query) {
  const serverSession = db.createServer(serverInfo);
  const connection = await serverSession.createConnection(serverInfo.database);
  await connection.connect(serverInfo);

  await connection.startGraphQLServer();

  return fetch(`http://localhost:${connection.getGraphQLServerPort()}/graphql`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(response => response.json());
}

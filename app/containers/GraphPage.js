import React, { Component } from 'react';
import { Voyager } from 'graphql-voyager/dist/voyager';
import { db, config } from 'falcon-core';
import path from 'path';

const serverInfo = {
  database: path.join(__dirname, 'demo.sqlite'),
  client: 'sqlite'
};

export default class GraphPage extends Component {
  render() {
    return (
      <Voyager
        introspection={introspectionProvider}
        workerURI="http://127.0.0.1:3002/voyager.worker.js"
      />
    );
  }
}

async function introspectionProvider(query) {
  const serverSession = db.createServer(serverInfo);
  const path = require('path');
  const dbPath = path.join(__dirname, '..', 'test', 'demo.sqlite');
  console.log(dbPath);
  const connection = await serverSession.createConnection(dbPath);
  await connection.connect(serverInfo);

  await connection.startGraphQLServer();

  return fetch('http://localhost:3001/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(response => response.json());
}

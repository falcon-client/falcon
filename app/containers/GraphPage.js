// @flow
import React from 'react';
import { Voyager } from 'graphql-voyager/dist/voyager';
import { db } from 'falcon-core';

type Props = { databasePath: string };

export default function GraphPage(props: Props) {
  return (
    <Voyager
      introspection={introspectionProvider}
      workerURI="https://unpkg.com/voyager-worker-test@1.0.0/index.js"
    />
  );

  async function introspectionProvider(query) {
    const serverInfo = {
      database: props.databasePath,
      client: 'sqlite'
    };
    const serverSession = db.createServer(serverInfo);
    const connection = await serverSession.createConnection(
      serverInfo.database
    );
    await connection.connect(serverInfo);

    await connection.startGraphQLServer();

    return fetch(
      `http://localhost:${connection.getGraphQLServerPort()}/graphql`,
      {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }
    ).then(response => response.json());
  }
}

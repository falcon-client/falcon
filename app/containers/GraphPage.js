// @flow
import React from 'react';
import { Voyager } from 'graphql-voyager/dist/voyager';

type Props = {
  databasePath: string,
  connection: Object
};

export default function GraphPage(props: Props) {
  return (
    <Voyager
      className="Graph"
      introspection={introspectionProvider}
      workerURI="https://unpkg.com/voyager-worker-test@1.0.0/index.js"
    />
  );

  async function introspectionProvider(query) {
    await props.connection.startGraphQLServer();
    return fetch(
      `http://localhost:${props.connection.getGraphQLServerPort()}/graphql`,
      {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }
    ).then(response => response.json());
  }
}

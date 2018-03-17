// @flow
import React from 'react';
import { Voyager } from './GraphQlVoyager';

type Props = {
  databasePath: string,
  connection?: ?Object
};

export default function GraphPage(props: Props) {
  async function introspectionProvider(query) {
    try {
      await props.connection.startGraphQLServer();
    } catch (e) {
      console.log(e);
    }
    return fetch(
      `http://localhost:${props.connection.getGraphQLServerPort()}/graphql`,
      {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }
    ).then(response => response.json());
  }

  const worker = import('./GraphQlVoyager.worker').then(VoyagerWorker => new VoyagerWorker());

  return (
    <Voyager
      className="Graph"
      introspection={introspectionProvider}
      workerURI={worker}
    />
  );
}

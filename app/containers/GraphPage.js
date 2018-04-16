// @flow
import React, { Component } from 'react';
import { Voyager } from '@falcon-client/graphql-voyager';

type Props = {
  databasePath: string,
  connection?: ?Object
};

export default class GraphPage extends Component {
  props: Props;

  shouldComponentUpdate(nextProps) {
    return this.props.connection.database !== nextProps.connection.database;
  }

  render() {
    const { props } = this;
    const worker = import('worker-loader!@falcon-client/graphql-voyager/es/worker.js')
      .then(o => o.default)
      .then(VoyagerWorker => new VoyagerWorker());

    async function introspectionProvider(query) {
      try {
        await props.connection.startGraphQLServer();
        console.log(props.connection.getGraphQLServerPort());
      } catch (e) {
        console.log(e);
      }
      console.log(props.connection);
      return fetch(
        `http://localhost:${props.connection.getGraphQLServerPort()}/graphql`,
        {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        }
      ).then(response => response.json());
    }

    return (
      <Voyager
        className="Graph"
        introspection={introspectionProvider}
        workerURI={worker}
      />
    );
  }
}

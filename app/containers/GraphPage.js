// @flow
import React, { Component } from 'react';
import { Voyager } from '@falcon-client/graphql-voyager';

type Props = {
  connection?: ?Object
};

export default class GraphPage extends Component {
  props: Props;

  static defaultProps = {
    connection: null
  };

  shouldComponentUpdate(nextProps) {
    return this.props.connection.database !== nextProps.connection.database;
  }

  render() {
    const { connection } = this.props;
    const worker = import('worker-loader!@falcon-client/graphql-voyager/es/worker.js')
      .then(o => o.default || o)
      .then(VoyagerWorker => new VoyagerWorker());

    async function introspectionProvider(query) {
      try {
        await connection.startGraphQLServer();
      } catch (e) {
        console.log(e);
      }
      return fetch(
        `http://localhost:${connection.getGraphQLServerPort()}/graphql`,
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

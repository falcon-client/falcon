import React, { Component } from 'react';
import { Voyager } from 'graphql-voyager/dist/voyager';

export default class Graph extends Component {

  render() {
    return (
      <Voyager
        introspection={introspectionProvider}
        workerURI="http://127.0.0.1:3000/voyager.worker.js"
      />
    );
  }
}

function introspectionProvider(query) {
  return fetch('http://localhost:4000/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(response => response.json());
}

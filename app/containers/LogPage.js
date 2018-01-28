// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';

/**
 * @TOOD: Migrate to react-virtualized for faster row rendering
 */
export default class LogPage extends Component {
  render() {
    const data = [{
      query: 'SELECT * FROM USERS',
      duration: '10ms',
      time: new Date().toString()
    }, {
      query: 'SELECT ',
      duration: '100ms',
      time: new Date().toString()
    }];

    const columns = [{
      Header: 'Query',
      accessor: 'query' // String-based value accessors!
    }, {
      Header: 'Duration',
      accessor: 'duration'
    }, {
      Header: 'Time',
      accessor: 'time'
    }];

    return (
      <ReactTable
        data={data}
        columns={columns}
      />
    );
  }
}

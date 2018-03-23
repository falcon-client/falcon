// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';

/**
 * @TOOD: Migrate to react-virtualized for faster row rendering
 */
export default class LogPage extends Component {
  props: {
    logs: Array<logType>
  };

  columns = [
    {
      Header: 'Query',
      accessor: 'query'
    },
    {
      Header: 'Duration',
      accessor: 'duration'
    },
    {
      Header: 'Time',
      accessor: 'time'
    }
  ];

  render() {
    return <ReactTable data={this.props.logs} columns={this.columns} />;
  }
}
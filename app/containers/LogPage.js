// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';

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
    return (
      <ReactTable
        className="LogPage"
        data={this.props.logs}
        columns={this.columns}
      />
    );
  }
}

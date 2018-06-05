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
    const logs = this.props.logs.map(e => ({
      ...e,
      duration: `${e.duration} ns`
    }));
    return (
      <ReactTable className="LogPage" data={logs} columns={this.columns} />
    );
  }
}

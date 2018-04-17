// @flow
import React, { Component } from 'react';
import VirtualList from './VirtualList';
import type { TableType } from '../types/TableType';

type Props = {
  table: TableType
};

export default class Content extends Component<Props, {}> {
  rowHeight = 30;

  state = {
    data: []
  };

  constructor(props) {
    super();
    this.state.data = props.table.rows.map(value => value.value);
  }

  renderRow(row) {
    return (
      <div className="VirtualList-row">
        {/* @HACK: node-sqlite3 sometimes returns buffers. This kilss rendering perf */}
        {row.join(',   ')}
      </div>
    );
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.table.rows.map(value => value.value)
    });
  }

  render() {
    return (
      <div>
        <VirtualList
          sync={false}
          className="VirtualList"
          overscanCount={10}
          data={this.state.data}
          rowHeight={this.rowHeight}
          renderRow={this.renderRow}
        />
      </div>
    );
  }
}

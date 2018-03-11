// @flow
import React, { Component } from 'react';
import Table from '../containers/Table';
import type { TableType } from '../types/TableType';
import VirtualList from './VirtualList';

type Props = {
  table: TableType
};

// static data
const DATA = [];
for (let x = 1e5; x--; ) DATA[x] = `Item #${x + 1}`;

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
    return <div className="VirtualList-row">{row}</div>;
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

  // render() {
  //   return <Table table={this.props.table} />;
  // }
}

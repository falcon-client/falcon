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

  renderRow(row) {
    return <div className="VirtualList-row">{row}</div>;
  }

  // render() {
  //   return (
  //     <div>
  //       <VirtualList
  //         sync={false}
  //         className="VirtualList"
  //         overscanCount={10}
  //         data={DATA}
  //         rowHeight={this.rowHeight}
  //         renderRow={this.renderRow}
  //       />
  //     </div>
  //   );
  // }

  render() {
    return <Table table={this.props.table} />;
  }
}

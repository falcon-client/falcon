// @flow
import React, { PureComponent } from 'react';
import Table from './Table';
import type { TableType } from '../types/TableType';
// Update to react 16 with this link
// https://github.com/bvaughn/react-virtualized/blob/master/source/Grid/Grid.example.js

type Props = {
  table: TableType
};

type State = {};

export default class GridWrapper extends PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (
      <Table table={this.props.table} />
    );
  }
}


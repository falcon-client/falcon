// @flow
import React, { PureComponent } from 'react';
import Table from './Table';
import type { TableType } from '../types/TableType';
// Update to react 16 with this link
// https://github.com/bvaughn/react-virtualized/blob/master/source/Grid/Grid.example.js

/**
  * Creates the table to be passed to react-handsontable. Does not mutate
  * @param {*} table table taken from falcon-core
  */
function initTableArray(table: TableType) {
  const columns = [...table.columns];
  const rows = rows.map(row => row.map(value => value));
  return [columns, rows];
}

type Props = {
  table: TableType
};

type State = {};

export default class GridWrapper extends PureComponent<Props, State> {
  constructor(props, context) {
    super(props, context);

    this.state = {
      // tableData: initTableArray(this.props.table),
    };
  }

  componentDidMount() {

  }

  render() {
    // console.log(this.props);


    return (
      <Table />
    );
  }
}


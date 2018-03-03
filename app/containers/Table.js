// @flow
import React, { Component } from 'react';
import Handsontable from 'handsontable';
import type { TableType } from '../types/TableType';

type Props = {
  table: TableType
};

/**
 * Handsontable modifies passed table data. Need to make copies to passed
 * props immutable
 */
export default class Table extends Component<Props> {
  state = {
    className: 'htLeft',
    contextMenu: [
      'row_above',
      'row_below',
      '---------',
      'col_left',
      'col_right',
      '---------',
      'remove_row',
      '---------',
      'undo',
      'redo'
    ],
    data: this.props.table.rows.map(row => row.value),
    colHeaders: [...this.props.table.columns.map(col => col.name)],
    afterGetColHeader: true,
    manualColumnResize: true,
    stretchH: 'all',
    currentRowClassName: 'currentRow'
  };

  componentDidMount() {
    this.table = new Handsontable(this.$elm, this.state);
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({
      data: nextProps.table.rows.map(row => row.value),
      colHeaders: [...nextProps.table.columns.map(col => col.name)]
    });
    this.table.updateSettings(this.state);
  }

  componentDidUpdate() {
    this.table.updateSettings(this.state);
  }

  render() {
    return <div ref={$elm => (this.$elm = $elm)} />;
  }
}

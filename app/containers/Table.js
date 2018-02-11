// @flow
import React from 'react';
import Handsontable from 'handsontable';
import type { TableType } from '../types/TableType';

type Props = {
  table: TableType
};

/**
  * Creates the table to be passed to react-handsontable. Does not mutate
  * @param {*} table table taken from falcon-core
  */
function initTableData(table) {
  const rows = table.rows.map(row => row.value.map(value => value));
  return rows;
}

/**
  * Creates the table to be passed to react-handsontable. Does not mutate
  * @param {*} table table taken from falcon-core
  */
function initTableHeaders(table) {
  const columns = [...table.columns];
  return columns;
}

/**
 * Handsontable modifies passed table data. Need to make copies to passed
 * props immutable
 */
export default class Table extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      className: 'htCenter htMiddle',
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
      data: initTableData(props.table),
      colHeaders: initTableHeaders(props.table),
      afterGetColHeader: true,
      manualColumnResize: true,
      stretchH: 'all',
      currentRowClassName: 'currentRow'
    };
  }

  componentDidMount() {
    this.table = new Handsontable(this.$elm, this.state);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ data: initTableData(nextProps.table), colHeaders: initTableHeaders(nextProps.table) });
    this.table.updateSettings(this.state);
  }

  componentDidUpdate() {
    this.table.updateSettings(this.state);
  }

  render() {
    return (
      <div ref={$elm => (this.$elm = $elm)} />
    );
  }
}

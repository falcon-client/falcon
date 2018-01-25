// @flow
import React, { PureComponent } from 'react';
import { AutoSizer, Grid } from 'react-virtualized';
import type { TableType } from '../types/TableType';
// Update to react 16 with this link
// https://github.com/bvaughn/react-virtualized/blob/master/source/Grid/Grid.example.js

type Props = {
  table: TableType
};

type State = {

};

export default class GridWrapper extends PureComponent<Props, State> {
  constructor(props, context) {
    super(props, context);

    this.state = {
      height: 300,
      overscanColumnCount: 0,
      overscanRowCount: 10,
      rowHeight: 40,
      scrollToColumn: undefined,
      scrollToRow: undefined,
      useDynamicRowHeight: false,
    };

    this._cellRenderer = this._cellRenderer.bind(this);
    this._getColumnWidth = this._getColumnWidth.bind(this);
    this._getRowClassName = this._getRowClassName.bind(this);
    this._getRowHeight = this._getRowHeight.bind(this);
    this._noContentRenderer = this._noContentRenderer.bind(this);
    this._onColumnCountChange = this._onColumnCountChange.bind(this);
    this._onRowCountChange = this._onRowCountChange.bind(this);
    this._onScrollToColumnChange = this._onScrollToColumnChange.bind(this);
    this._onScrollToRowChange = this._onScrollToRowChange.bind(this);
    this._renderBodyCell = this._renderBodyCell.bind(this);
  }

  render() {
    // console.log(this.props);
    const columnCount = this.props.table.columns.length;
    const rowCount = this.props.table.rows.length + 1; // + 1 for column labels
    const {
      overscanColumnCount,
      overscanRowCount,
      rowHeight,
      scrollToColumn,
      scrollToRow,
      useDynamicRowHeight,
    } = this.state;

    return (<AutoSizer >
      {({ height, width }) => (
        <Grid
          cellRenderer={this._cellRenderer}
          columnWidth={width / columnCount}
          columnCount={columnCount}
          height={height}
          noContentRenderer={this._noContentRenderer}
          overscanColumnCount={overscanColumnCount}
          overscanRowCount={overscanRowCount}
          rowHeight={useDynamicRowHeight ? this._getRowHeight : rowHeight}
          rowCount={rowCount}
          scrollToColumn={scrollToColumn}
          scrollToRow={scrollToRow}
          width={width}
        />
          )}
            </AutoSizer>);
  }

  _cellRenderer({
    columnIndex, key, rowIndex, style
  }) {
    console.log(this.state);

    return rowIndex === 0 ? this._renderHeaderCell({
      columnIndex, key, rowIndex, style
    }) : this._renderBodyCell({
      columnIndex, key, rowIndex, style
    });
  }

  _getColumnWidth({ index }) {
    return 80;
    // switch (index) {
    //   case 0:
    //     return 50;
    //   case 1:
    //     return 100;
    //   case 2:
    //     return 300;
    //   default:
    //     return 80;
    // }
  }

  _getDatum(index) {
    const { list } = this.context;

    return 20;

    // return list.get(index % list.size);
  }

  _getRowClassName(row) {
    return {
      borderStyle: 'solid',
      borderWidth: '1px',
      backgroundColor: row % 2 == 1 ? '#e6e6e6' : 'white',
      display: 'flex',
      justifyContent: 'center', /* align horizontal */
      alignItems: 'center' /* align vertical */
    };
    // return row % 2 === 0 ? styles.evenRow : styles.oddRow;
  }

  _getRowHeight({ index }) {
    return this._getDatum(index).size;
  }

  _noContentRenderer() {
    return <div>No cells</div>;
  }

  _renderBodyCell({
    columnIndex, key, rowIndex, style
  }) {
    const rowClass = this._getRowClassName(rowIndex);
    const datum = this._getDatum(rowIndex);

    // rowIndex - 1 to compensate for header
    return (<div key={key} style={{ ...style, ...rowClass }}>
      {this.props.table.rows[rowIndex - 1].value[columnIndex]}
    </div>);
  }

  _renderHeaderCell({
    columnIndex, key, rowIndex, style
  }) {
    const rowClass = this._getRowClassName(rowIndex);
    const datum = this._getDatum(rowIndex);

    return (<div key={key} style={{ ...style, ...rowClass }}>
      <h3>{this.props.table.columns[columnIndex]}</h3>
    </div>);
  }

  _updateUseDynamicRowHeights(value) {
    this.setState({
      useDynamicRowHeight: value,
    });
  }

  _onColumnCountChange(event) {
    const columnCount = parseInt(event.target.value, 10) || 0;

    this.setState({ columnCount });
  }

  _onRowCountChange(event) {
    const rowCount = parseInt(event.target.value, 10) || 0;

    this.setState({ rowCount });
  }

  _onScrollToColumnChange(event) {
    const { columnCount } = this.state;
    let scrollToColumn = Math.min(
      columnCount - 1,
      parseInt(event.target.value, 10),
    );

    if (isNaN(scrollToColumn)) {
      scrollToColumn = undefined;
    }

    this.setState({ scrollToColumn });
  }

  _onScrollToRowChange(event) {
    const { rowCount } = this.state;
    let scrollToRow = Math.min(rowCount - 1, parseInt(event.target.value, 10));

    if (isNaN(scrollToRow)) {
      scrollToRow = undefined;
    }

    this.setState({ scrollToRow });
  }
}

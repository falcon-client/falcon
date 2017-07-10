import React from 'react';
import { AutoSizer, Grid } from 'react-virtualized';

export default React.createClass({
  getInitialState() {
    return {};
  },

  render() {
    const cellRenderer = this._cellRenderer;

    return React.createElement(
      AutoSizer,
      {
        ref: 'AutoSizer',
      },
      (params) => React.createElement(
          Grid,
        {
          columnCount: 1000,
          columnWidth: 100,
          height: params.height,
          ref: 'Grid',
          cellRenderer,
          rowHeight: 30,
          rowCount: 1000,
          width: params.width
        }
        )
    );
  },

  _cellRenderer(params) {
    const columnIndex = params.columnIndex;
    const rowIndex = params.rowIndex;
    const key = `c:${columnIndex}, r:${rowIndex}`;
    const setState = this.setState.bind(this);
    const grid = this.refs.AutoSizer.refs.Grid;

    const className = columnIndex === this.state.hoveredColumnIndex || rowIndex === this.state.hoveredRowIndex
      ? 'item hoveredItem'
      : 'item';

    return React.DOM.div({
      className,
      key: params.key,
      onMouseOver() {
        setState({
          hoveredColumnIndex: columnIndex,
          hoveredRowIndex: rowIndex
        });
        grid.forceUpdate();
      },
      style: params.style
    }, key);
  }
});

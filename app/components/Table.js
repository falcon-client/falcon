// @flow
import React from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import type { TableType } from '../types/TableType';


const tableData = [
  ['Phase', 'Day 1', 'Day 2', 'Day 3', 'Day 4'],
  ['Warm Up', 10, 11, 12, 13, 5, 12, 5, 2],
  ['', 20, 11, 14, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['5/3/1', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['The Triumvirate', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2],
  ['', 30, 15, 12, 13, 5, 12, 5, 2]
];


export default class Table extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
    	options: {
        data: tableData,
      	colHeaders: true,
	      afterGetColHeader: true,
      }
    };
  }

  componentDidMount() {
    const $elm = ReactDOM.findDOMNode(this);
    this.table = new Handsontable($elm, this.state.options);
  }

  componentWillReceiveProps(nextProps) {
  	const { ...options } = nextProps;
    this.setState({ options: Object.assign(this.state.options, options) });
  }

  componentDidUpdate() {
    this.table.updateSettings(this.state.options);
  }

  render() {
    return <div />;
  }
}

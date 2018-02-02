// @flow
import React, { Component } from 'react';
import Table from '../containers/Table';
import type { TableType } from '../types/TableType';
// import Footer from './Footer';

type Props = {
  table: TableType
};

type State = {

};
export default class Content extends Component<Props, State> {
  render() {
    return (
      <Table table={this.props.table} />
    );
  }
}

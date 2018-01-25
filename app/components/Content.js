// @flow
import React, { Component } from 'react';
import Grid from './Grid';
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
      <Grid table={this.props.table} />
    );
  }
}

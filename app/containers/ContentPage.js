// @flow
import React, { Component } from 'react';
import Content from '../components/Content';
import type { TableType } from '../types/TableType';

type Props = {
  table: Array<TableType>
};

type State = {

};

export default class ContentPage extends Component<Props, State> {
  render() {
    return (
      <Content table={this.props.table} />
    );
  }
}

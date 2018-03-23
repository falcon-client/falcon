// @flow
import React, { PureComponent } from 'react';
import Content from '../components/Content';
import type { TableType } from '../types/TableType';

type Props = {
  table: TableType
};

export default class ContentPage extends PureComponent<Props, {}> {
  render() {
    return <Content table={this.props.table} />;
  }
}

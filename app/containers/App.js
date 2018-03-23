// @flow
import React, { PureComponent } from 'react';
import type { Children } from 'react';

type Props = { children: Children };
type State = {};

export default class App extends PureComponent<Props, State> {
  render() {
    return <div>{this.props.children}</div>;
  }
}

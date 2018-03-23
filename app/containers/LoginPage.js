// @flow
import React, { PureComponent } from 'react';
import Login from '../components/Login';

export default class LoginPage extends PureComponent {
  render() {
    return (
      <Login
        history={this.props.history}
        connectionManager={this.props.connectionManager}
      />
    );
  }
}

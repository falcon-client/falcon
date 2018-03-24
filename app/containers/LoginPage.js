// @flow
import React, { Component } from 'react';
import Login from '../components/Login';

export default class LoginPage extends Component {
  render() {
    console.log('rendering', this.props);
    return (
      <Login
        history={this.props.history}
        connectionManager={this.props.connectionManager}
      />
    );
  }
}

// @flow
import React, { Component } from 'react';

export default class Login extends Component {
  render() {
    return (
      <div className="Login">
        <div className="Login--container">
          <div className="row">
            <div className="col-12 row-margin text-center">
              <h2 className="Login--header">Create Connection</h2>
            </div>
            <div className="col-12">
              <h3 className="text-left Login--input-label">connection name</h3>
              <input placeholder="My first connection" type="text" />
            </div>
            <div className="col-6">
              <h3 className="text-left Login--input-label">host</h3>
              <input placeholder="localhost" type="text" />
            </div>
            <div className="col-6">
              <h3 className="text-left Login--input-label">port</h3>
              <input placeholder="5432" type="text" />
            </div>
            <div className="col-12">
              <h3 className="text-left Login--input-label">username</h3>
              <input placeholder="root" type="text" />
            </div>
            <div className="col-12">
              <h3 className="text-left Login--input-label">password</h3>
              <input type="password" />
            </div>
            <div className="col-12 row-margin Login--submit-button-container">
              <div className="Login--submit-button">Connect</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

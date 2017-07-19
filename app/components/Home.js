// @flow
import React, { Component } from 'react';
import Tabs from './Tabs';
import Grid from './Grid';
import Sidebar from './Sidebar';

export default class Home extends Component {
  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="sticky">
            <div className="Header col-sm-12">
              <div className="Header--container Header--container-status">
                <span className="Connection"><i className="ion-locked Connection--lock Connection--lock-secure" /> <a href="">Connected</a></span>
                <span><a href="">SQLite Version 3.1.6</a></span>
              </div>
              <div className="Header--container">
                <a href="">Falcon > sqlectron > compat-db</a>
              </div>
              <div className="Header--container Header--container-hidden">
                <div className="Header--button ion-android-refresh" />
                <div className="Header--button ion-android-add" />
              </div>
            </div>
            <div className="col-sm-12 no-padding">
              {/* <Tabs /> */}
            </div>
            <div className="row no-margin">
              <div className="col-2 no-padding">
                <Sidebar />
              </div>
              <div className="Grid col-10">
                <Grid />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

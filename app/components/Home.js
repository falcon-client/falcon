// @flow
import React, { Component } from 'react';
import { Resizable, ResizableBox } from 'react-resizable';
import Tabs from './Tabs';
import Grid from './Grid';
import Footer from './Footer';
import Sidebar from './Sidebar';

export default class Home extends Component {
  state = {
    widthSidebar: 200,
    widthGrid: window.innerWidth - 200,
  };

  componentDidMount() {
    window.onresizeFunctions.push(() => {
      this.setState({
        widthSidebar: this.state.widthSidebar,
        widthGrid: window.innerWidth - this.state.widthSidebar
      });
    });
  }

  onResizeGrid = (event, { size }) => {
    this.setState({
      widthGrid: size.width,
      widthSidebar: window.innerWidth - size.width
    });
  };

  onResizeSidebar = (event, { size }) => {
    this.setState({
      widthSidebar: size.width,
      widthGrid: window.innerWidth - size.width
    });
  };

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
            {/**
            <div className="col-sm-12 no-padding">
              <Tabs />
            </div> **/}
            <div className="row no-margin">
              <ResizableBox
                width={this.state.widthSidebar}
                height={100}
                minConstraints={[100, 200]}
                maxConstraints={[400, 400]}
                onResize={this.onResizeSidebar}
                handleSize={[100, 100]}
                axis={'x'}
              >
                <Sidebar />
              </ResizableBox>
              <div className="Grid" style={{ position: 'relative', width: this.state.widthGrid }}>
                <Grid />
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

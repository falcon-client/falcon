// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import type { Children } from 'react';
// import Tabs from '../components/Tabs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';

export default class App extends Component {
  props: {
    children: Children
  };

  state = {
    widthSidebar: 200,
    widthGrid: window.innerWidth - 200
  };

  componentDidMount() {
    window.onresizeFunctions['sidebar-resize-set-state'] = () => {
      this.setState({
        widthSidebar: this.state.widthSidebar,
        widthGrid: window.innerWidth - this.state.widthSidebar
      });
    };

    const grid = document.querySelector('.App .Grid');
    const sidebar = document.querySelector('.Sidebar');
    const height = 32 + 10 + 21 + 15;
    grid.style.height = `${window.innerHeight - height}px`;
    sidebar.style.height = `${window.innerHeight - height + 40}px`;

    // If the window is resized, change the height of the grid repsectively
    window.onresizeFunctions['resize-grid-resize'] = () => {
      grid.style.height = `${window.innerHeight - height}px`;
      sidebar.style.height = `${window.innerHeight - height + 40}px`;
    };
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
      <div className="App container-fluid">
        <div className="row">
          <div className="sticky">
            <Header />
            {/**
            <div className="col-sm-12 no-padding">
              <Tabs />
            </div> * */}
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
              <div
                className="Grid"
                style={{ position: 'relative', width: this.state.widthGrid }}
              >
                {this.props.children}
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

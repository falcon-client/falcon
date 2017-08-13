// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import Content from '../components/Content';

export default class QueryPage extends Component {
  state = {
    queryHeight: (window.innerHeight - 40) / 2,
    queryResultsHeight: (window.innerHeight - 40) / 2
  }

  item = null;

  componentDidMount() {
    this.item = document.querySelector('.QueryPage').parentElement;
    window.onresizeFunctions['query-page-resize'] = () => {
      this.setState({
        queryResultsHeight: this.item.offsetHeight - this.state.queryHeight,
      });
    };
  }

  onQueryResize = (event, { size }) => {
    this.setState({
      queryHeight: size.height,
      queryResultsHeight: this.item.offsetHeight - size.height,
    });
  };

  render() {
    return (
      <div className="QueryPage">
        <ResizableBox
          width={10}
          height={this.state.queryHeight}
          axis={'y'}
          handleSize={[100, 100]}
          style={{ height: `${this.state.queryHeight}px` }}
          onResize={this.onQueryResize}
        >
          {this.state.queryHeight},
          {this.state.queryResultsHeight}
        </ResizableBox>
        <div style={{ height: this.state.queryResultsHeight }}>
          <Content />
        </div>
      </div>
    );
  }
}

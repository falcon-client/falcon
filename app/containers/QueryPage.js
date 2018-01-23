// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import AceEditor from 'react-ace';
import 'brace';
import 'brace/mode/sql';
import 'brace/snippets/sql';
import 'brace/theme/xcode';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import Content from '../components/Content';

export default class QueryPage extends Component {
  state = {
    queryHeight: (window.innerHeight - 40) / 2,
    queryResultsHeight: ((window.innerHeight - 40) / 2) - 40,
    query: 'SELECT * FROM users'
  }

  item = null;

  didMount: boolean = false;

  componentWillUnmount() {
    this.didMount = false;
  }

  componentDidMount() {
    this.didMount = true;
    this.item = document.querySelector('.QueryPage').parentElement;
    window.onresizeFunctions['query-page-resize'] = () => {
      if (this.didMount) {
        this.setState({
          queryResultsHeight: this.item.offsetHeight - this.state.queryHeight,
        });
      }
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
          axis="y"
          handleSize={[100, 100]}
          style={{ height: `${this.state.queryHeight}px` }}
          onResize={this.onQueryResize}
        >
          <AceEditor
            mode="sql"
            theme="xcode"
            name="querybox"
            value={this.state.query}
            focus
            width="100%"
            height="100%"
            showPrintMargin={false}
            editorProps={{ $blockScrolling: Infinity }}
            enableBasicAutocompletion
            enableSnippets
            enableLiveAutocompletion={false}
          />
        </ResizableBox>
        <div style={{ height: this.state.queryResultsHeight }}>
          <Content />
        </div>
      </div>
    );
  }
}

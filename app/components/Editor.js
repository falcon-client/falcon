// @flow
import React, { Component } from 'react';
import AceEditor from 'react-ace';
import 'brace';
import 'brace/mode/sql';
import 'brace/snippets/sql';
import 'brace/theme/xcode';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';

type Props = {
  sql: string
};

export default class Editor extends Component<Props, {}> {
  props: Props;

  render() {
    return (
      <AceEditor
        focus
        enableBasicAutocompletion
        enableSnippets
        mode="sql"
        theme="xcode"
        name="querybox"
        width="100%"
        height="100%"
        value={this.props.sql}
        editorProps={{ $blockScrolling: Infinity }}
        showPrintMargin={false}
        enableLiveAutocompletion={false}
        {...this.props}
      />
    );
  }
}

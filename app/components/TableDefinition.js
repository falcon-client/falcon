// @flow
import React, { Component } from 'react';
import MonacoEditor from 'react-monaco-editor';

type Props = {
  tableDefinition: string
};

export default class TableDefinition extends Component<Props, {}> {
  props: Props;

  editorDidMount(editor, monaco) {}

  // onChange(newValue: string, e) {}

  render() {
    const { tableDefinition } = this.props;
    // Options for Monaco:
    // https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html#editortype
    const options = {
      selectOnLineNumbers: true,
      minimap: {
        enabled: false
      },
      readOnly: true
    };
    return (
      <MonacoEditor
        width="100%"
        height="300"
        language="sql"
        theme="vs"
        value={tableDefinition}
        options={options}
        onChange={(a, b) => this.onChange(a, b)}
        editorDidMount={(a, b) => this.editorDidMount(a, b)}
      />
    );
  }
}

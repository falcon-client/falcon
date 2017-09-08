// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';
import Select from 'react-select';
import TagAutocomplete from 'react-tag-autocomplete';

const options = [
  { value: 'BINARY', label: 'BINARY' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'NUMERIC', label: 'NUMERIC' },
  { value: 'REAL', label: 'REAL' },
  { value: 'BLOB', label: 'BLOB' }
];

const data = [{
  name: 'username',
  autoIncrement: 'false',
  primaryKey: 'false',
  defaultTypeValue: 'TEXT',
  notNull: 'false',
  unique: 'true',
  default: 'foo',
  checkConstraints: 'true',
}, {
  name: 'password',
  autoIncrement: 'false',
  primaryKey: 'false',
  defaultTypeValue: 'TEXT',
  notNull: 'false',
  unique: 'true',
  default: 'bar',
  checkConstraints: 'true',
}];


export default class StructurePage extends Component {
  state = {
    values: data.map(column => column.defaultTypeValue),
    tags: [
      { id: 1, name: 'Auto Increment' },
      { id: 2, name: 'Primary Key' }
    ],
    suggestions: [
      { id: 3, name: 'Bananas' },
      { id: 4, name: 'Mangos' },
      { id: 5, name: 'Lemons' },
      { id: 6, name: 'Apricots' }
    ]
  };

  handleDelete(i) {
    const tags = this.state.tags.slice(0);
    tags.splice(i, 1);
    this.setState({ tags });
  }

  handleAddition(tag) {
    const tags = [].concat(this.state.tags, tag);
    this.setState({ tags });
  }

  render() {
    const { values } = this.state;
    const columns = [{
      Header: 'Name',
      accessor: 'name'
    }, {
      Header: 'Type',
      accessor: 'defaultTypeValue',
      Cell: (row) => (
        <span className="number">
          <Select
            name="form-field-name"
            value={values[row.index]}
            onChange={(item) => {
              const updatedRowValues = [...this.state.values];
              updatedRowValues[row.index] = item.value;

              this.setState({
                values: updatedRowValues
              });
            }}
            options={options}
          />
        </span>
      )
    }, {
      accessor: 'default',
      Header: 'Default',
    }, {
      accessor: 'notNull',
      Header: 'Constraints',
      width: '200px',
      Cell: (row) => (
        <TagAutocomplete
          tags={this.state.tags}
          suggestions={this.state.suggestions}
          handleDelete={this.handleDelete.bind(this)}
          handleAddition={this.handleAddition.bind(this)}
        />
      )
    }];

    return (
      <div className="Structure col-offset-2">
        <ReactTable
          data={data}
          columns={columns}
          showPageJump={false}
          minRows={data.length}
          showPagination={false}
        />
      </div>
    );
  }
}

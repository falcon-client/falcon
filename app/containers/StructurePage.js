// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';
import Select from 'react-select';

const options = [
  { value: 'BINARY', label: 'BINARY' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'NUMERIC', label: 'NUMERIC' },
  { value: 'REAL', label: 'REAL' },
  { value: 'BLOB', label: 'BLOB' }
];

function logChange(val) {
  console.log(`Selected: ${JSON.stringify(val)}`);
}

const data = [{
  name: 'username',
  autoIncrement: 'false',
  primaryKey: 'false'
}, {
  name: 'password',
  autoIncrement: 'false',
  primaryKey: 'false'
}];

const columns = [{
  Header: 'Name',
  accessor: 'name' // String-based value accessors!
}, {
  Header: 'Type',
  accessor: 'age',
  Cell: () => (
    <span className="number">
      <Select
        name="form-field-name"
        value="TEXT"
        options={options}
        onChange={logChange}
      />
    </span>
  )
}, {
  accessor: 'autoIncrement', // Required because our accessor is not a string
  Header: 'Auto Increment',
}, {
  accessor: 'primaryKey', // Required because our accessor is not a string
  Header: 'Primary Key',
}];

export default class StructurePage extends Component {
  render() {
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

// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';
import Select from 'react-select';

const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' }
];

function logChange(val) {
  console.log(`Selected: ${JSON.stringify(val)}`);
}

const data = [{
  name: 'Tanner Linsley',
  age: 26,
  friend: {
    name: 'Jason Maurer',
    age: 23,
  }
}];

const columns = [{
  Header: 'Name',
  accessor: 'name' // String-based value accessors!
}, {
  Header: 'Age',
  accessor: 'age',
  Cell: props => (
    <span className="number">
      <Select
        name="form-field-name"
        value="one"
        options={options}
        onChange={logChange}
      />
    </span>
  ) // Custom cell components!
}, {
  id: 'friendName', // Required because our accessor is not a string
  Header: 'Friend Name',
  accessor: d => d.friend.name // Custom value accessors!
}, {
  Header: props => <span>Friend Age</span>, // Custom header components!
  accessor: 'friend.age'
}];

export default class StructurePage extends Component {
  render() {
    return (
      <div className="Structure col-offset-2">
        <ReactTable
          data={data}
          columns={columns}
        />
      </div>
    );
  }
}

// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';
import Select from 'react-select';
import TableColumnType from '../api/Database';

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

type Props = {
  databasePath: string,
  tableName: string,
  getTableColumns: (
    databasePath: string,
    table: string,
  ) => Promise<Array<TableColumnType>>
};

type State = {
  tableColumns: ?TableColumnType
};


export default class StructurePage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      values: data.map(column => column.defaultTypeValue),
      tableColumns: null
    };
  }

  async componentDidMount() {
    const { getTableColumns, tableName, databasePath } = this.props;
    const tableColumns = await getTableColumns(databasePath, tableName);
    console.log(tableColumns);
    this.setState({ tableColumns });
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
    }];

    return (
      <div className="Structure col-offset-2" >
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

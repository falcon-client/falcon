// @flow
import * as React from 'react';

type Props = {
  savedDatabases: Array<{ nickname: string, path: string }>,
  loadSavedDatabase: (databasePath: string, databaseNickname: string) => void,
  deleteSavedDatabase: (savedDatabase: {
    nickname: string,
    path: string
  }) => void
};

export default function SavedDatabases(props: Props) {
  const databaseList = props.savedDatabases.map(e => (
    <div
      style={{
        marginBottom: '5px',
        cursor: 'pointer',
        backgroundColor: '#e6e6e6'
      }}
      key={e.path}
      onClick={() => props.loadSavedDatabase(e.path, e.nickname)}
    >
      <strong>Name:</strong> {e.nickname}
      <br />
      <strong>Path:</strong>
      {e.path}
      <br />
      <Icon
        type="close-circle"
        onClick={event => {
          event.stopPropagation();
          props.deleteSavedDatabase(e);
        }}
      />
    </div>
  ));
  return <div style={{ backgroundColor: '#cccccc' }}>{databaseList}</div>;
}

// @flow
import os from 'os';
import path from 'path';
import { SET_DATABASE_PATH } from '../actions/index';

// @HACK: HARDCODE
const tempDbPath = path.join(
  os.homedir(),
  'Documents/Projects/falcon-ui-rewrite-2/test/e2e/temp.sqlite'
);

// @TODO: default is this database path because hot-loader does not save state.databasePath. Fix later
export default function DatabasePathReducer(
  state: string = tempDbPath,
  action
) {
  switch (action.type) {
    case SET_DATABASE_PATH:
      return action.payload;
    default:
      return state; // If action.type is irrelevant, return the original state
  }
}

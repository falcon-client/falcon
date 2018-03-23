// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import counter from './counter';
import DatabasePathReducer from './reducer_DatabasePath';

const rootReducer = combineReducers({
  counter,
  router,
  databasePath: DatabasePathReducer
});

export default rootReducer;

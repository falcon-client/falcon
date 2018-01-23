// @flow

import { SET_DATABASE_PATH } from '../actions/index';

export default function DatabasePathReducer(state: ?string = null, action) {
  switch (action.type) {
    case SET_DATABASE_PATH:
      return action.payload;
    default:
      return state; // If action.type is irrelevant, return the original state
  }
}

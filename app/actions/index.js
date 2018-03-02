// @flow

export const SET_DATABASE_PATH = 'SET_DATABASE_PATH';

// TODO: change to to accomodate all countries
export function setDatabasePath(path: string) {
  return {
    type: SET_DATABASE_PATH,
    payload: path
  };
}

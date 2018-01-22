// @flow
import fs from 'fs';
import Store from 'electron-store';
import _ from 'lodash';
import { verifySqlite } from './Database';
import type { LoginSavedDatabaseType } from '../types/LoginSavedDatabaseType';

/**
 * Handles saving/loading of connections to electron-store.
 * Verifies nicknames, paths, and validity of file
 */
export default class Connections {
  store = new Store();

  /**
   * @return  saved databases local to the machine. If no such array exists,
   * returns an empty array
   */
  getSavedDatabases = (): Array<LoginSavedDatabaseType> =>
    this.store.get('savedDatabases') || [];

  /**
   * Saves the database to local storage. Throws an error if nickname is empty
   * or if no database is found
   * @return an array containing the new database
   */
  saveDatabase = async (
    databaseNickname: string,
    databasePath: string
  ): Promise<Array<LoginSavedDatabaseType>> => {
    const newDatabase = {
      nickname: databaseNickname,
      path: databasePath
    };
    const savedDatabases = this.store.get('savedDatabases') || [];
    if (await this.validateSave(newDatabase)) {
      savedDatabases.push(newDatabase);
      this.store.set('savedDatabases', savedDatabases);
      return savedDatabases;
    }
    throw new Error('Saved databases need a nickname and a valid database');
  };

  /**
   * Validates a potentialDatabase. Database file must exist,
   * @return true if potentialDatabase valid, false if not
   */
  validateSave = async (
    potentialDatabase: LoginSavedDatabaseType
  ): Promise<boolean> => {
    const savedDatabases = this.store.get('savedDatabases') || [];
    const { nickname, path } = potentialDatabase;
    const databaseFileExists = await Connections.validateDatabaseFilePath(path);
    return (
      databaseFileExists &&
      nickname !== '' &&
      Connections.isDatabaseSaved(savedDatabases, potentialDatabase)
    );
  };

  /**
   * Deletes a savedDatabase from local storage
   * @return an array that does not contain that database
   */
  deleteSavedDatabase = (savedDatabase: LoginSavedDatabaseType): Array<LoginSavedDatabaseType> => {
    const savedDatabases = _.cloneDeep(this.store.get('savedDatabases')).filter(e => _.isEqual(e, savedDatabase));
    this.store.set('savedDatabases', savedDatabases);
    return savedDatabases;
  };

  /**
   * Validates a database file's path
   * @return true if databasefile exists and is .db, .sqlite, or sqlite3
   */
  static validateDatabaseFilePath(databasePath: string): Promise<boolean> {
    const fileExtension = databasePath.substring(databasePath.lastIndexOf('.'));
    return new Promise((resolve, reject) => {
      fs.stat(databasePath, (err, stats) => {
        if (typeof stats === 'undefined') {
          resolve(false);
          return;
        }
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(false);
            return;
          }
          reject(err);
          return;
        }
        if (
          stats.isFile() &&
          (fileExtension === '.db' ||
            fileExtension === '.sqlite' ||
            fileExtension === '.sqlite3')
        ) {
          resolve(true);
        }
      });
    });
  }

  /**
   * Checks if a given database file has a problem
   * @return true if no problem exists, the error if there is a problem
   */
  static async validateConnection(databasePath: string): Promise<string | true> {
    return verifySqlite(databasePath);
  }

  /**
   * Checks if a database is saved in savedDatabases
   * @return true if saved, false if not
   */
  static isDatabaseSaved(
    savedDatabases: Array<LoginSavedDatabaseType>,
    database: LoginSavedDatabaseType
  ): boolean {
    return savedDatabases.some(e => _.isEqual(e, database));
  }
}

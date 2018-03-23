// @flow
// Manage saved items to databases. Encrypts passwords
import type { errorObject } from './ManagerInterface';
import type { databasesType } from '../database/provider_clients/ProviderInterface';

type itemType = {
  id: string,
  type: databasesType,
  meta?: any,
  [prop: string]: string
};

export type itemValidationType = {
  errorMessages: Array<{
    fieldName: string,
    message: string
  }>,
  passed: boolean,
  data?: {
    [prop: string]: any
  }
};

// We can't import electron in jest so electron-store won't work.
// We need to use 'conf' as a drop-in replacement for electron-store
// in the testing environment
const FinalStore =
  process.env.NODE_ENV === 'test'
    ? require('conf') // eslint-disable-line
    : require('electron-store');

/**
 * This class is a general manager for falcon database items.
 * It can be extended to fit the needs of specific databases. For
 * example, if a specific database requires encryption, the .get()
 * method can be modified
 */
export default class BaseManager {
  itemType: 'connections' | 'queries';
  /**
   * private
   */
  store = new FinalStore({
    defaults: {
      connections: [],
      queries: []
    }
  });

  /**
   * private
   * abstract
   */
  validateBeforeCreation(item: itemType) {}

  async add(item: itemType): Promise<itemValidationType> {
    const rndm = await import('rndm');
    const itemWithDefaults = {
      id: `conn-${rndm(16)}`,
      color: 'gray',
      ...item
    };

    await this.validateBeforeCreation(item);

    const items = await this.getAll();
    items.push(itemWithDefaults);
    this.store.set(this.itemType, items);

    return {
      errorMessages: [],
      passed: true,
      data: {
        item: itemWithDefaults
      }
    };
  }

  /**
   * Remove a item by it's id
   */
  async remove(itemId: string) {
    const items = await this.getAll();
    const filtereditems = items.filter(item => item.id !== itemId);
    this.store.set(this.itemType, filtereditems);
  }

  async removeAll() {
    await this.store.set(this.itemType, []);
  }

  /**
   * Update a item by giving a new config
   */
  async update(itemId: string, item: itemType): Promise<itemValidationType> {
    const items = await this.getAll();
    const itemToUpdateIndex = items.findIndex(itm => itm.id === itemId);

    try {
      await this.validateBeforeCreation(item);
    } catch (error) {
      return error.errors;
    }

    switch (itemToUpdateIndex) {
      case -1: {
        throw new Error(`item with id "${itemId}" not found`);
      }
      default: {
        items[itemToUpdateIndex] = item;
      }
    }

    this.store.set(this.itemType, items);

    return {
      errorMessages: [],
      passed: true,
      data: {
        item
      }
    };
  }

  async getAll(): Promise<Array<itemType>> {
    return this.store.get(this.itemType);
  }

  async get(itemId: string): Promise<itemType> {
    const items = await this.getAll();
    const itemIndex = items.findIndex(conn => conn.id === itemId);

    switch (itemIndex) {
      case -1: {
        throw new Error(
          `Item type "${this.itemType}" with id "${itemId}" not found`
        );
      }
      default: {
        return items[itemIndex];
      }
    }
  }
}

type dataType = {
  [prop: string]: any,
  errors: Array<errorObject>
};

export class FalconError extends Error {
  data: dataType;

  constructor(
    message: string = 'Validation failed',
    data: dataType = { errors: [] }
  ) {
    super(message);
    this.data = data;
  }
}

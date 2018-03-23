// @flow
import BaseManager, { FalconError } from './BaseManager';
import Joi from 'joi';
import type { ManagerInterface } from './ManagerInterface';
import type { databasesType } from '../database/provider_clients/ProviderInterface';

export type queryType = {
  // The internal id for the query
  id: string,
  // The name of the query
  name: string,
  // The type of database which the query was created for
  type: databasesType,
  // The connection which the query belongs to
  connectionId: string,
  // The query's text
  query: string,
  // The optional color highlighting of the query
  color?: string
};

function validateQuery(query: queryType) {
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().required(),
    query: Joi.string().required(),
    color: Joi.string()
  });

  const errors = Joi.validate(query, schema, {
    abortEarly: false
  });

  if (errors.error) {
    if (errors.error.details.length > 0) {
      const errorsMessages = errors.error.details.map(detail => ({
        message: detail.message,
        fieldName: detail.context.label
      }));

      throw new FalconError(
        `Failed validation: ${JSON.stringify(errorsMessages)}`,
        { errors }
      );
    }
  }
}

export default class QueryManager<T> extends BaseManager
  implements ManagerInterface<T> {
  itemType = 'queries';

  validateBeforeCreation(query: queryType) {
    switch (query.type) {
      case 'sqlite': {
        validateQuery(query);
        break;
      }
      default: {
        throw new Error(
          `Unknown database type "${
            this.itemType
          }". This probably means it is not supported`
        );
      }
    }
  }
}

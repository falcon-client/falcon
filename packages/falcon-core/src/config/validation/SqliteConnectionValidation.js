// @flow
import isFilePath from 'is-valid-path';
import Joi from 'joi';
import fs from 'fs';
import Database from 'better-sqlite3';
import { FalconError } from '../BaseManager';
import type {
  connectionValidationType,
  connectionType
} from '../ConnectionManager';

export default function SqliteConnectionValidation(
  connection: connectionType
): Promise<connectionValidationType> {
  const customJoi = Joi.extend(joi => ({
    base: joi.string(),
    name: 'string',
    language: {
      file: 'needs to be a file',
      file_exists: 'does not exist',
      sqlite_valid: 'is not valid'
    },
    rules: [
      {
        name: 'file',
        validate(params, value, state, options) {
          return !isFilePath(value)
            ? this.createError(
                'string.file',
                { v: value, q: params.q },
                state,
                options
              )
            : value;
        }
      },
      {
        name: 'file_exists',
        validate(params, value, state, options) {
          return fs.existsSync(value)
            ? value
            : this.createError(
                'string.file_exists',
                { v: value, q: params.q },
                state,
                options
              );
        }
      },
      {
        name: 'sqlite_valid',
        validate(params, value, state, options) {
          let db;
          let passed = true;
          try {
            db = new Database(value, {
              readonly: true,
              fileMustExist: true
            });
            if (db.pragma('quick_check', true) !== 'ok') {
              passed = false;
            }
          } catch (e) {
            passed = false;
          } finally {
            if (db) {
              db.close();
            }
          }

          return passed
            ? value
            : this.createError(
                'string.sqlite_valid',
                {
                  v: value,
                  q: params.q
                },
                state,
                options
              );
        }
      }
    ]
  }));

  const schema = customJoi.object().keys({
    id: customJoi.string().required(),
    name: customJoi.string().required(),
    color: customJoi.string(),
    database: customJoi
      .string()
      .file()
      .file_exists()
      .sqlite_valid()
      .required(),
    type: customJoi.string().required()
  });

  const errors = customJoi.validate(connection, schema, {
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

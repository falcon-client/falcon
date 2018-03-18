import _ from 'lodash';

import { createSelector } from 'reselect';
import { stringifyWrappers } from '../introspection/';
import { getTypeGraphSelector } from './type-graph';

import template from './dot_template.ejs';

function getDot(typeGraph): string {
  if (typeGraph === null) return null;
  return template({ _, typeGraph, stringifyWrappers });
}

export const getDotSelector = createSelector(getTypeGraphSelector, getDot);

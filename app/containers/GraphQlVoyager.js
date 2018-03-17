/* eslint-disable */
import _ from 'lodash';
import { createSelector } from 'reselect';
import { buildClientSchema } from 'graphql';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import React from 'react';
import { connect, Provider } from 'react-redux';
import { Snackbar } from 'react-toolbox/lib/snackbar';
import classNames from 'classnames';
import { Button, IconButton } from 'react-toolbox/lib/button';
import path from 'path';
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom';
import animate from '@f/animate';
import { HtmlRenderer, Parser } from 'commonmark';
import Tooltip from 'react-toolbox/lib/tooltip';
import Dropdown from 'react-toolbox/lib/dropdown';
import Checkbox from 'react-toolbox/lib/checkbox';
import ReactModal from 'react-modal';
import ClipboardButton from 'react-clipboard.js';
import { introspectionQuery } from 'graphql/utilities';
import { GraphQLClient } from 'graphql-request';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

const SHOW_SCHEMA_MODAL = 'SHOW_SCHEMA_MODAL';
const HIDE_SCHEMA_MODAL = 'HIDE_SCHEMA_MODAL';
function showSchemaModal() {
    return {
        type: SHOW_SCHEMA_MODAL,
    };
}
function hideSchemaModal() {
    return {
        type: HIDE_SCHEMA_MODAL,
    };
}
const CHANGE_NOT_APPLIED_ACTIVE_PRESET = 'CHANGE_NOT_APPLIED_ACTIVE_PRESET';
const CHANGE_NOT_APPLIED_DISPLAY_OPTIONS = 'CHANGE_NOT_APPLIED_DISPLAY_OPTIONS';
const CHANGE_ACTIVE_PRESET = 'CHANGE_ACTIVE_PRESET';
function changeNaActivePreset(value, schema) {
    return {
        type: CHANGE_NOT_APPLIED_ACTIVE_PRESET,
        payload: {
            presetName: value,
            schema,
        },
    };
}
function changeNaDisplayOptions(options) {
    return {
        type: CHANGE_NOT_APPLIED_DISPLAY_OPTIONS,
        payload: options,
    };
}
function changeActivePreset(preset) {
    console.log(preset);
    return {
        type: CHANGE_ACTIVE_PRESET,
        payload: preset,
    };
}

const CHANGE_SCHEMA = 'CHANGE_SCHEMA';
function changeSchema(introspection, displayOptions) {
    return {
        type: CHANGE_SCHEMA,
        payload: {
            introspection,
            displayOptions,
        },
    };
}

const SVG_RENDERING_FINISHED = 'SVG_RENDERING_FINISHED';
function svgRenderingFinished(svgString) {
    return {
        type: SVG_RENDERING_FINISHED,
        payload: svgString,
    };
}

const CHANGE_DISPLAY_OPTIONS = 'CHANGE_DISPLAY_OPTIONS';
function changeDisplayOptions(options) {
    return {
        type: CHANGE_DISPLAY_OPTIONS,
        payload: options,
    };
}
const TOGGLE_MENU = 'TOGGLE_MENU';
const REPORT_ERROR = 'REPORT_ERROR';
function reportError(msg) {
    return {
        type: REPORT_ERROR,
        payload: msg,
    };
}
const CLEAR_ERROR = 'CLEAR_ERROR';
function clearError() {
    return {
        type: CLEAR_ERROR,
    };
}
const CHANGE_SELECTED_TYPEINFO = 'CHANGE_SELECTED_TYPEINFO';
function changeSelectedTypeInfo(type) {
    return {
        type: CHANGE_SELECTED_TYPEINFO,
        payload: type,
    };
}

const SELECT_NODE = 'SELECT_NODE';
function selectNode(id) {
    return {
        type: SELECT_NODE,
        payload: id,
    };
}
const SELECT_EDGE = 'SELECT_EDGE';
function selectEdge(id) {
    return {
        type: SELECT_EDGE,
        payload: id,
    };
}
const SELECT_PREVIOUS_TYPE = 'SELECT_PREVIOUS_TYPE';
function selectPreviousType() {
    return {
        type: SELECT_PREVIOUS_TYPE,
    };
}
const CLEAR_SELECTION = 'CLEAR_SELECTION';
function clearSelection() {
    return {
        type: CLEAR_SELECTION,
    };
}
const FOCUS_ELEMENT = 'FOCUS_ELEMENT';
function focusElement(id) {
    return {
        type: FOCUS_ELEMENT,
        payload: id,
    };
}
const FOCUS_ELEMENT_DONE = 'FOCUS_ELEMENT_DONE';
function focusElementDone(id) {
    return {
        type: FOCUS_ELEMENT_DONE,
        payload: id,
    };
}

function stringifyWrappers(wrappers) {
    return _.reduce(wrappers.reverse(), ([left, right], wrapper) => {
        switch (wrapper) {
            case 'NON_NULL':
                return [left, right + '!'];
            case 'LIST':
                return ['[' + left, right + ']'];
        }
    }, ['', '']);
}
function buildId(...parts) {
    return parts.join('::');
}
function typeNameToId(name) {
    return buildId('TYPE', name);
}
function extractTypeId(id) {
    let [, type] = id.split('::');
    return buildId('TYPE', type);
}
function isSystemType(type) {
    return _.startsWith(type.name, '__');
}
function isBuiltInScalarType(type) {
    return ['Int', 'Float', 'String', 'Boolean', 'ID'].indexOf(type.name) !== -1;
}
function isScalarType(type) {
    return type.kind === 'SCALAR' || type.kind === 'ENUM';
}
function isInputObjectType(type) {
    return type.kind === 'INPUT_OBJECT';
}

function unwrapType(type, wrappers) {
    while (type.kind === 'NON_NULL' || type.kind == 'LIST') {
        wrappers.push(type.kind);
        type = type.ofType;
    }
    return type.name;
}
function convertArg(inArg) {
    var outArg = {
        name: inArg.name,
        description: inArg.description,
        defaultValue: inArg.defaultValue,
        typeWrappers: [],
    };
    outArg.type = unwrapType(inArg.type, outArg.typeWrappers);
    return outArg;
}
let convertInputField = convertArg;
function convertField(inField) {
    var outField = {
        name: inField.name,
        description: inField.description,
        typeWrappers: [],
        isDeprecated: inField.isDeprecated,
    };
    outField.type = unwrapType(inField.type, outField.typeWrappers);
    outField.args = _(inField.args)
        .map(convertArg)
        .keyBy('name')
        .value();
    if (outField.isDeprecated)
        outField.deprecationReason = inField.deprecationReason;
    return outField;
}
function convertType(inType) {
    const outType = {
        kind: inType.kind,
        name: inType.name,
        description: inType.description,
    };
    switch (inType.kind) {
        case 'OBJECT':
            outType.interfaces = _(inType.interfaces)
                .map('name')
                .uniq()
                .value();
            outType.fields = _(inType.fields)
                .map(convertField)
                .keyBy('name')
                .value();
            break;
        case 'INTERFACE':
            outType.derivedTypes = _(inType.possibleTypes)
                .map('name')
                .uniq()
                .value();
            outType.fields = _(inType.fields)
                .map(convertField)
                .keyBy('name')
                .value();
            break;
        case 'UNION':
            outType.possibleTypes = _(inType.possibleTypes)
                .map('name')
                .uniq()
                .value();
            break;
        case 'ENUM':
            outType.enumValues = inType.enumValues;
            break;
        case 'INPUT_OBJECT':
            outType.inputFields = _(inType.inputFields)
                .map(convertInputField)
                .keyBy('name')
                .value();
            break;
    }
    return outType;
}
function simplifySchema(inSchema) {
    return {
        types: _(inSchema.types)
            .map(convertType)
            .keyBy('name')
            .value(),
        queryType: inSchema.queryType.name,
        mutationType: _.get(inSchema, 'mutationType.name', null),
        subscriptionType: _.get(inSchema, 'subscriptionType.name', null),
    };
}
function markRelayTypes(schema) {
    const nodeType = schema.types[typeNameToId('Node')];
    if (nodeType)
        nodeType.isRelayType = true;
    const pageInfoType = schema.types[typeNameToId('PageInfo')];
    if (pageInfoType)
        pageInfoType.isRelayType = true;
    const edgeTypesMap = {};
    _.each(schema.types, type => {
        if (!_.isEmpty(type.interfaces)) {
            type.interfaces = _.reject(type.interfaces, baseType => baseType.type.name === 'Node');
            if (_.isEmpty(type.interfaces))
                delete type.interfaces;
        }
        _.each(type.fields, field => {
            if (!/.Connection$/.test(field.type.name))
                return;
            //FIXME: additional checks
            const relayConnetion = field.type;
            if (!relayConnetion.fields.edges)
                return;
            relayConnetion.isRelayType = true;
            const relayEdge = relayConnetion.fields['edges'].type;
            relayEdge.isRelayType = true;
            const realType = relayEdge.fields['node'].type;
            edgeTypesMap[relayEdge.name] = realType;
            field.relayType = field.type;
            field.type = realType;
            field.typeWrappers = ['LIST'];
            const relayArgNames = ['first', 'last', 'before', 'after'];
            const isRelayArg = arg => relayArgNames.includes(arg.name);
            field.relayArgs = _.pickBy(field.args, isRelayArg);
            field.args = _.omitBy(field.args, isRelayArg);
        });
    });
    _.each(schema.types, type => {
        _.each(type.fields, field => {
            var realType = edgeTypesMap[field.type.name];
            if (realType === undefined)
                return;
            field.relayType = field.type;
            field.type = realType;
        });
    });
    const { queryType } = schema;
    let query = schema.types[queryType.id];
    if (_.get(query, 'fields.node.type.isRelayType')) {
        delete query.fields['node'];
    }
    //GitHub use `nodes` instead of `node`.
    if (_.get(query, 'fields.nodes.type.isRelayType')) {
        delete query.fields['nodes'];
    }
    if (_.get(query, 'fields.relay.type') === queryType) {
        delete query.fields['relay'];
    }
}
function sortIntrospection(value) {
    if (Array.isArray(value)) {
        if (typeof value[0] === 'string') {
            return value.sort();
        }
        else {
            return value.map(sortIntrospection);
        }
    }
    else if (typeof value === 'object' && value !== null) {
        var sortedObj = Object.create(null);
        for (const key of Object.keys(value).sort()) {
            sortedObj[key] = sortIntrospection(value[key]);
        }
        return sortedObj;
    }
    else {
        return value;
    }
}
function assignTypesAndIDs(schema) {
    schema.queryType = schema.types[schema.queryType];
    schema.mutationType = schema.types[schema.mutationType];
    schema.subscriptionType = schema.types[schema.subscriptionType];
    _.each(schema.types, (type) => {
        type.id = typeNameToId(type.name);
        _.each(type.inputFields, (field) => {
            field.id = `FIELD::${type.name}::${field.name}`;
            field.type = schema.types[field.type];
        });
        _.each(type.fields, (field) => {
            field.id = `FIELD::${type.name}::${field.name}`;
            field.type = schema.types[field.type];
            _.each(field.args, (arg) => {
                arg.id = `ARGUMENT::${type.name}::${field.name}::${arg.name}`;
                arg.type = schema.types[arg.type];
            });
        });
        if (!_.isEmpty(type.possibleTypes)) {
            type.possibleTypes = _.map(type.possibleTypes, (possibleType) => ({
                id: `POSSIBLE_TYPE::${type.name}::${possibleType}`,
                type: schema.types[possibleType],
            }));
        }
        if (!_.isEmpty(type.derivedTypes)) {
            type.derivedTypes = _.map(type.derivedTypes, (derivedType) => ({
                id: `DERIVED_TYPE::${type.name}::${derivedType}`,
                type: schema.types[derivedType],
            }));
        }
        if (!_.isEmpty(type.interfaces)) {
            type.interfaces = _.map(type.interfaces, (baseType) => ({
                id: `INTERFACE::${type.name}::${baseType}`,
                type: schema.types[baseType],
            }));
        }
    });
    schema.types = _.keyBy(schema.types, 'id');
}
function getSchema(introspection, sortByAlphabet, skipRelay) {
    if (!introspection)
        return null;
    //TODO: Check introspection result for errors
    var schema = simplifySchema(introspection.data.__schema);
    if (sortByAlphabet)
        schema = sortIntrospection(schema);
    assignTypesAndIDs(schema);
    if (skipRelay) {
        markRelayTypes(schema);
    }
    return schema;
}
const getSchemaSelector = createSelector((state) => state.schema, (state) => state.displayOptions.sortByAlphabet, (state) => state.displayOptions.skipRelay, getSchema);
const getNaSchemaSelector = createSelector((state) => {
    if (state.schemaModal.notApplied === null)
        return null;
    const presetValue = state.schemaModal.notApplied.presetValue;
    return presetValue;
}, (state) => _.get(state, 'schemaModal.notApplied.displayOptions.sortByAlphabet'), (state) => _.get(state, 'schemaModal.notApplied.displayOptions.skipRelay'), (introspection, sortByAlphabet, skipRelay) => {
    if (introspection == null)
        return { schema: null, error: null };
    try {
        if (typeof introspection === 'string') {
            introspection = JSON.parse(introspection);
        }
        //Used only to validate introspection so result is ignored
        buildClientSchema(introspection.data);
        const schema = getSchema(introspection, sortByAlphabet, skipRelay);
        return { schema, error: null };
    }
    catch (e) {
        console.error(e);
        return { error: e.toString(), schema: null };
    }
});

const initialState = {
    schema: null,
    schemaModal: {
        opened: false,
        activePreset: null,
        notApplied: null,
    },
    displayOptions: {
        rootTypeId: undefined,
        skipRelay: true,
        sortByAlphabet: false,
        hideRoot: false,
    },
    currentSvgIndex: null,
    svgCache: [],
    selected: {
        previousTypesIds: [],
        currentNodeId: null,
        currentEdgeId: null,
        scalar: null,
    },
    graphView: {
        focusedId: null,
    },
    menuOpened: false,
    errorMessage: null,
};
function pushHistory(currentTypeId, previousState) {
    let previousTypesIds = previousState.selected.previousTypesIds;
    let previousTypeId = previousState.selected.currentNodeId;
    if (previousTypeId === null || previousTypeId === currentTypeId)
        return previousTypesIds;
    if (_.last(previousTypesIds) !== previousTypeId)
        return [...previousTypesIds, previousTypeId];
}
function rootReducer(previousState = initialState, action) {
    const { type } = action;
    switch (type) {
        case CHANGE_SCHEMA:
            return {
                ...previousState,
                schema: action.payload.introspection,
                displayOptions: _.defaults(action.payload.displayOptions, initialState.displayOptions),
                svgCache: [],
                currentSvgIndex: null,
                graphView: initialState.graphView,
                selected: initialState.selected,
            };
        case CHANGE_DISPLAY_OPTIONS:
            let displayOptions = {
                ...previousState.displayOptions,
                ...action.payload,
            };
            let cacheIdx = _.findIndex(previousState.svgCache, cacheItem => {
                return _.isEqual(cacheItem.displayOptions, displayOptions);
            });
            return {
                ...previousState,
                displayOptions,
                currentSvgIndex: cacheIdx >= 0 ? cacheIdx : null,
                graphView: initialState.graphView,
                selected: initialState.selected,
            };
        case SVG_RENDERING_FINISHED:
            return {
                ...previousState,
                svgCache: previousState.svgCache.concat([
                    {
                        displayOptions: previousState.displayOptions,
                        svg: action.payload,
                    },
                ]),
                currentSvgIndex: previousState.svgCache.length,
            };
        case SELECT_NODE:
            const currentNodeId = action.payload;
            if (currentNodeId === previousState.selected.currentNodeId)
                return previousState;
            return {
                ...previousState,
                selected: {
                    ...previousState.selected,
                    previousTypesIds: pushHistory(currentNodeId, previousState),
                    currentNodeId,
                    currentEdgeId: null,
                    scalar: null,
                },
            };
        case SELECT_EDGE:
            let currentEdgeId = action.payload;
            // deselect if click again
            if (currentEdgeId === previousState.selected.currentEdgeId) {
                return {
                    ...previousState,
                    selected: {
                        ...previousState.selected,
                        currentEdgeId: null,
                        scalar: null,
                    },
                };
            }
            let nodeId = extractTypeId(currentEdgeId);
            return {
                ...previousState,
                selected: {
                    ...previousState.selected,
                    previousTypesIds: pushHistory(nodeId, previousState),
                    currentNodeId: nodeId,
                    currentEdgeId,
                    scalar: null,
                },
            };
        case SELECT_PREVIOUS_TYPE:
            return {
                ...previousState,
                selected: {
                    ...previousState.selected,
                    previousTypesIds: _.initial(previousState.selected.previousTypesIds),
                    currentNodeId: _.last(previousState.selected.previousTypesIds),
                    currentEdgeId: null,
                    scalar: null,
                },
            };
        case CLEAR_SELECTION:
            return {
                ...previousState,
                selected: initialState.selected,
            };
        case FOCUS_ELEMENT:
            return {
                ...previousState,
                graphView: {
                    ...previousState.graphView,
                    focusedId: action.payload,
                },
            };
        case FOCUS_ELEMENT_DONE:
            if (previousState.graphView.focusedId !== action.payload)
                return previousState;
            return {
                ...previousState,
                graphView: {
                    ...previousState.graphView,
                    focusedId: null,
                },
            };
        case SHOW_SCHEMA_MODAL:
            const presetValue = previousState.schema;
            return {
                ...previousState,
                schemaModal: {
                    ...previousState.schemaModal,
                    opened: true,
                    notApplied: {
                        //schema: schema,
                        activePreset: previousState.schemaModal.activePreset,
                        displayOptions: previousState.displayOptions,
                        presetValue,
                    },
                },
                errorMessage: initialState.errorMessage,
            };
        case CHANGE_ACTIVE_PRESET:
            return {
                ...previousState,
                schemaModal: {
                    ...previousState.schemaModal,
                    activePreset: action.payload,
                },
            };
        case CHANGE_NOT_APPLIED_ACTIVE_PRESET:
            const naActivePreset = action.payload.presetName;
            const naSchema = action.payload.schema;
            return {
                ...previousState,
                schemaModal: {
                    ...previousState.schemaModal,
                    notApplied: {
                        ...previousState.schemaModal.notApplied,
                        presetValue: naSchema,
                        activePreset: naActivePreset,
                        displayOptions: initialState.displayOptions,
                    },
                },
                errorMessage: initialState.errorMessage,
            };
        case CHANGE_NOT_APPLIED_DISPLAY_OPTIONS:
            return {
                ...previousState,
                schemaModal: {
                    ...previousState.schemaModal,
                    notApplied: {
                        ...previousState.schemaModal.notApplied,
                        displayOptions: action.payload,
                    },
                },
            };
        case HIDE_SCHEMA_MODAL:
            return {
                ...previousState,
                schemaModal: {
                    ...previousState.schemaModal,
                    opened: false,
                    notApplied: null,
                },
            };
        case TOGGLE_MENU:
            return {
                ...previousState,
                menuOpened: !previousState.menuOpened,
            };
        case REPORT_ERROR:
            return {
                ...previousState,
                errorMessage: action.payload,
            };
        case CLEAR_ERROR:
            return {
                ...previousState,
                errorMessage: initialState.errorMessage,
            };
        case CHANGE_SELECTED_TYPEINFO:
            return {
                ...previousState,
                selected: {
                    ...previousState.selected,
                    typeinfo: action.payload,
                },
            };
        default:
            return previousState;
    }
}

function configureStore(preloadedState) {
    let composeEnhancers;
    {
        composeEnhancers = compose;
    }
    return createStore(rootReducer, preloadedState, composeEnhancers(applyMiddleware(thunk)));
}
// Initial version was copy-pasted from
// https://github.com/reactjs/redux/issues/303#issuecomment-125184409
function observeStore(store, ...args) {
    let onChange = args.pop();
    let selectors = args;
    let currentState;
    function handleChange() {
        const nextState = _.map(selectors, f => f(store.getState()));
        const stateChanged = _(nextState)
            .zip(currentState)
            .some(([x, y]) => x !== y);
        if (stateChanged) {
            currentState = nextState;
            onChange(...currentState);
        }
    }
    let unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
}

function mapStateToProps(state) {
    return {
        errorMessage: state.errorMessage,
    };
}
class ErrorBar extends React.PureComponent {
    render() {
        const { errorMessage, dispatch } = this.props;
        if (!errorMessage)
            return null;
        return (React.createElement(Snackbar, { className: "error-bar", action: "Dismiss", active: errorMessage !== null, label: errorMessage, timeout: 2000, onClick: () => dispatch(clearError()), type: "warning" }));
    }
}
var ErrorBar$1 = connect(mapStateToProps)(ErrorBar);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }
var VoyagerIcon = ((_ref) => {
  let {
    styles = {}
  } = _ref,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement(
    "svg",
    _extends({ xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 490.8 438.1" }, props),
    React.createElement("path", { d: "M334.2 285c-2.3-2.3-6.1-2.3-8.5 0l-6.5 6.5-10.1-10.1 2.9-2.9c4.7-4.7 4.7-12.3 0-17l-2.6-2.6c.2-.6.4-1.3.4-2.1V217c22.9 15.1 46.9 23.5 67.7 23.5 4.8 0 9.5-.5 13.9-1.4 4.3-.9 7.8-4.1 9.1-8.3 1.3-4.2.1-8.8-3-11.9l-53.1-53.1v-24.3c1.2.2 2.5.4 3.7.4 5.1 0 9.9-2 13.5-5.6 7.5-7.5 7.5-19.6 0-27.1-3.6-3.6-8.4-5.6-13.5-5.6s-9.9 2-13.5 5.6c-3.6 3.6-5.6 8.4-5.6 13.5 0 1.3.1 2.5.4 3.7h-24.3L252 73.3c-2.3-2.3-5.3-3.5-8.5-3.5-1.1 0-2.3.2-3.4.5-4.2 1.3-7.4 4.7-8.3 9.1-4.9 23.5 3.4 53.2 22.2 81.6h-39.8c-.5 0-1 .1-1.5.2 3.3-5.3 2.7-12.4-1.9-17-1.9-1.9-4.2-3.1-6.7-3.7L177.6 30c.4-.3.8-.7 1.2-1.1 5.5-5.5 5.5-14.5 0-20s-14.5-5.5-20 0-5.5 14.5 0 20c2 2 4.5 3.3 7.1 3.8l26.2 110.6c-.3.3-.7.6-1 .9-5.3 5.3-5.3 14 0 19.3.3.3.7.6 1 .9L159.8 197c-.3-.4-.6-.7-.9-1-5.3-5.3-14-5.3-19.3 0-.3.3-.6.7-.9 1L28 170.7c-.6-2.7-1.9-5.1-3.8-7.1-5.5-5.5-14.5-5.5-20 0-2.7 2.7-4.1 6.2-4.1 10s1.5 7.3 4.1 10c2.8 2.8 6.4 4.1 10 4.1 3.6 0 7.2-1.4 10-4.1.4-.4.7-.8 1.1-1.2L136 208.6c.5 2.4 1.8 4.8 3.7 6.7 2.7 2.7 6.2 4 9.7 4 2.1 0 4.2-.5 6.1-1.5l.3.3 99.9 99.9c2.3 2.3 5.3 3.5 8.5 3.5s6.2-1.3 8.5-3.5l3.4-3.4 10.1 10.1-7.4 7.4c-2.3 2.3-2.3 6.1 0 8.5l95.7 95.7c.3.3.6.5.9.8h.1c.3.2.6.4 1 .5h.1c.3.1.7.2 1 .3h.1c.4.1.7.1 1.1.1s.7 0 1.1-.1h.1c.4-.1.7-.2 1-.3h.1c.3-.1.7-.3 1-.5h.1c.7-.4 1.2-1 1.7-1.7v-.1c.2-.3.4-.6.5-1v-.1c.1-.3.2-.7.3-1v-.1c.1-.4.1-.7.1-1.1v-40.9h40.9c1.7 0 3.3-.7 4.4-1.9 0 0 .1 0 .1-.1 2.3-2.3 2.3-6.1 0-8.5l-96-95.6zm38.3 94.2h-34.9v-34.9h34.9v34.9zM325.7 302v30.3h-30.3l30.3-30.3zm0 42.3v26.4l-26.4-26.4h26.4zm12-12v-26.9l26.9 26.9h-26.9zm-69.3-114.4h29.3v29.3l-29.3-29.3zm-3.5-42L295 206h-30.1v-30.1zm63.9-25.5l3.4-3.4v6.8l-3.4-3.4zm14.2-32.7c1.3-1.3 3.1-2.1 5-2.1s3.7.7 5 2.1c2.8 2.8 2.8 7.3 0 10.1-1.3 1.3-3.1 2.1-5 2.1s-3.7-.7-5-2.1-2.1-3.1-2.1-5 .7-3.7 2.1-5.1zm-19.2 20.8l-3.4 3.4-3.4-3.4h6.8zm-80.5-56.6l145.6 145.6c-3.6.7-7.5 1.1-11.5 1.1-21.7 0-48.5-10.8-73.4-30.5l-31.4-31.4c-23.2-29.4-34.1-61.6-29.3-84.8zm9.6 120.5L223.5 173h29.3v29.4zm-88.8 7.2l39.5-39.5 99.9 99.9-5.4 5.4c-.8.3-1.5.7-2.1 1.3-.6.6-1 1.3-1.3 2.1l-21.3 21.3c-.8.3-1.5.7-2.1 1.3-.6.6-1 1.3-1.3 2.1l-6 6-99.9-99.9zm120.3 96.5l16.3-16.3 10.1 10.1-16.3 16.3-10.1-10.1zm88.1 111.5l-26.4-26.4h26.4v26.4zm12-65.3l26.9 26.9h-26.9v-26.9z" }),
    React.createElement("path", { d: "M217.5 198.2c-5.2 0-10.2 1.5-14.5 4.5-11.8 8-14.9 24.1-6.9 35.9 4.8 7.1 12.8 11.4 21.4 11.4 5.2 0 10.2-1.5 14.5-4.5 5.7-3.9 9.6-9.7 10.9-16.5 1.3-6.8-.1-13.7-4-19.4-4.8-7.2-12.8-11.4-21.4-11.4zm7.8 37.3c-2.4 1.6-5.1 2.4-7.8 2.4-4.4 0-8.8-2.1-11.5-6.1-4.3-6.3-2.6-14.9 3.7-19.2 2.4-1.6 5.1-2.4 7.8-2.4 4.4 0 8.8 2.1 11.5 6.1 4.2 6.3 2.6 14.9-3.7 19.2z" }),
    React.createElement("path", { className: styles["voyager-signal1"] || "voyager-signal1", d: "M369.5 101.3c5.1 5.1 10.3 9.4 14.6 12.2 2.6 1.7 5.9 3.6 8.9 3.6 1.4 0 2.6-.4 3.7-1.4 5.8-5.8-8.1-20.9-14.3-27.2-5.1-5.1-10.3-9.4-14.6-12.2-3.8-2.5-9.3-5.4-12.5-2.1-5.9 5.7 8 20.8 14.2 27.1zm7.9-7.9c6.6 6.6 10.6 12 12.4 15.4-3.3-1.9-8.8-5.9-15.4-12.4-6.6-6.6-10.6-12-12.4-15.4 3.4 1.8 8.8 5.8 15.4 12.4z" }),
    React.createElement("path", { className: styles["voyager-signal2"] || "voyager-signal2", d: "M390 80.8c4.4 4.4 24.2 23.6 34.7 23.6 1.7 0 3.1-.5 4.2-1.6 8.1-8.1-16.9-33.9-22-39-5.1-5.1-30.9-30.1-39-22-3.1 3.1-2 8.4 3.5 16.8 4.4 6.7 11 14.5 18.6 22.2zm12-12.1c13.9 13.9 20.4 24.6 21.4 28.5-3.9-1.1-14.6-7.5-28.5-21.4-13.9-13.9-20.4-24.6-21.4-28.5 4 1.1 14.6 7.5 28.5 21.4z" }),
    React.createElement("path", { className: styles["voyager-signal3"] || "voyager-signal3", d: "M462.5 67c-6.5-9.2-16.2-20.4-27.3-31.5-11-11-22.2-20.7-31.4-27.2-11.5-8.1-18-10.1-21.5-6.6s-1.5 9.9 6.6 21.5c6.5 9.2 16.2 20.4 27.3 31.5 11.1 11.1 22.3 20.8 31.5 27.3 7.9 5.6 13.4 8.3 17.2 8.3 1.7 0 3.1-.6 4.2-1.7 3.5-3.6 1.6-10-6.6-21.6zm-41.4-17.3C399.4 28 389.3 12.4 387.8 7.2c5.2 1.5 20.8 11.6 42.5 33.3C452 62.2 462 77.8 463.6 83c-5.2-1.6-20.8-11.6-42.5-33.3z" })
  );
});

function mapStateToProps$1(state) {
    return {
        loading: state.currentSvgIndex === null,
    };
}
class LoadingAnimation extends React.Component {
    shouldComponentUpdate(nextProps) {
        return this.props.loading !== nextProps.loading;
    }
    render() {
        const loading = this.props.loading;
        return (React.createElement("div", { className: classNames({
                'loading-box': true,
                visible: loading,
            }) },
            React.createElement("span", { className: "loading-animation" },
                React.createElement(VoyagerIcon, null),
                React.createElement("h1", null, " Transmitting... "))));
    }
}
var LoadingAnimation$1 = connect(mapStateToProps$1)(LoadingAnimation);

var _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties$1(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }
var LogoIcon = ((_ref) => {
  let {
    styles = {}
  } = _ref,
      props = _objectWithoutProperties$1(_ref, ["styles"]);

  return React.createElement(
    "svg",
    _extends$1({ xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 431.7 433.3" }, props),
    React.createElement("path", { d: "M429.9 375.9l-95.7-95.7c-1.1-1.1-2.7-1.8-4.2-1.8-1.6 0-3.1.6-4.2 1.8l-6.5 6.5-10.1-10.1 2.9-2.9c4.7-4.7 4.7-12.3 0-17l-2.6-2.6c.2-.6.4-1.3.4-2.1v-39.8c22.9 15.1 46.9 23.5 67.7 23.5 4.8 0 9.5-.5 13.9-1.4 4.3-.9 7.8-4.1 9.1-8.3 1.3-4.2.1-8.8-3-11.9L344.5 161v-24.3c1.2.2 2.5.4 3.8.4 5.1 0 9.9-2 13.5-5.6 3.6-3.6 5.6-8.4 5.6-13.5s-2-9.9-5.6-13.5c-3.6-3.6-8.4-5.6-13.5-5.6s-9.9 2-13.5 5.6-5.6 8.4-5.6 13.5c0 1.3.1 2.5.4 3.8h-24.3l-53.1-53.1c-2.3-2.3-5.3-3.5-8.5-3.5-1.1 0-2.3.2-3.4.5-4.2 1.3-7.4 4.7-8.3 9.1-4.9 23.5 3.4 53.2 22.2 81.6h-39.8c-.5 0-1 .1-1.5.2 3.3-5.3 2.7-12.4-1.9-17-1.9-1.9-4.2-3.1-6.7-3.7L177.6 25.2c.4-.3.8-.7 1.2-1.1 5.5-5.5 5.5-14.5 0-20s-14.5-5.5-20 0-5.5 14.5 0 20c2 2 4.5 3.3 7.1 3.8l26.2 110.6c-.3.3-.7.6-1 .9-5.3 5.3-5.3 14 0 19.3.3.3.7.6 1 .9L159.7 192c-.3-.4-.6-.7-.9-1-5.3-5.3-14-5.3-19.3 0-.3.3-.6.7-.9 1L28 165.9c-.5-2.6-1.8-5.1-3.8-7.1-5.5-5.5-14.5-5.5-20 0s-5.5 14.5 0 20c2.8 2.8 6.4 4.1 10 4.1s7.2-1.4 10-4.1c.4-.4.7-.8 1.1-1.2L136 203.8c.5 2.4 1.8 4.8 3.7 6.7 2.7 2.7 6.2 4 9.7 4 2.1 0 4.2-.5 6.1-1.5l.3.3 99.9 99.9c2.3 2.3 5.4 3.5 8.5 3.5 3.1 0 6.1-1.2 8.5-3.5l3.4-3.4 10.1 10.1-7.4 7.4c-1.1 1.1-1.8 2.7-1.8 4.2 0 1.6.6 3.1 1.8 4.2l95.7 95.7c.3.3.6.5.9.8h.1c.3.2.6.4 1 .5h.1c.3.1.7.2 1 .3h.1c.4.1.7.1 1.1.1s.7 0 1.1-.1h.1c.4-.1.7-.2 1-.3h.1c.3-.1.7-.3 1-.5h.1c.7-.4 1.2-1 1.7-1.7v-.1c.2-.3.4-.6.5-1v-.1c.1-.3.2-.7.3-1v-.1c.1-.4.1-.7.1-1.1v-40.9h40.9c1.7 0 3.3-.7 4.4-1.9 0 0 .1 0 .1-.1 2.1-2.1 2.1-5.9-.3-8.3zm-57.4-1.5h-34.9v-34.9h34.9v34.9zm-46.9-77.1v30.3h-30.3l30.3-30.3zm0 42.2v26.4l-26.4-26.4h26.4zm12-12v-26.9l26.9 26.9h-26.9zm-69.2-114.3h29.3v29.3l-29.3-29.3zm-3.5-42.1l30.1 30.1h-30.1v-30.1zm63.9-25.4l3.4-3.4v6.8l-3.4-3.4zM343 113c1.3-1.3 3.1-2.1 5-2.1s3.7.7 5 2.1c1.3 1.3 2.1 3.1 2.1 5s-.7 3.7-2.1 5c-1.3 1.3-3.1 2.1-5 2.1s-3.7-.7-5-2.1c-1.3-1.3-2.1-3.1-2.1-5s.7-3.7 2.1-5zm-19.2 20.8l-3.4 3.4-3.4-3.4h6.8zm-80.5-56.7l145.6 145.6c-3.6.7-7.5 1.1-11.5 1.1-21.7 0-48.5-10.8-73.4-30.5l-31.4-31.4c-23.2-29.4-34.1-61.5-29.3-84.8zm9.6 120.5l-29.3-29.3h29.3v29.3zm-88.8 7.3l39.5-39.5 99.9 99.9-5.4 5.4c-.8.3-1.5.7-2.1 1.3-.6.6-1 1.3-1.3 2.1l-21.3 21.3c-.8.3-1.5.7-2.1 1.3-.6.6-1 1.3-1.3 2.1l-6 6-99.9-99.9zm120.3 96.4l16.3-16.3 10.1 10.1-16.3 16.3-10.1-10.1zm88.1 111.5l-26.4-26.4h26.4v26.4zm12-65.3l26.9 26.9h-26.9v-26.9z" }),
    React.createElement("path", { className: styles["st0"] || "st0", d: "M217.5 193.4c-5.2 0-10.2 1.5-14.5 4.5-11.8 8-14.9 24.1-6.9 35.9 4.8 7.1 12.8 11.4 21.4 11.4 5.2 0 10.2-1.5 14.5-4.5 11.8-8 14.9-24.1 6.9-35.9-4.8-7.2-12.8-11.4-21.4-11.4zm7.7 37.3c-2.4 1.6-5.1 2.4-7.8 2.4-4.4 0-8.8-2.1-11.5-6.1-4.3-6.3-2.6-14.9 3.7-19.2 2.4-1.6 5.1-2.4 7.8-2.4 4.4 0 8.8 2.1 11.5 6.1 4.3 6.3 2.7 14.9-3.7 19.2z" })
  );
});

class TitleArea extends React.Component {
    render() {
        const { dispatch, _showChangeButton } = this.props;
        return (React.createElement("div", { className: "title-area" },
            React.createElement("a", { href: "https://github.com/APIs-guru/graphql-voyager" },
                React.createElement("div", { className: "logo" },
                    React.createElement(LogoIcon, null),
                    React.createElement("h2", { className: "title" },
                        React.createElement("strong", null, "GraphQL"),
                        " Voyager"))),
            _showChangeButton && (React.createElement(Button, { className: "choosebutton", raised: true, primary: true, label: "Change Schema", onClick: () => dispatch(showSchemaModal()) }))));
    }
}
var TitleArea$1 = connect()(TitleArea);

function isNode(type) {
    return !(isScalarType(type) || isInputObjectType(type) || isSystemType(type) || type.isRelayType);
}
function getDefaultRoot(schema) {
    return schema.queryType.id;
}
function getTypeGraph(schema, rootTypeId, hideRoot) {
    if (schema === null)
        return null;
    return buildGraph(rootTypeId || getDefaultRoot(schema));
    function getEdgeTargets(type) {
        return _([
            ..._.values(type.fields),
            ...(type.derivedTypes || []),
            ...(type.possibleTypes || []),
        ])
            .map('type')
            .filter(isNode)
            .map('id')
            .value();
    }
    function buildGraph(rootId) {
        var typeIds = [rootId];
        var nodes = [];
        var types = _.keyBy(schema.types, 'id');
        for (var i = 0; i < typeIds.length; ++i) {
            var id = typeIds[i];
            if (typeIds.indexOf(id) < i)
                continue;
            var type = types[id];
            nodes.push(type);
            typeIds.push(...getEdgeTargets(type));
        }
        return {
            rootId,
            nodes: hideRoot ? _.omit(_.keyBy(nodes, 'id'), [rootId]) : _.keyBy(nodes, 'id'),
        };
    }
}
const getTypeGraphSelector = createSelector(getSchemaSelector, state => state.displayOptions.rootTypeId, state => state.displayOptions.hideRoot, getTypeGraph);

function forEachNode(parent, selector, fn) {
    let $nodes = parent.querySelectorAll(selector);
    for (let i = 0; i < $nodes.length; i++) {
        fn($nodes[i]);
    }
}
function removeClass(parent, selector, className) {
    forEachNode(parent, selector, node => node.classList.remove(className));
}
function stringToSvg(svgString) {
    var svgDoc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    return document.importNode(svgDoc.documentElement, true);
}

// similar to node __dirname
var __dirname;
function getQueryParams(query = location.search) {
    if (!query) {
        return {};
    }
    return (/^[?#]/.test(query) ? query.slice(1) : query).split('&').reduce((params, param) => {
        let [key, value] = param.split('=');
        params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
        return params;
    }, {});
}
/*
  get current script URL
*/
function getJsUrl() {
    var id = +new Date() + Math.random();
    try {
        // write empty script to the document. It will get placed directly after the current script
        document.write(`<script id="dummy${id}"><\/script>`);
        // find appended script and return src of the previous script which is the current script
        return document.getElementById('dummy' + id).previousSibling.src;
    }
    catch (e) {
        return '';
    }
}
__dirname = path.dirname(getJsUrl());

var _extends$2 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties$2(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }
var RelayIcon = ((_ref) => {
  let props = _objectWithoutProperties$2(_ref, ["styles"]);

  return React.createElement(
    "svg",
    _extends$2({ viewBox: "0 0 600 600" }, props),
    React.createElement(
      "g",
      { fill: "#F26B00" },
      React.createElement("path", { d: "M142.536 198.858c0 26.36-21.368 47.72-47.72 47.72-26.36 0-47.722-21.36-47.722-47.72s21.36-47.72 47.72-47.72c26.355 0 47.722 21.36 47.722 47.72" }),
      React.createElement("path", { d: "M505.18 414.225H238.124c-35.25 0-63.926-28.674-63.926-63.923s28.678-63.926 63.926-63.926h120.78c20.816 0 37.753-16.938 37.753-37.756s-16.938-37.756-37.753-37.756H94.81c-7.227 0-13.086-5.86-13.086-13.085 0-7.227 5.86-13.086 13.085-13.086h264.093c35.25 0 63.923 28.678 63.923 63.926s-28.674 63.923-63.923 63.923h-120.78c-20.82 0-37.756 16.938-37.756 37.76 0 20.816 16.938 37.753 37.756 37.753H505.18c7.227 0 13.086 5.86 13.086 13.085 0 7.226-5.858 13.085-13.085 13.085z" }),
      React.createElement("path", { d: "M457.464 401.142c0-26.36 21.36-47.72 47.72-47.72s47.72 21.36 47.72 47.72-21.36 47.72-47.72 47.72-47.72-21.36-47.72-47.72" })
    )
  );
});

// const RelayIconSvg = require('!!svg-as-symbol-loader?id=RelayIcon!../components/icons/relay-icon.svg');
const svgns = 'http://www.w3.org/2000/svg';
const xlinkns = 'http://www.w3.org/1999/xlink';
class Viewport {
    constructor(store, container) {
        this.store = store;
        this.container = container;
        this.resize = () => {
            let bbRect = this.container.getBoundingClientRect();
            this.offsetLeft = bbRect.left;
            this.offsetTop = bbRect.top;
            if (this.zoomer !== undefined) {
                this.zoomer.resize();
            }
        };
        let unsubscribe = [];
        function subscribe(...args) {
            unsubscribe.push(observeStore(store, ...args));
        }
        this._unsubscribe = observeStore(store, state => state.currentSvgIndex, svgIdx => {
            unsubscribe.forEach(f => f());
            unsubscribe = [];
            if (svgIdx === null)
                return;
            let cachedSvg = store.getState().svgCache[svgIdx];
            this.display(cachedSvg.svg);
            subscribe(state => state.selected.currentNodeId, id => this.selectNodeById(id));
            subscribe(state => state.selected.currentEdgeId, id => this.selectEdgeById(id));
            subscribe(state => state.graphView.focusedId, id => {
                if (id === null)
                    return;
                this.focusElement(id);
                store.dispatch(focusElementDone(id));
            });
        });
        window.addEventListener('resize', this.resize);
        this.resize();
    }
    display(svgString) {
        this.clear();
        this.$svg = preprocessVizSvg(svgString);
        this.container.appendChild(this.$svg);
        // run on the next tick
        setTimeout(() => {
            this.enableZoom();
            this.bindClick();
            this.bindHover();
        }, 0);
    }
    clear() {
        try {
            this.zoomer && this.zoomer.destroy();
        }
        catch (e) {
            // skip
        }
        this.container.innerHTML = '';
    }
    enableZoom() {
        const svgHeight = this.$svg['height'].baseVal.value;
        const svgWidth = this.$svg['width'].baseVal.value;
        const bbRect = this.container.getBoundingClientRect();
        this.maxZoom = Math.max(svgHeight / bbRect.height, svgWidth / bbRect.width);
        this.zoomer = svgPanZoom(this.$svg, {
            zoomScaleSensitivity: 0.25,
            minZoom: 0.95,
            maxZoom: this.maxZoom,
            controlIconsEnabled: true,
        });
        this.zoomer.zoom(0.95);
    }
    bindClick() {
        let dragged = false;
        let moveHandler = () => (dragged = true);
        this.$svg.addEventListener('mousedown', () => {
            dragged = false;
            setTimeout(() => this.$svg.addEventListener('mousemove', moveHandler));
        });
        this.$svg.addEventListener('mouseup', event => {
            this.$svg.removeEventListener('mousemove', moveHandler);
            if (dragged)
                return;
            var target = event.target;
            if (isLink(target)) {
                const typeId = typeNameToId(target.textContent);
                this.store.dispatch(focusElement(typeId));
            }
            else if (isNode$1(target)) {
                let $node = getParent(target, 'node');
                this.store.dispatch(selectNode($node.id));
            }
            else if (isEdge(target)) {
                let $edge = getParent(target, 'edge');
                this.store.dispatch(selectEdge(edgeSource($edge).id));
            }
            else if (!isControl(target)) {
                this.store.dispatch(clearSelection());
            }
        });
    }
    bindHover() {
        let $prevHovered = null;
        let $prevHoveredEdge = null;
        function clearSelection$$1() {
            if ($prevHovered)
                $prevHovered.classList.remove('hovered');
            if ($prevHoveredEdge)
                $prevHoveredEdge.classList.remove('hovered');
        }
        this.$svg.addEventListener('mousemove', event => {
            let target = event.target;
            if (isEdgeSource(target)) {
                let $sourceGroup = getParent(target, 'edge-source');
                if ($sourceGroup.classList.contains('hovered'))
                    return;
                clearSelection$$1();
                $sourceGroup.classList.add('hovered');
                $prevHovered = $sourceGroup;
                let $edge = edgeFrom($sourceGroup.id);
                $edge.classList.add('hovered');
                $prevHoveredEdge = $edge;
            }
            else {
                clearSelection$$1();
            }
        });
    }
    selectNodeById(id) {
        this.deselectNode();
        if (id === null) {
            this.$svg.classList.remove('selection-active');
            return;
        }
        this.$svg.classList.add('selection-active');
        var $selected = document.getElementById(id);
        this.selectNode($selected);
    }
    selectNode(node) {
        node.classList.add('selected');
        _.each(edgesFromNode(node), $edge => {
            $edge.classList.add('highlighted');
            edgeTarget($edge).classList.add('selected-reachable');
        });
        _.each(edgesTo(node.id), $edge => {
            $edge.classList.add('highlighted');
            edgeSource($edge).parentElement.classList.add('selected-reachable');
        });
    }
    selectEdgeById(id) {
        removeClass(this.$svg, '.edge.selected', 'selected');
        removeClass(this.$svg, '.edge-source.selected', 'selected');
        removeClass(this.$svg, '.field.selected', 'selected');
        if (id === null)
            return;
        var $selected = document.getElementById(id);
        if ($selected) {
            let $edge = edgeFrom($selected.id);
            if ($edge)
                $edge.classList.add('selected');
            $selected.classList.add('selected');
        }
    }
    deselectNode() {
        removeClass(this.$svg, '.node.selected', 'selected');
        removeClass(this.$svg, '.highlighted', 'highlighted');
        removeClass(this.$svg, '.selected-reachable', 'selected-reachable');
    }
    focusElement(id) {
        let bbBox = document.getElementById(id).getBoundingClientRect();
        let currentPan = this.zoomer.getPan();
        let viewPortSizes = this.zoomer.getSizes();
        currentPan.x += viewPortSizes.width / 2 - bbBox.width / 2;
        currentPan.y += viewPortSizes.height / 2 - bbBox.height / 2;
        let zoomUpdateToFit = 1.2 * Math.max(bbBox.height / viewPortSizes.height, bbBox.width / viewPortSizes.width);
        let newZoom = this.zoomer.getZoom() / zoomUpdateToFit;
        let recomendedZoom = this.maxZoom * 0.6;
        if (newZoom > recomendedZoom)
            newZoom = recomendedZoom;
        let newX = currentPan.x - bbBox.left + this.offsetLeft;
        let newY = currentPan.y - bbBox.top + this.offsetTop;
        this.animatePanAndZoom(newX, newY, newZoom);
    }
    animatePanAndZoom(x, y, zoomEnd) {
        let pan = this.zoomer.getPan();
        let panEnd = { x, y };
        animate(pan, panEnd, props => {
            this.zoomer.pan({ x: props.x, y: props.y });
            if (props === panEnd) {
                let zoom = this.zoomer.getZoom();
                animate({ zoom }, { zoom: zoomEnd }, props => {
                    this.zoomer.zoom(props.zoom);
                });
            }
        });
    }
    destroy() {
        this._unsubscribe();
        window.removeEventListener('resize', this.resize);
        try {
            this.zoomer.destroy();
        }
        catch (e) {
            // skip
        }
    }
}
function preprocessVizSvg(svgString) {
    //Add Relay Icon
    let svg = stringToSvg(svgString);
    forEachNode(svg, 'a', $a => {
        let $g = $a.parentNode;
        var $docFrag = document.createDocumentFragment();
        while ($a.firstChild) {
            let $child = $a.firstChild;
            $docFrag.appendChild($child);
        }
        $g.replaceChild($docFrag, $a);
        $g.id = $g.id.replace(/^a_/, '');
    });
    forEachNode(svg, 'title', $el => $el.remove());
    var edgesSources = {};
    forEachNode(svg, '.edge', $edge => {
        let [from, to] = $edge.id.split(' => ');
        $edge.removeAttribute('id');
        $edge.setAttribute('data-from', from);
        $edge.setAttribute('data-to', to);
        edgesSources[from] = true;
    });
    forEachNode(svg, '[id]', $el => {
        let [tag, ...restOfId] = $el.id.split('::');
        if (_.size(restOfId) < 1)
            return;
        $el.classList.add(tag.toLowerCase().replace(/_/, '-'));
    });
    forEachNode(svg, 'g.edge path', $path => {
        let $newPath = $path.cloneNode();
        $newPath.classList.add('hover-path');
        $newPath.removeAttribute('stroke-dasharray');
        $path.parentNode.appendChild($newPath);
    });
    forEachNode(svg, '.field', $field => {
        let texts = $field.querySelectorAll('text');
        texts[0].classList.add('field-name');
        //Remove spaces used for text alligment
        texts[1].remove();
        if (edgesSources[$field.id])
            $field.classList.add('edge-source');
        for (var i = 2; i < texts.length; ++i) {
            var str = texts[i].innerHTML;
            if (str === '{R}') {
                const $iconPlaceholder = texts[i];
                const height = 22;
                const width = 22;
                const $useRelayIcon = document.createElementNS(svgns, 'use');
                $useRelayIcon.setAttributeNS(xlinkns, 'href', '#RelayIcon');
                $useRelayIcon.setAttribute('width', `${width}px`);
                $useRelayIcon.setAttribute('height', `${height}px`);
                //FIXME: remove hardcoded offset
                const y = parseInt($iconPlaceholder.getAttribute('y')) - 15;
                $useRelayIcon.setAttribute('x', $iconPlaceholder.getAttribute('x'));
                $useRelayIcon.setAttribute('y', y.toString());
                $field.replaceChild($useRelayIcon, $iconPlaceholder);
                continue;
            }
            texts[i].classList.add('field-type');
            if (edgesSources[$field.id] && !/[\[\]\!]/.test(str))
                texts[i].classList.add('type-link');
        }
    });
    forEachNode(svg, '.derived-type', $derivedType => {
        $derivedType.classList.add('edge-source');
        $derivedType.querySelector('text').classList.add('type-link');
    });
    forEachNode(svg, '.possible-type', $possibleType => {
        $possibleType.classList.add('edge-source');
        $possibleType.querySelector('text').classList.add('type-link');
    });
    return svg;
}
function getParent(elem, className) {
    while (elem && elem.tagName !== 'svg') {
        if (elem.classList.contains(className))
            return elem;
        elem = elem.parentNode;
    }
    return null;
}
function isNode$1(elem) {
    return getParent(elem, 'node') != null;
}
function isEdge(elem) {
    return getParent(elem, 'edge') != null;
}
function isLink(elem) {
    return elem.classList.contains('type-link');
}
function isEdgeSource(elem) {
    return getParent(elem, 'edge-source') != null;
}
function isControl(elem) {
    if (!(elem instanceof SVGElement))
        return false;
    return elem.className.baseVal.startsWith('svg-pan-zoom');
}
function edgeSource(edge) {
    return document.getElementById(edge['dataset']['from']);
}
function edgeTarget(edge) {
    return document.getElementById(edge['dataset']['to']);
}
function edgeFrom(id) {
    return document.querySelector(`.edge[data-from='${id}']`);
}
function edgesFromNode($node) {
    var edges = [];
    forEachNode($node, '.edge-source', $source => {
        const $edge = edgeFrom($source.id);
        edges.push($edge);
    });
    return edges;
}
function edgesTo(id) {
    return _.toArray(document.querySelectorAll(`.edge[data-to='${id}']`));
}

function anonymous(locals, escapeFn, include, rethrow
/*``*/) {
rethrow = rethrow || function rethrow(err, str, flnm, lineno, esc){
  var lines = str.split('\n');
  var start = Math.max(lineno - 3, 0);
  var end = Math.min(lines.length, lineno + 3);
  var filename = esc(flnm); // eslint-disable-line
  // Error context
  var context = lines.slice(start, end).map(function (line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;

  throw err;
};
escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
        .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
}var __line = 1
  , __lines = "<%_\n  var typeGraph = locals.typeGraph;\n  var _ = locals._;\n  var stringifyWrappers = locals.stringifyWrappers;\n -%>\n<%_ function HtmlId(id) {\n  return 'HREF=\"remove_me_url\" ID=\"' + id + '\"';\n} -%>\n<%_ function TEXT(str) {\n  if (str === '')\n    return '';\n  str = str.replace(/]/, '&#93;');\n  return '<FONT>' + str + '</FONT>';\n} -%>\n<%_ var RELAY_ICON = TEXT('{R}'); -%>\ndigraph {\n  graph [\n    rankdir = \"LR\"\n  ];\n  node [\n    fontsize = \"16\"\n    fontname = \"helvetica, open-sans\"\n    shape = \"plaintext\"\n  ];\n  edge [\n  ];\n  ranksep = 2.0\n<%_ _.each(typeGraph.nodes, function(node) { -%>\n  \"<%- node.name %>\" [\n    id = \"<%- node.id %>\"\n    label = <<TABLE ALIGN=\"LEFT\" BORDER=\"0\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"5\">\n      <TR>\n<%_ var kindLabel = node.kind !== 'OBJECT' ? '<<' + node.kind.toLowerCase() + '>>' : '' -%>\n        <TD CELLPADDING=\"4\" <%- HtmlId('TYPE_TITLE::' + node.name) %>\n          ><FONT POINT-SIZE=\"18\"><%- node.name %></FONT><BR/><%= kindLabel %></TD>\n      </TR>\n<%_ _.each(node.fields, function(field) { -%>\n      <TR>\n        <TD <%- HtmlId(field.id) %>\n          ALIGN=\"LEFT\" PORT=\"<%- field.name %>\">\n          <TABLE CELLPADDING=\"0\" CELLSPACING=\"0\" BORDER=\"0\">\n            <TR>\n              <TD ALIGN=\"LEFT\"><%- field.name %><FONT>  </FONT></TD>\n<%_ var parts = stringifyWrappers(field.typeWrappers); -%>\n<%_ var relayIcon = field.relayType ? RELAY_ICON : ''; -%>\n              <TD ALIGN=\"RIGHT\"><%- relayIcon %><%- TEXT(parts[0]) %><%- field.type.name %><%- TEXT(parts[1]) %></TD>\n            </TR>\n          </TABLE>\n        </TD>\n      </TR>\n<%_ }); -%>\n<%_ if (!_.isEmpty(node.possibleTypes)) { -%>\n      <TR>\n        <TD>possible types</TD>\n      </TR>\n<%_ _.each(node.possibleTypes, function (possibleType) { -%>\n      <TR>\n        <TD <%- HtmlId(possibleType.id) %>\n          ALIGN=\"LEFT\" PORT=\"<%- possibleType.type.name %>\"><%- possibleType.type.name %></TD>\n      </TR>\n<%_ }); -%>\n<%_ } -%>\n<%_ if (!_.isEmpty(node.derivedTypes)) { -%>\n      <TR>\n        <TD>implementations</TD>\n      </TR>\n<%_ _.each(node.derivedTypes, function(derivedType) { -%>\n      <TR>\n        <TD <%- HtmlId(derivedType.id) %>\n          ALIGN=\"LEFT\" PORT=\"<%- derivedType.type.name %>\"><%- derivedType.type.name %></TD>\n      </TR>\n<%_ }); -%>\n<%_ } -%>\n    </TABLE>>\n  ];\n<%_ _(node.fields).each(function(field) { -%>\n<%_ if (!typeGraph.nodes[field.type.id]) return; -%>\n  \"<%- node.name %>\":\"<%- field.name %>\" -> \"<%- field.type.name %>\" [\n    id = \"<%- field.id %> => <%- field.type.id %>\"\n    label = \"<%- node.name %>:<%- field.name %>\"\n  ]\n<%_ }); -%>\n<%_ _(node.possibleTypes).each(function(possibleType) { -%>\n  \"<%- node.name %>\":\"<%- possibleType.type.name %>\" -> \"<%- possibleType.type.name %>\" [\n    id = \"<%- possibleType.id %> => <%- possibleType.type.id %>\"\n    style = \"dashed\"\n  ]\n<%_ }); -%>\n<%_ _(node.derivedTypes).each(function(derivedType) { -%>\n  \"<%- node.name %>\":\"<%- derivedType.type.name %>\" -> \"<%- derivedType.type.name %>\" [\n    id = \"<%- derivedType.id %> => <%- derivedType.type.id %>\"\n    style = \"dotted\"\n  ]\n<%_ }); -%>\n<%_ }); -%>\n}\n"
  , __filename = undefined;
try {
  var __output = [], __append = __output.push.bind(__output);
  var typeGraph = locals.typeGraph;
  var _$$1 = locals._;
  var stringifyWrappers = locals.stringifyWrappers;
 __line = 5
    ; __line = 6
    ;  function HtmlId(id) {
  return 'HREF="remove_me_url" ID="' + id + '"';
}
 __line = 8
    ; __line = 9
    ;  function TEXT(str) {
  if (str === '')
    return '';
  str = str.replace(/]/, '&#93;');
  return '<FONT>' + str + '</FONT>';
}
 __line = 14
    ; __line = 15
    ;  var RELAY_ICON = TEXT('{R}');
 __append("digraph {\n  graph [\n    rankdir = \"LR\"\n  ];\n  node [\n    fontsize = \"16\"\n    fontname = \"helvetica, open-sans\"\n    shape = \"plaintext\"\n  ];\n  edge [\n  ];\n  ranksep = 2.0\n")
    ; __line = 28
    ;  _$$1.each(typeGraph.nodes, function(node) {
 __append("  \"")
    ; __line = 29
    ; __append( node.name )
    ; __append("\" [\n    id = \"")
    ; __line = 30
    ; __append( node.id )
    ; __append("\"\n    label = <<TABLE ALIGN=\"LEFT\" BORDER=\"0\" CELLBORDER=\"1\" CELLSPACING=\"0\" CELLPADDING=\"5\">\n      <TR>\n")
    ; __line = 33
    ;  var kindLabel = node.kind !== 'OBJECT' ? '<<' + node.kind.toLowerCase() + '>>' : ''
    ; __append("        <TD CELLPADDING=\"4\" ")
    ; __line = 34
    ; __append( HtmlId('TYPE_TITLE::' + node.name) )
    ; __append("\n          ><FONT POINT-SIZE=\"18\">")
    ; __line = 35
    ; __append( node.name )
    ; __append("</FONT><BR/>")
    ; __append(escapeFn( kindLabel ))
    ; __append("</TD>\n      </TR>\n")
    ; __line = 37
    ;  _$$1.each(node.fields, function(field) {
 __append("      <TR>\n        <TD ")
    ; __line = 39
    ; __append( HtmlId(field.id) )
    ; __append("\n          ALIGN=\"LEFT\" PORT=\"")
    ; __line = 40
    ; __append( field.name )
    ; __append("\">\n          <TABLE CELLPADDING=\"0\" CELLSPACING=\"0\" BORDER=\"0\">\n            <TR>\n              <TD ALIGN=\"LEFT\">")
    ; __line = 43
    ; __append( field.name )
    ; __append("<FONT>  </FONT></TD>\n")
    ; __line = 44
    ;  var parts = stringifyWrappers(field.typeWrappers);
 __line = 45
    ;  var relayIcon = field.relayType ? RELAY_ICON : '';
 __append("              <TD ALIGN=\"RIGHT\">")
    ; __line = 46
    ; __append( relayIcon )
    ; __append( TEXT(parts[0]) )
    ; __append( field.type.name )
    ; __append( TEXT(parts[1]) )
    ; __append("</TD>\n            </TR>\n          </TABLE>\n        </TD>\n      </TR>\n")
    ; __line = 51
    ;  });
 __line = 52
    ;  if (!_$$1.isEmpty(node.possibleTypes)) {
 __append("      <TR>\n        <TD>possible types</TD>\n      </TR>\n")
    ; __line = 56
    ;  _$$1.each(node.possibleTypes, function (possibleType) {
 __append("      <TR>\n        <TD ")
    ; __line = 58
    ; __append( HtmlId(possibleType.id) )
    ; __append("\n          ALIGN=\"LEFT\" PORT=\"")
    ; __line = 59
    ; __append( possibleType.type.name )
    ; __append("\">")
    ; __append( possibleType.type.name )
    ; __append("</TD>\n      </TR>\n")
    ; __line = 61
    ;  });
 __line = 62
    ;  }
 __line = 63
    ;  if (!_$$1.isEmpty(node.derivedTypes)) {
 __append("      <TR>\n        <TD>implementations</TD>\n      </TR>\n")
    ; __line = 67
    ;  _$$1.each(node.derivedTypes, function(derivedType) {
 __append("      <TR>\n        <TD ")
    ; __line = 69
    ; __append( HtmlId(derivedType.id) )
    ; __append("\n          ALIGN=\"LEFT\" PORT=\"")
    ; __line = 70
    ; __append( derivedType.type.name )
    ; __append("\">")
    ; __append( derivedType.type.name )
    ; __append("</TD>\n      </TR>\n")
    ; __line = 72
    ;  });
 __line = 73
    ;  }
 __append("    </TABLE>>\n  ];\n")
    ; __line = 76
    ;  _$$1(node.fields).each(function(field) {
 __line = 77
    ;  if (!typeGraph.nodes[field.type.id]) return;
 __append("  \"")
    ; __line = 78
    ; __append( node.name )
    ; __append("\":\"")
    ; __append( field.name )
    ; __append("\" -> \"")
    ; __append( field.type.name )
    ; __append("\" [\n    id = \"")
    ; __line = 79
    ; __append( field.id )
    ; __append(" => ")
    ; __append( field.type.id )
    ; __append("\"\n    label = \"")
    ; __line = 80
    ; __append( node.name )
    ; __append(":")
    ; __append( field.name )
    ; __append("\"\n  ]\n")
    ; __line = 82
    ;  });
 __line = 83
    ;  _$$1(node.possibleTypes).each(function(possibleType) {
 __append("  \"")
    ; __line = 84
    ; __append( node.name )
    ; __append("\":\"")
    ; __append( possibleType.type.name )
    ; __append("\" -> \"")
    ; __append( possibleType.type.name )
    ; __append("\" [\n    id = \"")
    ; __line = 85
    ; __append( possibleType.id )
    ; __append(" => ")
    ; __append( possibleType.type.id )
    ; __append("\"\n    style = \"dashed\"\n  ]\n")
    ; __line = 88
    ;  });
 __line = 89
    ;  _$$1(node.derivedTypes).each(function(derivedType) {
 __append("  \"")
    ; __line = 90
    ; __append( node.name )
    ; __append("\":\"")
    ; __append( derivedType.type.name )
    ; __append("\" -> \"")
    ; __append( derivedType.type.name )
    ; __append("\" [\n    id = \"")
    ; __line = 91
    ; __append( derivedType.id )
    ; __append(" => ")
    ; __append( derivedType.type.id )
    ; __append("\"\n    style = \"dotted\"\n  ]\n")
    ; __line = 94
    ;  });
 __line = 95
    ;  });
 __append("}\n")
    ; __line = 97;
  return __output.join("");
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}

function getDot(typeGraph) {
    if (typeGraph === null)
        return null;
    return anonymous({ _, typeGraph, stringifyWrappers });
}
const getDotSelector = createSelector(getTypeGraphSelector, getDot);

// import { loadWorker } from '../utils/';
// just reference it to to trigger worker loader
// import ('./viz-worker.worker');
class SVGRender {
    // worker is an instance of a webworker
    constructor(store, worker) {
        this.store = store;
        // import(import MyWorker from 'worker!./my-worker.js';)
        worker.then(worker => {
            this.worker = worker;
            this.unsubscribe = observeStore(store, state => state.currentSvgIndex, getDotSelector, (currentSvgIndex, dot) => {
                if (currentSvgIndex === null && dot !== null)
                    this._renderSvg(dot);
            });
        });
        // loadWorker(workerURI || 'voyager.worker.js', !workerURI).then(worker => {
        //   this.worker = worker;
        //   this.unsubscribe = observeStore(
        //     store,
        //     state => state.currentSvgIndex,
        //     getDotSelector,
        //     (currentSvgIndex, dot) => {
        //       if (currentSvgIndex === null && dot !== null) this._renderSvg(dot);
        //     },
        //   );
        // });
    }
    destroy() {
        this.unsubscribe();
    }
    _renderSvg(dot) {
        let cb = event => {
            let data = event.data;
            console.log(event.data.svgString)
            if (data.result === 'success')
                this.store.dispatch(svgRenderingFinished(data.svgString));
            else
                this.store.dispatch(reportError(data.msg));
            this.worker.removeEventListener('message', cb);
        };
        this.worker.postMessage({ dot });
        this.worker.addEventListener('message', cb);
    }
}

const getSelectedType = createSelector((state) => state.selected.currentNodeId, (state) => getTypeGraphSelector(state), (selectedNodeId, typeGraph) => {
    console.log();
    return _.get(typeGraph, ['nodes', selectedNodeId], null);
});
const getPreviousType = createSelector((state) => _.last(state.selected.previousTypesIds), (state) => getTypeGraphSelector(state), (previousNodeId, typeGraph) => {
    return _.get(typeGraph, ['nodes', previousNodeId], null);
});

class TypeLink extends React.Component {
    render() {
        const { type, dispatch } = this.props;
        return (React.createElement("a", { className: "type-name -object", onClick: event => {
                event.stopPropagation();
                dispatch(focusElement(type.id));
                dispatch(selectNode(type.id));
            } }, type.name));
    }
}
var TypeLink$1 = connect()(TypeLink);

class Markdown extends React.Component {
    constructor(props) {
        super(props);
        this.renderer = new HtmlRenderer({ safe: true });
        this.parser = new Parser();
    }
    shouldComponentUpdate(nextProps) {
        return this.props.text !== nextProps.text;
    }
    render() {
        const { text, className } = this.props;
        if (!text)
            return null;
        const parsed = this.parser.parse(text);
        const html = this.renderer.render(parsed);
        return React.createElement("div", { className: className, dangerouslySetInnerHTML: { __html: html } });
    }
}

class Description extends React.Component {
    render() {
        const { text, className } = this.props;
        if (text)
            return React.createElement(Markdown, { text: text, className: classNames('description-box', className) });
        return (React.createElement("div", { className: classNames('description-box', className, '-no-description') },
            React.createElement("p", null, 'No Description')));
    }
}

var _extends$3 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties$3(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }
var EyeIcon = ((_ref) => {
  let props = _objectWithoutProperties$3(_ref, ["styles"]);

  return React.createElement(
    "svg",
    _extends$3({ height: "24", viewBox: "0 0 24 24", width: "24", xmlns: "http://www.w3.org/2000/svg" }, props),
    React.createElement("path", { d: "M0 0h24v24H0z", fill: "none" }),
    React.createElement("path", { d: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" })
  );
});

function FocusTypeButton(props) {
    return (React.createElement(IconButton, { className: "eye-button", onClick: () => props.dispatch(focusElement(props.type.id)) },
        React.createElement(EyeIcon, null)));
}
var FocusTypeButton$1 = connect()(FocusTypeButton);

class TypeList extends React.Component {
    renderItem(type, className) {
        return (React.createElement("div", { key: type.id, className: classNames('typelist-item', className || '') },
            React.createElement(TypeLink$1, { type: type }),
            React.createElement(FocusTypeButton$1, { type: type }),
            React.createElement(Description, { className: "-doc-type", text: type.description })));
    }
    render() {
        const { typeGraph } = this.props;
        if (typeGraph === null)
            return null;
        const rootType = typeGraph.nodes[typeGraph.rootId];
        const types = _(typeGraph.nodes)
            .values()
            .reject({ id: rootType && rootType.id })
            .sortBy('name')
            .value();
        return (React.createElement("div", { className: "scroll-area doc-explorer-type-list" },
            rootType && this.renderItem(rootType, '-root'),
            _.map(types, type => this.renderItem(type))));
    }
}
var TypeList$1 = connect()(TypeList);

function mapStateToProps$2(state) {
    return {
        selectedType: getSelectedType(state),
        previousType: getPreviousType(state),
    };
}
class DocNavigation extends React.Component {
    render() {
        const { selectedType, previousType, dispatch } = this.props;
        let clickHandler = () => {
            if (!previousType)
                return dispatch(clearSelection());
            dispatch(focusElement(previousType.id));
            dispatch(selectPreviousType());
        };
        return (React.createElement("div", { className: "doc-navigation" },
            (selectedType && (React.createElement("span", { className: "back", onClick: clickHandler }, previousType ? previousType.name : 'Type List'))) || React.createElement("span", { className: "header" }, "Type List"),
            selectedType && (React.createElement("span", { className: "active" },
                selectedType.name,
                React.createElement(FocusTypeButton$1, { type: selectedType })))));
    }
}
var DocNavigation$1 = connect(mapStateToProps$2)(DocNavigation);

class TypeName extends React.Component {
    render() {
        const { type } = this.props;
        let className;
        if (isBuiltInScalarType(type))
            className = '-built-in';
        else if (isScalarType(type))
            className = '-scalar';
        else if (isInputObjectType(type))
            className = '-input-obj';
        return (React.createElement("span", { className: classNames('type-name', className), onClick: event => {
                this.props.dispatch(changeSelectedTypeInfo(type));
                event.stopPropagation();
            } }, type.name));
    }
}
var TypeName$1 = connect()(TypeName);

const TooltipIcon = Tooltip(IconButton);
class WrappedTypeName extends React.Component {
    renderRelayIcon() {
        return (React.createElement(TooltipIcon, { className: "relay-icon", tooltipPosition: "top", ripple: false, tooltip: "Relay Connection" },
            React.createElement(RelayIcon, null)));
    }
    render() {
        const { container } = this.props;
        const type = container.type;
        const wrappers = container.typeWrappers || [];
        const [leftWrap, rightWrap] = stringifyWrappers(wrappers);
        return (React.createElement("span", { className: "wrapped-type-name" },
            leftWrap,
            isNode(type) ? React.createElement(TypeLink$1, { type: type }) : React.createElement(TypeName$1, { type: type }),
            rightWrap,
            container.relayType && this.renderRelayIcon()));
    }
}

class Argument extends React.Component {
    render() {
        const { arg, expanded } = this.props;
        return (React.createElement("span", { className: classNames('arg-wrap', { '-expanded': expanded }) },
            React.createElement("span", { className: "arg" },
                React.createElement("span", { className: "arg-name" }, arg.name),
                React.createElement(WrappedTypeName, { container: arg }),
                arg.defaultValue !== null && (React.createElement("span", null,
                    ' = ',
                    React.createElement("span", { className: "default-value" }, arg.defaultValue)))),
            React.createElement(Markdown, { text: arg.description, className: "arg-description" })));
    }
}

function mapStateToProps$3(state) {
    return {
        selectedType: getSelectedType(state),
        selectedEdgeId: state.selected.currentEdgeId,
        typeGraph: getTypeGraphSelector(state),
    };
}
class TypeDoc extends React.Component {
    componentDidUpdate(prevProps) {
        if (this.props.selectedEdgeId !== prevProps.selectedEdgeId) {
            this.ensureActiveVisible();
        }
    }
    ensureActiveVisible() {
        let itemComponent = this.refs['selectedItem'];
        if (!itemComponent)
            return;
        itemComponent.scrollIntoViewIfNeeded();
    }
    renderTypesDef(type, typeGraph, selectedId) {
        let typesTitle;
        let types;
        let dispatch = this.props.dispatch;
        switch (type.kind) {
            case 'UNION':
                typesTitle = 'possible types';
                types = type.possibleTypes;
                break;
            case 'INTERFACE':
                typesTitle = 'implementations';
                types = type.derivedTypes;
                break;
            case 'OBJECT':
                typesTitle = 'implements';
                types = type.interfaces;
                break;
            default:
                return null;
        }
        types = _.filter(types, type => typeGraph.nodes[type.type.id] !== undefined);
        if (_.isEmpty(types))
            return null;
        return (React.createElement("div", { className: "doc-category" },
            React.createElement("div", { className: "title" }, typesTitle),
            _.map(types, type => {
                let props = {
                    key: type.id,
                    className: classNames('item', {
                        '-selected': type.id === selectedId,
                    }),
                    onClick: () => {
                        dispatch(selectEdge(type.id));
                    },
                };
                if (type.id === selectedId)
                    props.ref = 'selectedItem';
                return (React.createElement("div", Object.assign({}, props),
                    React.createElement(TypeLink$1, { type: type.type }),
                    React.createElement(Description, { text: type.type.description, className: "-linked-type" })));
            })));
    }
    renderFields(type, selectedId) {
        if (_.isEmpty(type.fields))
            return null;
        let dispatch = this.props.dispatch;
        return (React.createElement("div", { className: "doc-category" },
            React.createElement("div", { className: "title" }, 'fields'),
            _.map(type.fields, field => {
                let props = {
                    key: field.name,
                    className: classNames('item', {
                        '-selected': field.id === selectedId,
                        '-with-args': !_.isEmpty(field.args),
                    }),
                    onClick: () => {
                        dispatch(selectEdge(field.id));
                    },
                };
                if (field.id === selectedId)
                    props.ref = 'selectedItem';
                return (React.createElement("div", Object.assign({}, props),
                    React.createElement("a", { className: "field-name" }, field.name),
                    React.createElement("span", { className: classNames('args-wrap', {
                            '-empty': _.isEmpty(field.args),
                        }) }, !_.isEmpty(field.args) && (React.createElement("span", { key: "args", className: "args" }, _.map(field.args, arg => (React.createElement(Argument, { key: arg.name, arg: arg, expanded: field.id === selectedId })))))),
                    React.createElement(WrappedTypeName, { container: field }),
                    field.isDeprecated && React.createElement("span", { className: "doc-alert-text" }, ' (DEPRECATED)'),
                    React.createElement(Markdown, { text: field.description, className: "description-box -field" })));
            })));
    }
    render() {
        const { selectedType, selectedEdgeId, typeGraph } = this.props;
        return (React.createElement("div", { className: "type-doc" },
            (typeGraph && React.createElement(DocNavigation$1, null)) || React.createElement("span", { className: "loading" }, " Loading... "),
            !selectedType ? (React.createElement(TypeList$1, { typeGraph: typeGraph })) : (React.createElement("div", { className: "scroll-area" },
                React.createElement(Description, { className: "-doc-type", text: selectedType.description }),
                this.renderTypesDef(selectedType, typeGraph, selectedEdgeId),
                this.renderFields(selectedType, selectedEdgeId)))));
    }
}
var TypeDoc$1 = connect(mapStateToProps$3)(TypeDoc);

var _extends$4 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties$4(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }
var CloseIcon = ((_ref) => {
  let props = _objectWithoutProperties$4(_ref, ["styles"]);

  return React.createElement(
    "svg",
    _extends$4({ height: "24", viewBox: "0 0 24 24", width: "24", xmlns: "http://www.w3.org/2000/svg" }, props),
    React.createElement("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" }),
    React.createElement("path", { d: "M0 0h24v24H0z", fill: "none" })
  );
});

class TypeDetails extends React.Component {
    renderFields(type) {
        if (_.isEmpty(type.inputFields))
            return null;
        return (React.createElement("div", { className: "doc-category" },
            React.createElement("div", { className: "title" }, 'fields'),
            _.map(type.inputFields, field => {
                return (React.createElement("div", { key: field.id, className: "item" },
                    React.createElement("a", { className: "field-name" }, field.name),
                    React.createElement(WrappedTypeName, { container: field }),
                    React.createElement(Markdown, { text: field.description, className: "description-box -field" })));
            })));
    }
    renderEnumValues(type) {
        if (_.isEmpty(type.enumValues))
            return null;
        return (React.createElement("div", { className: "doc-category" },
            React.createElement("div", { className: "title" }, 'values'),
            _.map(type.enumValues, value => React.createElement(EnumValue, { key: value.name, value: value }))));
    }
    render() {
        const { type } = this.props;
        return (React.createElement("div", { className: "type-details" },
            React.createElement("header", null,
                React.createElement("h3", null, type.name),
                React.createElement(Description, { className: "-doc-type", text: type.description })),
            React.createElement("div", { className: "doc-categories" },
                this.renderFields(type),
                this.renderEnumValues(type))));
    }
}
class EnumValue extends React.Component {
    render() {
        const { value } = this.props;
        return (React.createElement("div", { className: "item" },
            React.createElement("div", { className: "enum-value" }, value.name),
            React.createElement(Markdown, { className: "description-box -enum-value", text: value.description }),
            value.deprecationReason && (React.createElement(Markdown, { className: "doc-deprecation", text: value.deprecationReason }))));
    }
}

function mapStateToProps$4(state) {
    return {
        type: state.selected.typeinfo,
    };
}
class ScalarDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = { localType: null };
    }
    close() {
        this.props.dispatch(changeSelectedTypeInfo(null));
        setTimeout(() => {
            this.setState({ localType: null });
        }, 450);
    }
    render() {
        let { type } = this.props;
        //FIXME: implement animation correctly
        //https://facebook.github.io/react/docs/animation.html
        let { localType } = this.state;
        if (type && (!localType || type.name !== localType.name)) {
            setTimeout(() => {
                this.setState({ localType: type });
            });
        }
        return (React.createElement("div", { className: classNames('type-info-popover', {
                '-opened': !!type,
            }) },
            React.createElement(IconButton, { className: "closeButton", onClick: () => this.close() },
                React.createElement(CloseIcon, null)),
            (type || localType) && React.createElement(TypeDetails, { type: type || localType })));
    }
}
var TypeInfoPopover = connect(mapStateToProps$4)(ScalarDetails);

class DocPanel extends React.Component {
    render() {
        let { _showChangeButton } = this.props;
        return (React.createElement("div", { className: "doc-panel" },
            React.createElement("div", { className: "contents" },
                React.createElement(TitleArea$1, { _showChangeButton: _showChangeButton }),
                React.createElement(TypeDoc$1, null)),
            React.createElement(TypeInfoPopover, null)));
    }
}

class RootSelector extends React.Component {
    render() {
        let { rootTypeId, theme, schema, onChange } = this.props;
        if (schema === null)
            return null;
        rootTypeId = rootTypeId || getDefaultRoot(schema);
        let { types, queryType, mutationType, subscriptionType } = schema;
        types = _.omit(types, queryType.id);
        if (mutationType)
            types = _.omit(types, mutationType.id);
        if (subscriptionType)
            types = _.omit(types, subscriptionType.id);
        types = _(types)
            .values()
            .filter(isNode)
            .sortBy('name')
            .value();
        let typesList = _.compact([queryType, mutationType, subscriptionType]).map(type => ({
            value: type.id,
            label: type.name,
            bold: true,
        }));
        typesList = [...typesList, ...types.map(type => ({ value: type.id, label: type.name }))];
        return (React.createElement(Dropdown, { className: "root-selector", theme: theme, source: typesList, onChange: value => {
                onChange(value);
            }, value: rootTypeId, template: item => (item.bold ? React.createElement("strong", null,
                " ",
                item.label,
                " ") : React.createElement("span", null, item.label)) }));
    }
}

function mapStateToProps$5(state) {
    const schema = getSchemaSelector(state);
    return {
        options: state.displayOptions,
        schema: schema,
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onChange: options => {
            dispatch(changeDisplayOptions(options));
        },
    };
}
class Settings extends React.Component {
    render() {
        let { schema, options, theme, onChange } = this.props;
        return (React.createElement("div", { className: "menu-content" },
            React.createElement("div", { className: "setting-change-root" },
                React.createElement("h3", null, " Root Node "),
                React.createElement(RootSelector, { theme: theme, schema: schema, rootTypeId: options.rootTypeId, onChange: rootTypeId => onChange({ ...options, rootTypeId }) })),
            React.createElement("div", { className: "setting-other-options" },
                React.createElement("h3", null, " Options "),
                React.createElement(Checkbox, { label: "Sort by Alphabet", theme: theme, checked: !!options.sortByAlphabet, onChange: sortByAlphabet => onChange({ ...options, sortByAlphabet }) }),
                React.createElement(Checkbox, { label: "Skip Relay", theme: theme, checked: !!options.skipRelay, onChange: skipRelay => onChange({ ...options, skipRelay }) }))));
    }
}
connect(mapStateToProps$5, mapDispatchToProps)(Settings);

function mapStateToProps$6(state) {
    return {
        showSchemaModal: state.schemaModal.opened,
        notApplied: state.schemaModal.notApplied,
        schema: getNaSchemaSelector(state),
    };
}
class SchemaModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = { recentlyCopied: false };
    }
    componentDidMount() {
        this.props.dispatch(showSchemaModal());
        let url = getQueryParams()['url'];
        if (url) {
            this.props.dispatch(hideSchemaModal());
            const withCredentials = getQueryParams()['withCredentials'] === 'true';
            const clientOptions = withCredentials ? { credentials: 'include', mode: 'cors' } : {};
            const client = new GraphQLClient(url, clientOptions);
            client
                .request(introspectionQuery)
                .then(introspection => this.props.dispatch(changeSchema({ data: introspection })))
                .catch(err => {
                this.props.dispatch(reportError(err.response.data || `Error loading: ${err.response.status}`));
            });
        }
        else if (DEBUG_INITIAL_PRESET) {
            this.props.dispatch(hideSchemaModal());
            this.props.dispatch(changeActivePreset(DEBUG_INITIAL_PRESET));
            this.props.dispatch(changeSchema(this.props.presets[DEBUG_INITIAL_PRESET]));
        }
    }
    handleTextChange(event) {
        let text = event.target.value;
        if (text === '')
            text = null;
        this.props.dispatch(changeNaActivePreset('custom', text));
    }
    handlePresetChange(name) {
        this.props.dispatch(changeNaActivePreset(name, this.props.presets[name]));
    }
    handleDisplayOptionsChange(options) {
        this.props.dispatch(changeNaDisplayOptions(options));
    }
    handleChange() {
        const { notApplied: { activePreset, displayOptions, presetValue } } = this.props;
        let schema = activePreset === 'custom' ? JSON.parse(presetValue) : presetValue;
        this.props.dispatch(changeActivePreset(activePreset));
        this.props.dispatch(changeSchema(schema, displayOptions));
        this.props.dispatch(hideSchemaModal());
    }
    close() {
        this.props.dispatch(hideSchemaModal());
    }
    copy() {
        this.setState({ ...this.state, recentlyCopied: true });
        setTimeout(() => {
            this.setState({ ...this.state, recentlyCopied: false });
        }, 2000);
    }
    appBar() {
        return (React.createElement(IconButton, { className: "close-icon", onClick: () => this.close() },
            React.createElement(CloseIcon, { color: "#ffffff" })));
    }
    predefinedCards(presetNames, activePreset) {
        return (React.createElement("div", { className: "schema-presets" }, _(presetNames)
            .without('custom')
            .map(name => (React.createElement("div", { key: name, className: classNames('introspection-card', {
                '-active': name === activePreset,
            }), onClick: () => {
                if (name !== activePreset)
                    this.handlePresetChange(name);
            } },
            React.createElement("h2", null,
                " ",
                name,
                " "))))
            .value()));
    }
    customCard(isActive, customPresetText) {
        return (React.createElement("div", { className: "custom-schema-selector" },
            React.createElement("div", { className: classNames('introspection-card', {
                    '-active': isActive,
                }), onClick: () => isActive || this.handlePresetChange('custom') },
                React.createElement("div", { className: "card-header" },
                    React.createElement("h2", null, " Custom Schema ")),
                React.createElement("div", { className: "card-content" },
                    React.createElement("p", null,
                        ' ',
                        "Run the introspection query against a GraphQL endpoint. Paste the result into the textarea below to view the model relationships."),
                    React.createElement(ClipboardButton, { component: "a", "data-clipboard-text": introspectionQuery, className: classNames({
                            'hint--top': this.state.recentlyCopied,
                        }), "data-hint": "Copied to clipboard", onClick: () => this.copy() }, "Copy Introspection Query"),
                    React.createElement("textarea", { value: customPresetText || '', disabled: !isActive, onChange: this.handleTextChange.bind(this), placeholder: "Paste Introspection Here" })))));
    }
    modalContent(presetNames, notApplied, schema) {
        if (notApplied === null)
            return null;
        const { activePreset, displayOptions, presetValue } = notApplied;
        const validSelected = !!schema.schema;
        const errorMessage = schema.error;
        let infoMessage = null;
        let infoClass = null;
        if (errorMessage != null) {
            infoMessage = errorMessage;
            infoClass = '-error';
        }
        else if (activePreset == null) {
            infoMessage = 'Please select introspection';
            infoClass = '-select';
        }
        else if (activePreset === 'custom') {
            infoMessage = 'Please paste your introspection';
            infoClass = '-select';
        }
        return (React.createElement("div", { className: "schema-modal" },
            React.createElement("div", { className: "logo" },
                React.createElement("img", { src: "logo.png" })),
            React.createElement("div", { className: "modal-cards" },
                this.predefinedCards(presetNames, activePreset),
                this.customCard(activePreset === 'custom', presetValue)),
            React.createElement("div", { className: classNames('modal-info-panel', {
                    '-message': !validSelected,
                    '-settings': validSelected,
                }) },
                React.createElement("div", { className: classNames('modal-message', 'content', infoClass) }, infoMessage),
                React.createElement(Settings, { theme: undefined, schema: schema.schema, options: displayOptions, onChange: options => this.handleDisplayOptionsChange(options) })),
            React.createElement(Button, { raised: true, label: "Change Schema", theme: undefined, disabled: !validSelected, onClick: this.handleChange.bind(this) })));
    }
    render() {
        const { showSchemaModal: showSchemaModal$$1, notApplied, schema, presets } = this.props;
        if (!presets)
            throw new Error('To use schema modal pass "_schemaPresets" property to "<Voyager>"');
        let customStyle = {
            content: { maxHeight: '600px', maxWidth: '1000px' },
            overlay: { zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.74902)' },
        };
        return (React.createElement(ReactModal, { isOpen: showSchemaModal$$1, className: "modal-root", style: customStyle, contentLabel: "Select Introspection", onRequestClose: () => this.close() },
            this.appBar(),
            this.modalContent(Object.keys(presets), notApplied, schema)));
    }
}
var SchemaModal$1 = connect(mapStateToProps$6)(SchemaModal);

class Voyager extends React.Component {
    constructor(props) {
        super(props);
        this.store = configureStore();
    }
    componentDidMount() {
        // init viewport and svg-renderer
        this.renderer = new SVGRender(this.store, this.props.workerURI);
        this.viewport = new Viewport(this.store, this.refs['viewport']);
        this.updateIntrospection();
    }
    componentWillUnmount() {
        this.viewport.destroy();
        this.renderer.unsubscribe();
    }
    updateIntrospection() {
        let displayOpts = normalizeDisplayOptions(this.props.displayOptions);
        if (_.isFunction(this.props.introspection)) {
            let promise = this.props.introspection(introspectionQuery);
            if (!isPromise(promise)) {
                this.store.dispatch(reportError('SchemaProvider did not return a Promise for introspection.'));
            }
            promise.then(schema => {
                if (schema === this.store.getState().schema)
                    return;
                this.store.dispatch(changeSchema(schema, displayOpts));
            });
        }
        else if (this.props.introspection) {
            this.store.dispatch(changeSchema(this.props.introspection, displayOpts));
        }
    }
    componentDidUpdate(prevProps) {
        if (this.props.introspection !== prevProps.introspection) {
            this.updateIntrospection();
            return;
        }
        if (this.props.displayOptions !== prevProps.displayOptions) {
            let opts = normalizeDisplayOptions(this.props.displayOptions);
            this.store.dispatch(changeDisplayOptions(opts));
        }
        if (this.props.hideDocs !== prevProps.hideDocs) {
            this.viewport.resize();
        }
    }
    render() {
        let { _schemaPresets, hideDocs = false } = this.props;
        let showModal = !!_schemaPresets;
        return (React.createElement(Provider, { store: this.store },
            React.createElement("div", { className: "graphql-voyager" },
                !hideDocs && React.createElement(DocPanel, { _showChangeButton: !!_schemaPresets }),
                React.createElement("div", { ref: "viewport", className: "viewport" }),
                React.createElement(ErrorBar$1, null),
                React.createElement(LoadingAnimation$1, null),
                showModal && React.createElement(SchemaModal$1, { presets: _schemaPresets }))));
    }
}
Voyager.propTypes = {
    introspection: PropTypes.oneOfType([
        PropTypes.func.isRequired,
        PropTypes.object.isRequired,
        PropTypes.bool.isRequired,
    ]).isRequired,
    _schemaPresets: PropTypes.object,
    displayOptions: PropTypes.shape({
        rootType: PropTypes.string,
        skipRelay: PropTypes.bool,
        sortByAlphabet: PropTypes.bool,
        hideRoot: PropTypes.bool,
    }),
    hideDocs: PropTypes.bool,
};
// Duck-type promise detection.
function isPromise(value) {
    return typeof value === 'object' && typeof value.then === 'function';
}
function normalizeDisplayOptions(opts = {}) {
    return {
        ...opts,
        rootTypeId: opts.rootType && typeNameToId(opts.rootType),
    };
}

function init(element, options) {
    ReactDOM.render(React.createElement(Voyager, Object.assign({}, options)), element);
}

export { Voyager, init };

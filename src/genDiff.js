// @ts-check

import _ from 'lodash';
import parseFile from './parsers.js';
import formatStylish from './formatStylish.js';
import states from './states.js';
import { getFileAbsPath, getExtName, readFile } from './readFileUtils.js';
import { makeDiff } from './diffsAPI.js';

const getObject = (filePath) => {
  const absFilePath = getFileAbsPath(filePath.toLowerCase());
  const extName = getExtName(filePath);
  const rawFile = readFile(absFilePath);
  return parseFile(rawFile, extName);
};

const getState = (obj1, obj2, treePath) => {
  if (!_.has(obj1, treePath)) return states.CREATED;
  if (!_.has(obj2, treePath)) return states.DELETED;
  if (_.get(obj1, treePath) !== _.get(obj2, treePath)) return states.CHANGED;
  return states.UNCHANGED;
};

const makeDiffs = (obj1, obj2) => {
  const fullTree = _.merge({}, obj1, obj2);

  const emptyValues = [undefined, undefined];

  const differences = (tree = {}, treePath = []) => {
    const entries = Object.entries(tree).sort();
    const result = entries.reduce((acc, [treeKey, treeValue]) => {
      const currPath = [...treePath, treeKey];
      const depth = currPath.length;
      const state = getState(obj1, obj2, currPath);
      if (_.isPlainObject(treeValue)) {
        acc.push(makeDiff(treeKey, state, emptyValues, depth, differences(treeValue, currPath)));
      } else {
        const value1 = _.get(obj1, currPath);
        const value2 = _.get(obj2, currPath);
        const values = [value1, value2];
        acc.push(makeDiff(treeKey, state, values, depth));
      }
      return acc;
    }, []);

    return result;
  };
  const result = makeDiff('root', states.UNCHANGED, emptyValues, 0, differences(fullTree));
  return [result];
};

// #region output format (first version)
/*
const makeSigns = () => {
  const signs = {};
  signs[states.CREATED] = '+';
  signs[states.DELETED] = '-';
  signs[states.UNCHANGED] = ' ';
  return signs;
};

const diffToString = (sign, property, value) => {
  _.noop();
  return `  ${sign} ${property}: ${value}`;
};

const formatAsText = (diffs) => {
  const signs = makeSigns();

  const diffStrings = diffs.reduce((acc, diff) => {
    const {
      value1, value2, state, property,
    } = diff;
    if (state === states.CREATED || state === states.UNCHANGED) {
      const sign = signs[state];
      acc.push(diffToString(sign, property, value2));
    }
    if (state === states.DELETED || state === states.CHANGED) {
      const sign = signs[states.DELETED];
      acc.push(diffToString(sign, property, value1));
    }
    if (state === states.CHANGED) {
      const sign = signs[states.CREATED];
      acc.push(diffToString(sign, property, value2));
    }
    return acc;
  }, []);

  return ['{', ...diffStrings, '}'].join('\n');
};
*/
// #endregion
const defaultOptions = {
  format: 'stylish',
};

const formatDiffs = (diffs, options) => {
  _.noop(options);
  // console.dir(diffs, { depth: null });
  const result = formatStylish(diffs);

  return result;
};

const genDiff = (filepath1, filepath2, options) => {
  if (filepath1 === undefined) throw new Error("error: missing required argument 'filepath1'");
  if (filepath2 === undefined) throw new Error("error: missing required argument 'filepath2'");
  const actualOptions = { ...defaultOptions, ...options };
  const obj1 = getObject(filepath1);
  const obj2 = getObject(filepath2);
  const diffs = makeDiffs(obj1, obj2);
  return formatDiffs(diffs, actualOptions);
};

export const genDiffToConsole = (filepath1, filepath2, options) => {
  const formatedDiffs = genDiff(filepath1, filepath2, options);
  // console.log('--------------------------------');
  console.log(formatedDiffs);
};

// genDiff('__fixtures__/file1.json', '__fixtures__/file2.json');
export default genDiff;

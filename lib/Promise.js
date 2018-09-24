const _ = require('lodash');
const Promise = require('prfun');

Promise.each = (array, fn) => {
  return _.reduce(
    array,
    (chain, value, i) => {
      return chain.then(() => fn(value, i));
    },
    Promise.resolve()
  );
};

Promise.fcall = fn => {
  const fnResult = fn();
  if (fnResult && _.isFunction(fnResult.then)) {
    return fnResult;
  }
  return Promise.resolve().then(fnResult);
};

Promise.byPage = async (fn, { totalPages, totalCount, pageSize, _debug }) => {
  const debugIntro = `${_debug === true ? '' : `[${_debug}] `}Promise#byPage –`;

  if (_.isUndefined(totalPages)) {
    if (!totalCount || !pageSize) {
      throw new Error('Promise#byPage – rather ( totalPages ) or ( totalCount and pageSize ) should be set.');
    }

    totalPages = Math.floor((totalCount - 1) / pageSize) + 1;
  }

  const continueLoop = async pageIndex => {
    if (_debug) {
      console.log(`${debugIntro} executing page ${pageIndex + 1} of ${totalPages}`);
    }

    await fn({ pageIndex });

    if (pageIndex < totalPages - 1) {
      return continueLoop(pageIndex + 1);
    }
  };

  try {
    await continueLoop(0);
  } catch (err) {
    console.error(`${debugIntro} error`, err);
    throw err;
  }
};

module.exports = Promise;
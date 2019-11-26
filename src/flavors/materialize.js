import Promise from 'bluebird';

import {
  printStartPipeline, printEndPipeline, debug,
  faulty, faultyAsync,
  update,
} from '../utils';

import { filterOnEventType, filterOnContent } from '../filters';

export const materialize = (rule) => (s) => s // eslint-disable-line import/prefer-default-export
  .filter(onEventType(rule))
  .tap(printStartPipeline(rule.id))

  .filter(onContent(rule))

  .map(toUpdateRequest(rule))
  .parallel(rule.parallel || Number(process.env.PARALLEL) || 4)

  .map(updateEntity(rule))
  .parallel(rule.parallel || Number(process.env.PARALLEL) || 4)

  .tap(printEndPipeline(rule.id));

const onEventType = (rule) => faulty((uow) => filterOnEventType(rule, uow));
const onContent = (rule) => faulty((uow) => filterOnContent(rule, uow));

const toUpdateRequest = (rule) => faultyAsync((uow) =>
  Promise.resolve(rule.toUpdateRequest(uow, rule))
    .then((updateRequest) => ({
      ...uow,
      updateRequest,
    })));

const updateEntity = (rule) =>
  update(debug(rule.id), rule.tableName || process.env.ENTITY_TABLE_NAME);
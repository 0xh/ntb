'use strict';

const harvest = require('./harvest');


const findByName = async (session, type, name) => {
  const label = type === 'county' ? 'County' : 'Municipality';
  const query = [
    `MATCH (n:${label} {name_lowercase:$name})`,
    'RETURN n {.name, .uuid, .code, .status}',
  ].join('\n');

  const result = await session.run(query, { name: name.toLowerCase() });
  if (!result.records.length) {
    return null;
  }

  return result.records.map((r) => r.get(0));
};


const all = async (session, type) => {
  const label = type === 'counties' ? 'County' : 'Municipality';
  const query = [
    `MATCH (n:${label})`,
    'RETURN n {.name, .uuid, .code, .status}',
  ].join('\n');

  const result = await session.run(query);
  if (!result.records.length) {
    return null;
  }

  return result.records.map((r) => r.get(0));
};


module.exports = {
  harvest,
  counties: {
    findByName: (session, name) => findByName(session, 'county', name),
    all: (session) => all(session, 'counties'),
  },
  municipalities: {
    findByName: (session, name) => findByName(session, 'municipality', name),
    all: (session) => all(session, 'municipalities'),
  },
};

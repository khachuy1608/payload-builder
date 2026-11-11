import * as migration_20261111_025529_initial from './20261111_025529_initial';

export const migrations = [
  {
    up: migration_20261111_025529_initial.up,
    down: migration_20261111_025529_initial.down,
    name: '20261111_025529_initial'
  },
];

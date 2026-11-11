import * as migration_20261111_025529_initial from './20261111_025529_initial';
import * as migration_20261111_044006_my_blocks from './20261111_044006_my_blocks';
import * as migration_20261111_050633_themes from './20261111_050633_themes';

export const migrations = [
  {
    up: migration_20261111_025529_initial.up,
    down: migration_20261111_025529_initial.down,
    name: '20261111_025529_initial',
  },
  {
    up: migration_20261111_044006_my_blocks.up,
    down: migration_20261111_044006_my_blocks.down,
    name: '20261111_044006_my_blocks',
  },
  {
    up: migration_20261111_050633_themes.up,
    down: migration_20261111_050633_themes.down,
    name: '20261111_050633_themes'
  },
];

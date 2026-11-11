import * as migration_20261111_025529_initial from './20261111_025529_initial';
import * as migration_20261111_044006_my_blocks from './20261111_044006_my_blocks';
import * as migration_20261111_050633_themes from './20261111_050633_themes';
import * as migration_20261111_075937_form_submissions from './20261111_075937_form_submissions';
import * as migration_20261111_084335_users_profile from './20261111_084335_users_profile';

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
    name: '20261111_050633_themes',
  },
  {
    up: migration_20261111_075937_form_submissions.up,
    down: migration_20261111_075937_form_submissions.down,
    name: '20261111_075937_form_submissions',
  },
  {
    up: migration_20261111_084335_users_profile.up,
    down: migration_20261111_084335_users_profile.down,
    name: '20261111_084335_users_profile'
  },
];

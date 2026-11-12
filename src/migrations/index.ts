import * as migration_20261111_025529_initial from './20261111_025529_initial';
import * as migration_20261111_044006_my_blocks from './20261111_044006_my_blocks';
import * as migration_20261111_050633_themes from './20261111_050633_themes';
import * as migration_20261111_075937_form_submissions from './20261111_075937_form_submissions';
import * as migration_20261111_084335_users_profile from './20261111_084335_users_profile';
import * as migration_20261111_085618_page_template from './20261111_085618_page_template';
import * as migration_20261111_103251_style_presets from './20261111_103251_style_presets';
import * as migration_20261111_132429_seo_redirects from './20261111_132429_seo_redirects';
import * as migration_20261111_134538_phase2_layout from './20261111_134538_phase2_layout';
import * as migration_20261111_135634_phase2_versions from './20261111_135634_phase2_versions';
import * as migration_20261111_140719_phase2_roles_comments from './20261111_140719_phase2_roles_comments';
import * as migration_20261111_141528_phase2_tokens from './20261111_141528_phase2_tokens';
import * as migration_20261111_143107_phase3_content from './20261111_143107_phase3_content';
import * as migration_20261111_144735_phase4_i18n from './20261111_144735_phase4_i18n';
import * as migration_20261111_150000_phase5_theme_contrast from './20261111_150000_phase5_theme_contrast';
import * as migration_20261111_152607_phase6_form_uploads from './20261111_152607_phase6_form_uploads';
import * as migration_20261112_105024_comment_anchor from './20261112_105024_comment_anchor';
import * as migration_20261112_150810_comment_mentions from './20261112_150810_comment_mentions';

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
    name: '20261111_084335_users_profile',
  },
  {
    up: migration_20261111_085618_page_template.up,
    down: migration_20261111_085618_page_template.down,
    name: '20261111_085618_page_template',
  },
  {
    up: migration_20261111_103251_style_presets.up,
    down: migration_20261111_103251_style_presets.down,
    name: '20261111_103251_style_presets',
  },
  {
    up: migration_20261111_132429_seo_redirects.up,
    down: migration_20261111_132429_seo_redirects.down,
    name: '20261111_132429_seo_redirects',
  },
  {
    up: migration_20261111_134538_phase2_layout.up,
    down: migration_20261111_134538_phase2_layout.down,
    name: '20261111_134538_phase2_layout',
  },
  {
    up: migration_20261111_135634_phase2_versions.up,
    down: migration_20261111_135634_phase2_versions.down,
    name: '20261111_135634_phase2_versions',
  },
  {
    up: migration_20261111_140719_phase2_roles_comments.up,
    down: migration_20261111_140719_phase2_roles_comments.down,
    name: '20261111_140719_phase2_roles_comments',
  },
  {
    up: migration_20261111_141528_phase2_tokens.up,
    down: migration_20261111_141528_phase2_tokens.down,
    name: '20261111_141528_phase2_tokens',
  },
  {
    up: migration_20261111_143107_phase3_content.up,
    down: migration_20261111_143107_phase3_content.down,
    name: '20261111_143107_phase3_content',
  },
  {
    up: migration_20261111_144735_phase4_i18n.up,
    down: migration_20261111_144735_phase4_i18n.down,
    name: '20261111_144735_phase4_i18n',
  },
  {
    up: migration_20261111_150000_phase5_theme_contrast.up,
    down: migration_20261111_150000_phase5_theme_contrast.down,
    name: '20261111_150000_phase5_theme_contrast',
  },
  {
    up: migration_20261111_152607_phase6_form_uploads.up,
    down: migration_20261111_152607_phase6_form_uploads.down,
    name: '20261111_152607_phase6_form_uploads',
  },
  {
    up: migration_20261112_105024_comment_anchor.up,
    down: migration_20261112_105024_comment_anchor.down,
    name: '20261112_105024_comment_anchor',
  },
  {
    up: migration_20261112_150810_comment_mentions.up,
    down: migration_20261112_150810_comment_mentions.down,
    name: '20261112_150810_comment_mentions'
  },
];

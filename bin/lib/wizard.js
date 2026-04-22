'use strict';

/**
 * Interactive installation wizard using @inquirer/prompts.
 *
 * Guides the user through target, profile, and confirmation steps,
 * then returns a normalized install intent object.
 */

const { select, confirm, checkbox } = require('@inquirer/prompts');
const ui = require('./ui');
const { buildProfileChoices, buildTargetChoices } = require('./install-surface');

const TARGET_CHOICES = buildTargetChoices();
const PROFILE_CHOICES = buildProfileChoices();

const ALL_EXTRA_COMPONENT_IDS = [
  'lang:typescript',
  'lang:python',
  'lang:java',
  'lang:go',
  'lang:rust',
  'lang:kotlin',
  'lang:swift',
  'lang:cpp',
  'capability:security',
  'skill:tdd-workflow',
  'skill:frontend-patterns',
  'capability:devops',
];

const SELECT_ALL_SENTINEL = '__SELECT_ALL__';

const EXTRA_COMPONENT_CHOICES = [
  { name: '★  Select all components', value: SELECT_ALL_SENTINEL },
  ...ALL_EXTRA_COMPONENT_IDS.map(id => ({ name: id, value: id })),
];

/**
 * Run the interactive wizard.
 * @returns {Promise<{target: string, profileId: string, includeComponentIds: string[]}>}
 */
async function runWizard() {
  ui.banner();

  // Step 1 — target platform
  ui.step(1, 'Choose your AI coding platform:');
  console.log();
  const target = await select({
    message: 'Target platform',
    choices: TARGET_CHOICES,
    default: 'claude',
  });

  console.log();

  // Step 2 — install profile
  ui.step(2, 'Choose an install profile:');
  console.log();
  const profileId = await select({
    message: 'Install profile',
    choices: PROFILE_CHOICES,
    default: 'team',
  });

  console.log();

  // Step 3 — optional extra components
  ui.step(3, 'Add extra language / capability components? (optional)');
  console.log();
  const wantExtras = await confirm({
    message: 'Add extra components on top of the profile?',
    default: false,
  });

  let includeComponentIds = [];
  if (wantExtras) {
    console.log();
    const rawSelection = await checkbox({
      message: 'Select additional components (★ to install all)',
      choices: EXTRA_COMPONENT_CHOICES,
    });
    includeComponentIds = rawSelection.includes(SELECT_ALL_SENTINEL)
      ? ALL_EXTRA_COMPONENT_IDS
      : rawSelection;
  }

  console.log();

  // Step 4 — confirm
  ui.separator();
  console.log(`  ${ui.bold('Review your selections:')}`);
  console.log(`  Target:     ${ui.cyan(target)}`);
  console.log(`  Profile:    ${ui.cyan(profileId)}`);
  if (includeComponentIds.length > 0) {
    console.log(`  Extras:     ${ui.cyan(includeComponentIds.join(', '))}`);
  }
  ui.separator();
  console.log();

  const proceed = await confirm({
    message: 'Proceed with installation?',
    default: true,
  });

  if (!proceed) {
    ui.warn('Installation cancelled.');
    process.exit(0);
  }

  return { target, profileId, includeComponentIds };
}

module.exports = { runWizard };

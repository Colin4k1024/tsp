const { createInstallTargetAdapter } = require('./helpers');

module.exports = createInstallTargetAdapter({
  id: 'copilot-home',
  target: 'copilot',
  kind: 'home',
  rootSegments: ['.github'],
  installStatePathSegments: ['ecc-install-state.json'],
  nativeRootRelativePath: '.github/copilot-instructions.md',
});

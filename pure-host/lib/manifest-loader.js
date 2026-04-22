/**
 * Manifest loader — reads manifest.yaml / manifest.json from a given directory.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ManifestLoader {
  /**
   * Load manifest from a directory.
   * @param {string} dir
   * @returns {{ tasks: object[], model: string, name: string }}
   */
  load(dir) {
    const manifestPath = this._findManifest(dir);
    if (!manifestPath) {
      throw new Error(`No manifest found in ${dir} (checked manifest.yaml, manifest.yml, manifest.json)`);
    }
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest =
      path.extname(manifestPath) === '.json'
        ? JSON.parse(content)
        : yaml.load(content);

    if (!manifest.tasks || !Array.isArray(manifest.tasks)) {
      throw new Error('Manifest must contain a "tasks" array');
    }
    manifest._sourceDir = dir;
    manifest._manifestPath = manifestPath;
    return manifest;
  }

  /**
   * @param {string} dir
   * @returns {string|null}
   */
  _findManifest(dir) {
    for (const name of ['manifest.yaml', 'manifest.yml', 'manifest.json']) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
}

module.exports = { ManifestLoader };

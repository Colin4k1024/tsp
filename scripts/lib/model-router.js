'use strict';

const fs = require('fs');
const path = require('path');

let cachedProfiles = null;

function loadProfiles(pluginRoot) {
  if (cachedProfiles) return cachedProfiles;
  const manifestPath = path.join(
    pluginRoot || path.resolve(__dirname, '..', '..'),
    'manifests', 'model-profiles.json'
  );
  try {
    cachedProfiles = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    cachedProfiles = null;
  }
  return cachedProfiles;
}

function classifyTask(text, profiles) {
  if (!text || !profiles?.['task-type-detection']?.signals) return null;

  const signals = profiles['task-type-detection'].signals;
  const lowerText = text.toLowerCase();
  const scores = {};

  for (const [taskType, keywords] of Object.entries(signals)) {
    let hits = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) hits++;
    }
    if (hits > 0) scores[taskType] = hits;
  }

  if (Object.keys(scores).length === 0) return null;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestType, bestHits] = sorted[0];
  const confidence = bestHits >= 3 ? 'high' : bestHits >= 2 ? 'medium' : 'low';

  return { taskType: bestType, confidence };
}

function getRecommendedModel(taskType, profileName, profiles) {
  const profile = profiles?.profiles?.[profileName];
  if (!profile?.routing?.[taskType]) return null;
  return profile.routing[taskType];
}

module.exports = { loadProfiles, classifyTask, getRecommendedModel };

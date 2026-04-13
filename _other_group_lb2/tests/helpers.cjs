const fs = require('fs');
const path = require('path');

const DEFAULT_TARGETS = [
  process.env.OTHER_GROUP_ROOT,
  '/Users/tahssin-val/Downloads/lb2-applikation-main',
  path.resolve(__dirname, '..', '..', 'lb2-app'),
].filter(Boolean);

function resolveTarget(candidate) {
  const resolved = path.resolve(candidate);

  if (fs.existsSync(path.join(resolved, 'todo-list-node', 'app.js'))) {
    return {
      submissionRoot: resolved,
      appRoot: path.join(resolved, 'todo-list-node'),
    };
  }

  if (fs.existsSync(path.join(resolved, 'app.js'))) {
    const parent = path.dirname(resolved);
    const submissionRoot = fs.existsSync(path.join(parent, 'docker')) ? parent : resolved;
    return {
      submissionRoot,
      appRoot: resolved,
    };
  }

  return null;
}

function findTarget() {
  for (const candidate of DEFAULT_TARGETS) {
    const match = resolveTarget(candidate);
    if (match) return match;
  }

  throw new Error(
    `Could not find the other group submission. Checked: ${DEFAULT_TARGETS.join(', ')}. ` +
      'Set OTHER_GROUP_ROOT to the submission root or directly to the todo-list-node folder.'
  );
}

const { submissionRoot: OTHER_GROUP_SUBMISSION_ROOT, appRoot: OTHER_GROUP_ROOT } = findTarget();

function otherGroupRoot(...parts) {
  if (parts[0] === 'todo-list-node') {
    return path.join(OTHER_GROUP_ROOT, ...parts.slice(1));
  }

  if (parts[0] === 'docker') {
    return path.join(OTHER_GROUP_SUBMISSION_ROOT, ...parts);
  }

  return path.join(OTHER_GROUP_SUBMISSION_ROOT, ...parts);
}

function requireOtherGroup(modulePath) {
  return require(path.join(OTHER_GROUP_ROOT, modulePath));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = {
  OTHER_GROUP_ROOT,
  OTHER_GROUP_SUBMISSION_ROOT,
  otherGroupRoot,
  requireOtherGroup,
  readText,
  exists,
};

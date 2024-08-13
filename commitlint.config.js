module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Ignores commit messages that start with 'chore(release):'.
  // This prevents commit messages related to automated version releases
  // from being validated against the commit message conventions.
  ignores: [(message) => /^chore\(release\):/.test(message)],
};

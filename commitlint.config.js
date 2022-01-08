module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'always', 'sentence-case'],
    'type-enum': [2, 'always', ['feat', 'fix', 'hot_fix', 'docs', 'style', 'refactor', 'test', 'chore', 'wording']],
  },
};
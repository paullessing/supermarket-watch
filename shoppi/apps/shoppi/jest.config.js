module.exports = {
  name: 'shoppi',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/shoppi',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};

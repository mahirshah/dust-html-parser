const { expect } = require('chai');
const { isReference } = require('./dustHelpers');

describe('Test isReference', () => {
  const passingCases = [
    '{a}',
    '{.}',
    '{.a}',
    '{a.a}',
    '{a.a}',
    '{a[0]}',
    '{a[.]}',
    '{a[.a[.]]}',
    '{a[0][a[1][a[0]][0]]}',
    '{.ab[ab[.[0][0][0]].a]}',
    '{[0]}',
    '{..a}',
    '{..a.a}',
    '{_[0]}',
    '{[.a-a[.]]}',
    '{a[.a[.]]}',
    '{in_seah_lel}'
  ];

  const failingCases = [
    '',
    '{',
    '{a',
    '}',
    '{}',
    '{[[}',
    '{[0]]}',
    '{[[0]}',
    '{..}',
    '{..a.}',
    '{a[0[0]]}',
    '{0}',
    '{[]}',
    '{0a}',
    '{...a.a}',
    '{[[0]]}',
    '{*[.a[.]]}',
    '{a[a.]}',
    '{a.}',
    '{..[0]}',
    '{a[.0]}',
    '{a[a]a}'
  ];

  passingCases.forEach(string =>
    it(`true for ${string}`, () => {
      expect(isReference(string)).to.be.true;
    })
  );

  failingCases.forEach(string =>
    it(`false for ${string}`, () => {
      expect(isReference(string)).to.be.false;
    })
  );
});

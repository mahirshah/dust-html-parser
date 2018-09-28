import { isReference } from '../../src/utils/dustHelpers';
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
  '{i_seah_lel}',
  '{a|filter1|filter2}',
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
  '{a[a]a}',
];

describe('isReference', () => {
  test.each(passingCases)('Valid isReference: %p', (validCase) => {
    expect(isReference(validCase)).toBeTruthy();
  });

  test.each(failingCases)('Invalid isReference: %p', (invalidCase) => {
    expect(isReference(invalidCase)).toBeFalsy();
  });
});

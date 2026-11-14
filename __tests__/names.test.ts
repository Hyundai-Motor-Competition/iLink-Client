import { givenName, shortName } from '../src/shared/utils/names';

test('흔한 성씨로 시작하는 세 글자 이름만 성을 뗀다', () => {
  expect(givenName('김민지')).toBe('민지');
  expect(givenName('테스트')).toBe('테스트');
  expect(givenName('테스트2')).toBe('테스트2');
  expect(givenName('민지')).toBe('민지');
  expect(givenName('Mom')).toBe('Mom');
});

test('사진 자리 이름', () => {
  expect(shortName('김민지')).toBe('민지');
  expect(shortName('테스트')).toBe('테스트');
  expect(shortName('남궁하늘이')).toBe('늘이');
});

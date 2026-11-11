import type { SessionView } from '../src/api/types';
import {
  isStalePush,
  mergeSessionView,
  resolveChildScreen,
} from '../src/domain/session';

const CHILD = 7;

function view(patch: Partial<SessionView> = {}): SessionView {
  return {
    sessionId: 1,
    stateVersion: 5,
    status: {
      session: 'ACTIVE',
      vehicle: 'APPROACHING',
      call: 'NONE',
      spot: 'CONFIRMED',
    },
    spot: { spotId: 10, name: '정문 앞', spotVersion: 2, locked: false },
    children: [{ childUserId: CHILD, name: '아이', phase: 'WAITING' }],
    ...patch,
  };
}

describe('mergeSessionView', () => {
  it('낮은 stateVersion 응답은 무시한다 (F4-04)', () => {
    const prev = view({ stateVersion: 5 });
    expect(mergeSessionView(prev, view({ stateVersion: 4 }))).toBe(prev);
  });

  it('종료된 세션은 늦은 이벤트로 되돌아가지 않는다 (QA-18)', () => {
    const done = view({ stateVersion: 9, status: { session: 'COMPLETED' } });
    expect(mergeSessionView(done, view({ stateVersion: 10 }))).toBe(done);
  });

  it('다른 세션이면 새 값으로 바꾼다', () => {
    const next = view({ sessionId: 2, stateVersion: 1 });
    expect(mergeSessionView(view(), next)).toBe(next);
  });
});

describe('isStalePush', () => {
  it('spotVersion이 낮은 푸시는 만료로 본다 (QA-21)', () => {
    expect(isStalePush({ sessionId: 1, spotVersion: 1 }, view())).toBe(true);
    expect(isStalePush({ sessionId: 1, spotVersion: 2 }, view())).toBe(false);
  });
});

describe('resolveChildScreen', () => {
  const none = { prepNoticeReceived: false };

  it('기본은 실내 대기 C01', () => {
    expect(resolveChildScreen(view(), CHILD, none)).toBe('C01');
  });

  it('준비 알림을 받으면 C02', () => {
    expect(
      resolveChildScreen(view(), CHILD, { prepNoticeReceived: true }),
    ).toBe('C02');
  });

  it('호출되면 C03', () => {
    const v = view({ children: [{ childUserId: CHILD, phase: 'CALLED' }] });
    expect(resolveChildScreen(v, CHILD, none)).toBe('C03');
  });

  it('호출 철회 시 C04 (ERR-12·13)', () => {
    const v = view({
      status: { session: 'ACTIVE', call: 'REVOKED', spot: 'CONFIRMED' },
      children: [{ childUserId: CHILD, phase: 'CALLED' }],
    });
    expect(resolveChildScreen(v, CHILD, none)).toBe('C04');
  });

  it('보류 중이면 C04', () => {
    expect(
      resolveChildScreen(view({ status: { session: 'ON_HOLD' } }), CHILD, none),
    ).toBe('C04');
  });

  it('완료면 C05, 탑승하지 않은 자녀는 C04', () => {
    expect(
      resolveChildScreen(
        view({ status: { session: 'COMPLETED' } }),
        CHILD,
        none,
      ),
    ).toBe('C05');
    const notBoarded = view({
      status: { session: 'COMPLETED' },
      children: [{ childUserId: CHILD, phase: 'NOT_BOARDED' }],
    });
    expect(resolveChildScreen(notBoarded, CHILD, none)).toBe('C04');
  });
});

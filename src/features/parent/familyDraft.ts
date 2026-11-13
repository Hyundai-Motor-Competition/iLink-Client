import type { ImageSourcePropType } from 'react-native';
import { create } from 'zustand';
import type { LinkInfo } from './data';

/** 가족 프로필 등록 중 입력한 값. 초대장 전송 뒤 픽업 일정 등록 2 화면에서 자녀 이름·사진을 쓴다. */
type FamilyDraft = {
  guardianAlias: string;
  guardianPhoto: ImageSourcePropType | null;
  childName: string;
  childPhoto: ImageSourcePropType | null;
  /** 초대장을 보낸 뒤 일정 등록으로 넘어왔는지 (픽업 일정 등록 1을 건너뛴다) */
  invited: boolean;
  /** 서버에 등록한 자녀 userId (FAM-02) */
  childId?: number;
  /** 초대 링크 (FAM-04) */
  inviteUrl?: string;
  /** 차량 연결 코드 확인 결과 (LINK-03) */
  link?: LinkInfo;
  /** 약관 화면에서 고른 동의 */
  consents?: { location: boolean; push: boolean; improve: boolean };
  setGuardianAlias(v: string): void;
  setGuardianPhoto(v: ImageSourcePropType | null): void;
  setChildName(v: string): void;
  setChildPhoto(v: ImageSourcePropType | null): void;
  setInvited(v: boolean): void;
  patch(p: Partial<FamilyDraft>): void;
};

export const useFamilyDraft = create<FamilyDraft>(set => ({
  guardianAlias: '',
  guardianPhoto: null,
  childName: '',
  childPhoto: null,
  invited: false,
  setGuardianAlias: guardianAlias => set({ guardianAlias }),
  setGuardianPhoto: guardianPhoto => set({ guardianPhoto }),
  setChildName: childName => set({ childName }),
  setChildPhoto: childPhoto => set({ childPhoto }),
  setInvited: invited => set({ invited }),
  patch: p => set(p),
}));

/** "김현지" → "현지". 두 글자 이하 한글 이름이나 영문은 그대로 */
export function givenName(full: string) {
  const name = full.trim();
  return /^[가-힣]{3,4}$/.test(name) ? name.slice(1) : name;
}

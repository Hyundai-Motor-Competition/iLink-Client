import type { ImageSourcePropType } from 'react-native';
import { childrenOf, useFamily, useServerMode } from './data';
import { DEFAULT_CHILD_PHOTO, useFamilyDraft } from './familyDraft';
import { mock } from './mock';

const photos: Record<number, ImageSourcePropType> = {
  1: require('../../assets/images/schedule/child_hyunwoo.png'),
  2: require('../../assets/images/schedule/child_hyunji.png'),
};

export type Child = (typeof mock.children)[number];

export const getChild = (id: number): Child =>
  mock.children.find(c => c.id === id) ?? mock.children[0];

export const childPhoto = (id: number) => photos[id];

/** 화면에 보여 줄 자녀 (서버 모드면 FAM-01 가족 구성원, 아니면 목업) */
export type ChildView = {
  id: number;
  name: string;
  meta: string;
  photo?: ImageSourcePropType | null;
};

const DEVICE: Record<string, string> = {
  CONNECTED: '앱 연결됨',
  INVITE_PENDING: '초대 수락 대기',
  INVITE_EXPIRED: '초대 만료',
  NONE: '초대 전',
};

/** 이름이 같은 목업 아이 사진이나, 가족 프로필에서 고른 사진을 쓴다. 없으면 기본 이미지 */
export function photoFor(name: string): ImageSourcePropType | null {
  const draft = useFamilyDraft.getState();
  if (draft.childPhoto && draft.childName.trim() === name) {
    return draft.childPhoto;
  }
  const m = mock.children.find(c => c.name === name);
  return m ? photos[m.id] : DEFAULT_CHILD_PHOTO;
}

export function useChildren(): { list: ChildView[]; loading: boolean } {
  const server = useServerMode();
  const family = useFamily();
  if (!server) {
    return {
      loading: false,
      list: mock.children.map(c => ({
        id: c.id,
        name: c.name,
        meta: c.grade,
        photo: photos[c.id],
      })),
    };
  }
  return {
    loading: family.isLoading,
    list: childrenOf(family.data).map(c => {
      const m = mock.children.find(x => x.name === c.name);
      return {
        id: c.id,
        name: c.name,
        meta: m?.grade ?? DEVICE[c.status ?? 'NONE'] ?? '',
        photo: photoFor(c.name),
      };
    }),
  };
}

import type { ImageSourcePropType } from 'react-native';
import { mock } from './mock';

const photos: Record<number, ImageSourcePropType> = {
  1: require('../../assets/images/schedule/child_hyunwoo.png'),
  2: require('../../assets/images/schedule/child_hyunji.png'),
};

export type Child = (typeof mock.children)[number];

export const getChild = (id: number): Child =>
  mock.children.find(c => c.id === id) ?? mock.children[0];

export const childPhoto = (id: number) => photos[id];

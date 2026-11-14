import { create } from 'zustand';

/** 자녀 화면 상태 중 서버에 없는 것: 초대 수락 직후 한 번 띄우는 '연결 완료' 팝업 */
type ChildUi = {
  dialog: 'faces' | 'hands' | null;
  showConnected(variant?: 'faces' | 'hands'): void;
  closeDialog(): void;
};

export const useChildUi = create<ChildUi>(set => ({
  dialog: null,
  showConnected: (variant = 'faces') => set({ dialog: variant }),
  closeDialog: () => set({ dialog: null }),
}));

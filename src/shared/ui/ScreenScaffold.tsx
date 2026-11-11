import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, spacing } from '../theme/tokens';

type Props = PropsWithChildren<{
  screenId: string;
  title: string;
  note?: string;
}>;

/** 화면 구현 전 자리표시. 화면 ID를 함께 노출해 기획서와 대조하기 쉽게 한다. */
export function ScreenScaffold({ screenId, title, note, children }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.id}>{screenId}</Text>
        <Text style={styles.title}>{title}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg, gap: spacing.sm },
  id: { color: colors.subText, fontSize: font.caption },
  title: { color: colors.text, fontSize: font.title, fontWeight: '700' },
  note: { color: colors.subText, fontSize: font.body },
});

import React from 'react';
import {
  Text, TextInput, TouchableOpacity, View, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, estadoColor, estadoLabel } from '../lib/theme';

export function Button({ title, onPress, loading, color = colors.primary, disabled, outline }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        outline
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color }
          : { backgroundColor: color },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? color : '#fff'} />
      ) : (
        <Text style={[styles.btnText, outline && { color }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Badge({ estado }) {
  return (
    <View style={[styles.badge, { backgroundColor: estadoColor[estado] + '22', borderColor: estadoColor[estado] }]}>
      <Text style={[styles.badgeText, { color: estadoColor[estado] }]}>
        {estadoLabel[estado] ?? estado}
      </Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Stars({ value = 0, onChange, size = 30 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} onPress={() => onChange?.(n)}
          style={{ fontSize: size, opacity: n <= value ? 1 : 0.3 }}>⭐</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  label: { color: colors.textMuted, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
});

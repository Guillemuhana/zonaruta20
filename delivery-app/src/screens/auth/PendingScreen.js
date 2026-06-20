import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function PendingScreen() {
  const { signOut, refreshProfile, profile } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.c}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.title}>Cuenta pendiente</Text>
        <Text style={styles.text}>
          Hola {profile?.nombre || ''}. Tu cuenta de{' '}
          {profile?.rol === 'negocio' ? 'negocio' : 'delivery'} está esperando que el
          administrador la apruebe. Te avisaremos cuando puedas empezar.
        </Text>
        <Button title="Actualizar estado" onPress={refreshProfile} />
        <Button title="Cerrar sesión" outline color={colors.danger} onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  c: { flex: 1, padding: 28, justifyContent: 'center' },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginVertical: 12 },
  text: { color: colors.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 28 },
});

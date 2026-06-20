import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui';
import { colors } from '../../lib/theme';

const NIVELES = [
  { nombre: 'Inicial', min: 0, color: '#94A3B8' },
  { nombre: 'Bronce', min: 50, color: '#CD7F32' },
  { nombre: 'Plata', min: 200, color: '#C0C0C0' },
  { nombre: 'Oro', min: 500, color: '#FFD700' },
  { nombre: 'Diamante', min: 1000, color: '#67E8F9' },
];

function nivelDe(puntos) {
  let actual = NIVELES[0], siguiente = null;
  for (let i = 0; i < NIVELES.length; i++) {
    if (puntos >= NIVELES[i].min) { actual = NIVELES[i]; siguiente = NIVELES[i + 1] ?? null; }
  }
  return { actual, siguiente };
}

export default function DeliveryPerfil() {
  const { profile, refreshProfile } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [yo, setYo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await refreshProfile();
    const { data } = await supabase.from('ranking').select('*').order('posicion');
    setRanking(data ?? []);
    setYo((data ?? []).find((r) => r.id === profile.id) ?? null);
  }, [profile.id]);

  useEffect(() => { load(); }, []);

  const puntos = yo?.puntos ?? profile.puntos ?? 0;
  const { actual, siguiente } = nivelDe(puntos);
  const progreso = siguiente
    ? Math.min(1, (puntos - actual.min) / (siguiente.min - actual.min))
    : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={ranking}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Card style={{ borderColor: actual.color, borderWidth: 2 }}>
              <Text style={styles.nombre}>{profile.nombre}</Text>
              <Text style={[styles.nivel, { color: actual.color }]}>● Nivel {actual.nombre}</Text>
              <Text style={styles.puntos}>{puntos} pts</Text>

              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${progreso * 100}%`, backgroundColor: actual.color }]} />
              </View>
              <Text style={styles.next}>
                {siguiente
                  ? `${siguiente.min - puntos} pts para ${siguiente.nombre}`
                  : '¡Nivel máximo alcanzado! 💎'}
              </Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{yo?.entregas_totales ?? 0}</Text>
                  <Text style={styles.statLbl}>Entregas</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>⭐ {yo?.calificacion_promedio ?? '—'}</Text>
                  <Text style={styles.statLbl}>Calificación</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>#{yo?.posicion ?? '—'}</Text>
                  <Text style={styles.statLbl}>Ranking</Text>
                </View>
              </View>
            </Card>
            <Text style={styles.section}>🏆 Tabla de posiciones</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.rankRow, item.id === profile.id && styles.rankMe]}>
            <Text style={styles.pos}>#{item.posicion}</Text>
            <Text style={styles.rankName}>{item.nombre}</Text>
            <Text style={styles.rankPts}>{item.puntos} pts</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  nombre: { color: colors.text, fontSize: 22, fontWeight: '800' },
  nivel: { fontWeight: '700', marginTop: 2 },
  puntos: { color: colors.text, fontSize: 40, fontWeight: '900', marginVertical: 6 },
  barBg: { height: 10, backgroundColor: colors.surfaceAlt, borderRadius: 6, overflow: 'hidden', marginTop: 4 },
  barFill: { height: 10, borderRadius: 6 },
  next: { color: colors.textMuted, marginTop: 6, fontSize: 13 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  stat: { alignItems: 'center' },
  statNum: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLbl: { color: colors.textMuted, fontSize: 12 },
  section: { color: colors.text, fontWeight: '700', fontSize: 16, marginVertical: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  rankMe: { borderColor: colors.primary },
  pos: { color: colors.textMuted, fontWeight: '800', width: 44 },
  rankName: { color: colors.text, flex: 1, fontWeight: '600' },
  rankPts: { color: colors.primary, fontWeight: '700' },
});

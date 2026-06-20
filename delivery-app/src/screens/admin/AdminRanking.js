import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';

export default function AdminRanking() {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('ranking').select('*').order('posicion');
    setRows(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const medalla = (p) => (p === 1 ? '🥇' : p === 2 ? '🥈' : p === 3 ? '🥉' : `#${p}`);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>🏆 Ranking de deliverys</Text>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin deliverys todavía.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.pos}>{medalla(item.posicion)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.nombre}</Text>
              <Text style={styles.meta}>
                {item.nivel} · {item.entregas_totales} entregas · ⭐ {item.calificacion_promedio ?? '—'}
              </Text>
            </View>
            <Text style={styles.pts}>{item.puntos} pts</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  pos: { fontSize: 20, fontWeight: '800', width: 44, color: colors.text },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  pts: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});

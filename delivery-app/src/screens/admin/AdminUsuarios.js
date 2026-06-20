import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button, Card, Field } from '../../components/ui';
import { colors } from '../../lib/theme';

const TABS = [
  { key: 'pendientes', label: '⏳ Pendientes' },
  { key: 'negocio', label: '🏪 Negocios' },
  { key: 'delivery', label: '🛵 Deliverys' },
];

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('pendientes');
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles').select('*')
      .neq('rol', 'admin')
      .order('creado', { ascending: false });
    setUsers(data ?? []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'delivery', table: 'profiles' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  async function setAprobado(id, value) {
    setBusy(id);
    await supabase.from('profiles').update({ aprobado: value }).eq('id', id);
    await load();
    setBusy(null);
  }

  async function forzarOffline(id) {
    setBusy(id);
    await supabase.from('profiles').update({ disponible: false }).eq('id', id);
    await load();
    setBusy(null);
  }

  function confirmSuspender(u) {
    Alert.alert(
      'Dar de baja',
      `¿Suspender a ${u.negocio_nombre || u.nombre}? No va a poder operar hasta que lo vuelvas a aprobar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Dar de baja', style: 'destructive', onPress: () => setAprobado(u.id, false) },
      ],
    );
  }

  const pendientesCount = users.filter((u) => !u.aprobado).length;

  const visibles = useMemo(() => {
    let list = users;
    if (tab === 'pendientes') list = users.filter((u) => !u.aprobado);
    else list = users.filter((u) => u.rol === tab);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter((u) =>
        [u.nombre, u.negocio_nombre, u.telefono]
          .filter(Boolean).some((v) => v.toLowerCase().includes(term)));
    }
    return list;
  }, [users, tab, q]);

  const calif = (u) =>
    u.calif_cantidad > 0 ? (u.calif_suma / u.calif_cantidad).toFixed(1) : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Gestión de usuarios</Text>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Text key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}>
            {t.label}
            {t.key === 'pendientes' && pendientesCount > 0 ? ` (${pendientesCount})` : ''}
          </Text>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Field placeholder="Buscar por nombre o teléfono…" value={q} onChangeText={setQ} />
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No hay usuarios acá.</Text>}
        renderItem={({ item }) => {
          const esDelivery = item.rol === 'delivery';
          return (
            <Card style={!item.aprobado && { borderColor: colors.warning }}>
              <View style={styles.row}>
                <Text style={styles.nombre}>
                  {esDelivery ? '🛵 ' : '🏪 '}
                  {item.negocio_nombre || item.nombre}
                </Text>
                {item.aprobado ? (
                  esDelivery && item.disponible ? (
                    <Text style={[styles.estado, { color: '#22C55E' }]}>● Online</Text>
                  ) : (
                    <Text style={[styles.estado, { color: colors.textMuted }]}>Activo</Text>
                  )
                ) : (
                  <Text style={[styles.estado, { color: colors.warning }]}>Pendiente</Text>
                )}
              </View>

              <Text style={styles.meta}>{item.nombre} · {item.telefono || 'sin tel'}</Text>
              {!!item.negocio_direccion && <Text style={styles.meta}>📍 {item.negocio_direccion}</Text>}

              {esDelivery && (
                <View style={styles.statsRow}>
                  <Text style={styles.stat}>{item.entregas_totales || 0} entregas</Text>
                  <Text style={styles.stat}>{item.puntos || 0} pts</Text>
                  <Text style={styles.stat}>⭐ {calif(item)}</Text>
                </View>
              )}

              {item.aprobado ? (
                <View style={{ gap: 6 }}>
                  {esDelivery && item.disponible && (
                    <Button title="Forzar offline" outline color={colors.warning}
                      onPress={() => forzarOffline(item.id)} loading={busy === item.id} />
                  )}
                  <Button title="Dar de baja" outline color={colors.danger}
                    onPress={() => confirmSuspender(item)} loading={busy === item.id} />
                </View>
              ) : (
                <Button title="✓ Dar de alta" onPress={() => setAprobado(item.id, true)}
                  loading={busy === item.id} />
              )}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, padding: 16, paddingBottom: 10 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  tab: { color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, fontWeight: '600', fontSize: 12, overflow: 'hidden' },
  tabActive: { color: '#fff', backgroundColor: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nombre: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1 },
  estado: { fontWeight: '700', fontSize: 12 },
  meta: { color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 4 },
  stat: { color: colors.text, fontWeight: '600', fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});

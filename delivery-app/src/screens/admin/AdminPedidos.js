import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Badge, Card } from '../../components/ui';
import { colors } from '../../lib/theme';

const FILTROS = ['todos', 'pendiente', 'tomado', 'en_camino', 'entregado'];

export default function AdminPedidos() {
  const [orders, setOrders] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders').select('*')
      .order('creado', { ascending: false });
    setOrders(data ?? []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'delivery', table: 'orders' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  const visibles = filtro === 'todos' ? orders : orders.filter((o) => o.estado === filtro);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Pedidos</Text>
      <FlatList horizontal showsHorizontalScrollIndicator={false}
        data={FILTROS} keyExtractor={(i) => i}
        style={{ maxHeight: 44 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item }) => (
          <Text onPress={() => setFiltro(item)}
            style={[styles.chip, filtro === item && styles.chipActive]}>{item}</Text>
        )} />
      <FlatList
        data={visibles}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin pedidos.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.cliente}>{item.cliente_nombre || 'Cliente'}</Text>
              <Badge estado={item.estado} />
            </View>
            <Text style={styles.dir}>📍 {item.direccion_entrega}</Text>
            {!!item.detalle && <Text style={styles.det}>{item.detalle}</Text>}
            <Text style={styles.monto}>${Number(item.monto).toFixed(2)} · {item.metodo_pago}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, padding: 16, paddingBottom: 8 },
  chip: { color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', fontWeight: '600' },
  chipActive: { color: '#fff', backgroundColor: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cliente: { color: colors.text, fontSize: 17, fontWeight: '700' },
  dir: { color: colors.textMuted, marginBottom: 4 },
  det: { color: colors.text, marginBottom: 4 },
  monto: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});

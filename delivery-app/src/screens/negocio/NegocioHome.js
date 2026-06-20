import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase, rpc } from '../../lib/supabase';
import { Badge, Button, Card, Stars } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function NegocioHome({ navigation }) {
  const { profile, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders').select('*')
      .eq('negocio_id', profile.id)
      .order('creado', { ascending: false });
    setOrders(data ?? []);
  }, [profile.id]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('negocio-orders')
      .on('postgres_changes',
        { event: '*', schema: 'delivery', table: 'orders', filter: `negocio_id=eq.${profile.id}` },
        load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, profile.id]);

  async function cancelar(id) {
    Alert.alert('Cancelar pedido', '¿Seguro?', [
      { text: 'No' },
      { text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          await supabase.from('orders').update({ estado: 'cancelado' }).eq('id', id);
          load();
        } },
    ]);
  }

  async function calificar(id, estrellas) {
    const { error } = await rpc('calificar_entrega', { p_order_id: id, p_estrellas: estrellas });
    if (error) return Alert.alert('Ups', error.message);
    load();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>{profile.negocio_nombre || profile.nombre}</Text>
          <Text style={styles.sub}>Mis pedidos</Text>
        </View>
        <TouchableOpacity onPress={signOut}><Text style={styles.logout}>Salir</Text></TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Button title="+ Nuevo pedido" onPress={() => navigation.navigate('NuevoPedido')} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Aún no cargaste pedidos.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.cliente}>{item.cliente_nombre || 'Cliente'}</Text>
              <Badge estado={item.estado} />
            </View>
            <Text style={styles.dir}>📍 {item.direccion_entrega}</Text>
            {!!item.detalle && <Text style={styles.det}>{item.detalle}</Text>}
            <Text style={styles.monto}>${Number(item.monto).toFixed(2)} · {item.metodo_pago}</Text>
            {item.estado === 'pendiente' && (
              <Button title="Cancelar" outline color={colors.danger} onPress={() => cancelar(item.id)} />
            )}
            {item.estado === 'entregado' && !item.calificacion && (
              <View>
                <Text style={styles.calLabel}>Calificá al delivery:</Text>
                <Stars value={0} onChange={(n) => calificar(item.id, n)} />
              </View>
            )}
            {item.estado === 'entregado' && item.calificacion && (
              <Text style={styles.calHecha}>Calificación: {'⭐'.repeat(item.calificacion)}</Text>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  hi: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.textMuted },
  logout: { color: colors.danger, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cliente: { color: colors.text, fontSize: 17, fontWeight: '700' },
  dir: { color: colors.textMuted, marginBottom: 4 },
  det: { color: colors.text, marginBottom: 4 },
  monto: { color: colors.primary, fontWeight: '700', marginBottom: 6 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  calLabel: { color: colors.textMuted, marginTop: 4 },
  calHecha: { color: colors.warning, marginTop: 4, fontWeight: '600' },
});

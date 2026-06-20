import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase, rpc } from '../../lib/supabase';
import { Badge, Button, Card } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function DeliveryHome({ navigation }) {
  const { profile, signOut, refreshProfile } = useAuth();
  const [disponibles, setDisponibles] = useState([]);
  const [activo, setActivo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(profile.disponible);

  const load = useCallback(async () => {
    // Pedido activo del delivery (tomado o en_camino)
    const { data: mios } = await supabase
      .from('orders').select('*')
      .eq('delivery_id', profile.id)
      .in('estado', ['tomado', 'en_camino'])
      .order('tomado_en', { ascending: false });
    setActivo(mios?.[0] ?? null);

    // Pedidos pendientes disponibles para tomar
    const { data: pend } = await supabase
      .from('orders').select('*')
      .eq('estado', 'pendiente')
      .order('creado', { ascending: true });
    setDisponibles(pend ?? []);
  }, [profile.id]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('delivery-feed')
      .on('postgres_changes', { event: '*', schema: 'delivery', table: 'orders' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  async function toggleOnline(v) {
    setOnline(v);
    await supabase.from('profiles').update({ disponible: v }).eq('id', profile.id);
    refreshProfile();
  }

  async function tomar(id) {
    const { error } = await rpc('tomar_pedido', { p_order_id: id });
    if (error) return Alert.alert('Ups', error.message);
    await load();
    navigation.navigate('EntregaActiva');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>🛵 {profile.nombre}</Text>
          <Text style={styles.sub}>{online ? 'En línea' : 'Desconectado'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Switch value={online} onValueChange={toggleOnline}
            trackColor={{ true: colors.primary }} />
          <TouchableOpacity onPress={signOut}><Text style={styles.logout}>Salir</Text></TouchableOpacity>
        </View>
      </View>

      {activo && (
        <View style={{ paddingHorizontal: 16 }}>
          <Card style={{ borderColor: colors.primary }}>
            <Text style={styles.activoLabel}>Entrega en curso</Text>
            <Text style={styles.dir}>📍 {activo.direccion_entrega}</Text>
            <Button title="Ver entrega activa" onPress={() => navigation.navigate('EntregaActiva')} />
          </Card>
        </View>
      )}

      <Text style={styles.section}>Pedidos disponibles</Text>
      <FlatList
        data={disponibles}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No hay pedidos pendientes ahora.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.cliente}>{item.cliente_nombre || 'Cliente'}</Text>
              <Badge estado={item.estado} />
            </View>
            <Text style={styles.dir}>📍 {item.direccion_entrega}</Text>
            {!!item.detalle && <Text style={styles.det}>{item.detalle}</Text>}
            <Text style={styles.monto}>${Number(item.monto).toFixed(2)} · {item.metodo_pago}</Text>
            <Button title="Tomar pedido" disabled={!!activo} onPress={() => tomar(item.id)} />
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
  section: { color: colors.text, fontWeight: '700', fontSize: 16, paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cliente: { color: colors.text, fontSize: 17, fontWeight: '700' },
  dir: { color: colors.textMuted, marginBottom: 4 },
  det: { color: colors.text, marginBottom: 4 },
  monto: { color: colors.primary, fontWeight: '700', marginBottom: 6 },
  activoLabel: { color: colors.primary, fontWeight: '700', marginBottom: 6 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});

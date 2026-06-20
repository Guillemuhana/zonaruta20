import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { supabase, rpc } from '../../lib/supabase';
import { Button, Badge } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function EntregaActiva({ navigation }) {
  const { profile } = useAuth();
  const [order, setOrder] = useState(null);
  const [myPos, setMyPos] = useState(null);
  const watchRef = useRef(null);

  async function loadOrder() {
    const { data } = await supabase
      .from('orders').select('*')
      .eq('delivery_id', profile.id)
      .in('estado', ['tomado', 'en_camino'])
      .order('tomado_en', { ascending: false })
      .limit(1).maybeSingle();
    setOrder(data);
    if (!data) navigation.goBack();
  }

  useEffect(() => {
    loadOrder();
    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos tu ubicación para la entrega.');
        return;
      }
      // Seguimiento en vivo: actualiza posicion local + en Supabase
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 25, timeInterval: 8000 },
        async (loc) => {
          if (!active) return;
          const lat = loc.coords.latitude, lng = loc.coords.longitude;
          setMyPos({ latitude: lat, longitude: lng });
          await supabase.from('profiles')
            .update({ lat, lng, ubicacion_actualizada: new Date().toISOString() })
            .eq('id', profile.id);
        }
      );
    })();

    return () => {
      active = false;
      watchRef.current?.remove?.();
    };
  }, []);

  async function marcarEnCamino() {
    await supabase.from('orders').update({ estado: 'en_camino' }).eq('id', order.id);
    loadOrder();
  }

  async function marcarEntregado() {
    Alert.alert('Confirmar entrega', '¿Entregaste el pedido?', [
      { text: 'No' },
      { text: 'Sí, entregado', onPress: async () => {
        const { error } = await rpc('completar_entrega', { p_order_id: order.id });
        if (error) return Alert.alert('Error', error.message);
        const ganados = 10 + Math.floor((Number(order.monto) || 0) / 1000);
        Alert.alert('¡Entrega completada! 🎉', `Ganaste +${ganados} puntos.`,
          [{ text: 'Genial', onPress: () => navigation.goBack() }]);
      } },
    ]);
  }

  function abrirMapaExterno() {
    const dest = order.lat_entrega
      ? `${order.lat_entrega},${order.lng_entrega}`
      : encodeURIComponent(order.direccion_entrega);
    const url = Platform.select({
      ios: `maps://?daddr=${dest}`,
      android: `google.navigation:q=${dest}`,
    });
    Linking.openURL(url);
  }

  if (!order) {
    return <SafeAreaView style={styles.safe}><Text style={styles.loading}>Cargando…</Text></SafeAreaView>;
  }

  const destino = order.lat_entrega
    ? { latitude: order.lat_entrega, longitude: order.lng_entrega }
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          initialRegion={{
            latitude: destino?.latitude ?? myPos?.latitude ?? -31.42,
            longitude: destino?.longitude ?? myPos?.longitude ?? -64.18,
            latitudeDelta: 0.03, longitudeDelta: 0.03,
          }}
        >
          {destino && <Marker coordinate={destino} title="Entrega" pinColor={colors.primary} />}
          {myPos && <Marker coordinate={myPos} title="Vos" pinColor="#3B82F6" />}
        </MapView>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.cliente}>{order.cliente_nombre || 'Cliente'}</Text>
          <Badge estado={order.estado} />
        </View>
        <Text style={styles.dir}>📍 {order.direccion_entrega}</Text>
        {!!order.detalle && <Text style={styles.det}>{order.detalle}</Text>}
        <Text style={styles.monto}>${Number(order.monto).toFixed(2)} · {order.metodo_pago}</Text>
        {!!order.cliente_telefono && (
          <Button title="📞 Llamar al cliente" outline
            onPress={() => Linking.openURL(`tel:${order.cliente_telefono}`)} />
        )}
        <Button title="🧭 Abrir navegación" outline onPress={abrirMapaExterno} />
        {order.estado === 'tomado' && <Button title="Marcar en camino" onPress={marcarEnCamino} />}
        {order.estado === 'en_camino' && <Button title="Marcar entregado" onPress={marcarEntregado} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  mapWrap: { flex: 1 },
  panel: { padding: 18, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cliente: { color: colors.text, fontSize: 19, fontWeight: '800' },
  dir: { color: colors.textMuted, marginBottom: 4 },
  det: { color: colors.text, marginBottom: 4 },
  monto: { color: colors.primary, fontWeight: '700', marginBottom: 8 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 60 },
});

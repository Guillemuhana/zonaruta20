import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button, Field } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function NuevoPedido({ navigation }) {
  const { profile } = useAuth();
  const [f, setF] = useState({
    cliente_nombre: '', cliente_telefono: '', direccion_entrega: '',
    detalle: '', monto: '', metodo_pago: 'efectivo', notas: '',
  });
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  async function usarUbicacionActual() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado');
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('Ubicación tomada', 'Se usará tu posición actual como punto de entrega.');
  }

  async function crear() {
    if (!f.direccion_entrega) return Alert.alert('Falta la dirección de entrega');
    setLoading(true);
    const { error } = await supabase.from('orders').insert({
      negocio_id: profile.id,
      cliente_nombre: f.cliente_nombre,
      cliente_telefono: f.cliente_telefono,
      direccion_entrega: f.direccion_entrega,
      lat_entrega: coords?.lat ?? null,
      lng_entrega: coords?.lng ?? null,
      detalle: f.detalle,
      monto: parseFloat(f.monto) || 0,
      metodo_pago: f.metodo_pago,
      notas: f.notas,
    });
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Listo', 'Pedido publicado. Un delivery lo va a tomar.', [
      { text: 'Ok', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text style={styles.title}>Nuevo pedido</Text>
        <Field label="Nombre del cliente" value={f.cliente_nombre} onChangeText={set('cliente_nombre')} placeholder="María" />
        <Field label="Teléfono del cliente" value={f.cliente_telefono} onChangeText={set('cliente_telefono')} keyboardType="phone-pad" />
        <Field label="Dirección de entrega *" value={f.direccion_entrega} onChangeText={set('direccion_entrega')} placeholder="Av. Siempre Viva 742" />

        <View style={{ marginBottom: 14 }}>
          <Button title={coords ? '✓ Ubicación tomada' : '📍 Usar mi ubicación actual'}
            outline color={coords ? colors.primary : colors.textMuted} onPress={usarUbicacionActual} />
        </View>

        <Field label="Detalle del pedido" value={f.detalle} onChangeText={set('detalle')} placeholder="2 pizzas grandes, 1 gaseosa" multiline />
        <Field label="Monto $" value={f.monto} onChangeText={set('monto')} keyboardType="decimal-pad" placeholder="0.00" />
        <Field label="Método de pago" value={f.metodo_pago} onChangeText={set('metodo_pago')} placeholder="efectivo / transferencia" />
        <Field label="Notas" value={f.notas} onChangeText={set('notas')} placeholder="Tocar timbre 2 veces" multiline />

        <Button title="Publicar pedido" onPress={crear} loading={loading} />
        <Button title="Cancelar" outline color={colors.danger} onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 16 },
});

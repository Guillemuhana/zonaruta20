import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui';
import { colors } from '../../lib/theme';

const ROLES = [
  { key: 'negocio', label: '🏪 Negocio', desc: 'Cargo y envío mis pedidos' },
  { key: 'delivery', label: '🛵 Delivery', desc: 'Tomo y entrego pedidos' },
];

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [rol, setRol] = useState('negocio');
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', telefono: '', negocio_nombre: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function onRegister() {
    if (!form.email || !form.password || !form.nombre)
      return Alert.alert('Faltan datos', 'Completá nombre, email y contraseña');
    if (rol === 'negocio' && !form.negocio_nombre)
      return Alert.alert('Faltan datos', 'Ingresá el nombre del negocio');

    setLoading(true);
    const { error } = await signUp({
      email: form.email.trim(), password: form.password, rol,
      nombre: form.nombre, telefono: form.telefono, negocio_nombre: form.negocio_nombre,
    });
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    Alert.alert(
      'Cuenta creada',
      'Tu cuenta queda pendiente de aprobación por el administrador. Te avisará cuando esté activa.',
      [{ text: 'Ok', onPress: () => navigation.navigate('Login') }]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
        <Text style={styles.title}>Crear cuenta</Text>

        <Text style={styles.label}>¿Qué sos?</Text>
        <View style={{ gap: 10, marginBottom: 18 }}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r.key} onPress={() => setRol(r.key)}
              style={[styles.roleCard, rol === r.key && styles.roleActive]}>
              <Text style={styles.roleLabel}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Nombre completo" value={form.nombre} onChangeText={set('nombre')} placeholder="Juan Pérez" />
        {rol === 'negocio' && (
          <Field label="Nombre del negocio" value={form.negocio_nombre}
            onChangeText={set('negocio_nombre')} placeholder="Pizzería La Esquina" />
        )}
        <Field label="Teléfono" value={form.telefono} onChangeText={set('telefono')}
          keyboardType="phone-pad" placeholder="+54 9 ..." />
        <Field label="Email" value={form.email} onChangeText={set('email')}
          autoCapitalize="none" keyboardType="email-address" placeholder="tu@email.com" />
        <Field label="Contraseña" value={form.password} onChangeText={set('password')}
          secureTextEntry placeholder="mínimo 6 caracteres" />

        <Button title="Registrarme" onPress={onRegister} loading={loading} />
        <Button title="Ya tengo cuenta" outline onPress={() => navigation.navigate('Login')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 48 },
  logoImg: { width: 130, height: 130, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 20 },
  label: { color: colors.textMuted, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  roleCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: colors.border },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  roleLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  roleDesc: { color: colors.textMuted, marginTop: 2 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    if (!email || !password) return Alert.alert('Faltan datos', 'Ingresá email y contraseña');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
          <Text style={styles.sub}>Iniciá sesión para continuar</Text>

          <Field label="Email" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" placeholder="tu@email.com" />
          <Field label="Contraseña" value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••" />

          <Button title="Ingresar" onPress={onLogin} loading={loading} />
          <Button title="Crear cuenta" outline onPress={() => navigation.navigate('Register')} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logoImg: { width: 200, height: 200, alignSelf: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center', marginBottom: 32, marginTop: 6 },
});

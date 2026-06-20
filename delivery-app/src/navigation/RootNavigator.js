import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PendingScreen from '../screens/auth/PendingScreen';

import NegocioHome from '../screens/negocio/NegocioHome';
import NuevoPedido from '../screens/negocio/NuevoPedido';

import DeliveryHome from '../screens/delivery/DeliveryHome';
import EntregaActiva from '../screens/delivery/EntregaActiva';
import DeliveryPerfil from '../screens/delivery/DeliveryPerfil';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUsuarios from '../screens/admin/AdminUsuarios';
import AdminPedidos from '../screens/admin/AdminPedidos';
import AdminMapa from '../screens/admin/AdminMapa';
import AdminRanking from '../screens/admin/AdminRanking';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabOpts = {
  headerShown: false,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
};

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="Panel" component={AdminDashboard}
        options={{ tabBarLabel: '📊 Panel' }} />
      <Tab.Screen name="Pedidos" component={AdminPedidos}
        options={{ tabBarLabel: '📦 Pedidos' }} />
      <Tab.Screen name="Mapa" component={AdminMapa}
        options={{ tabBarLabel: '🗺️ Mapa' }} />
      <Tab.Screen name="Ranking" component={AdminRanking}
        options={{ tabBarLabel: '🏆 Ranking' }} />
      <Tab.Screen name="Usuarios" component={AdminUsuarios}
        options={{ tabBarLabel: '👥 Usuarios' }} />
    </Tab.Navigator>
  );
}

function NegocioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NegocioHome" component={NegocioHome} />
      <Stack.Screen name="NuevoPedido" component={NuevoPedido} />
    </Stack.Navigator>
  );
}

function DeliveryPedidosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DeliveryHome" component={DeliveryHome} />
      <Stack.Screen name="EntregaActiva" component={EntregaActiva} />
    </Stack.Navigator>
  );
}

function DeliveryTabs() {
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="Pedidos" component={DeliveryPedidosStack}
        options={{ tabBarLabel: '🛵 Pedidos' }} />
      <Tab.Screen name="Perfil" component={DeliveryPerfil}
        options={{ tabBarLabel: '🏆 Mi perfil' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  let content;
  if (!session || !profile) content = <AuthStack />;
  else if (profile.rol === 'admin') content = <AdminTabs />;
  else if (!profile.aprobado) content = <PendingScreen />;
  else if (profile.rol === 'negocio') content = <NegocioStack />;
  else content = <DeliveryTabs />;

  return <NavigationContainer>{content}</NavigationContainer>;
}

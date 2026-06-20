import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';

export default function AdminMapa() {
  const [deliverys, setDeliverys] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('profiles').select('*')
      .eq('rol', 'delivery').eq('disponible', true)
      .not('lat', 'is', null);
    setDeliverys(data ?? []);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-map')
      .on('postgres_changes', { event: '*', schema: 'delivery', table: 'profiles' }, load)
      .subscribe();
    const t = setInterval(load, 10000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: -31.42, longitude: -64.18, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
      >
        {deliverys.map((d) => (
          <Marker key={d.id} coordinate={{ latitude: d.lat, longitude: d.lng }}
            title={d.nombre} description="Delivery en línea" pinColor={colors.primary} />
        ))}
      </MapView>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🛵 {deliverys.length} en línea</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  badge: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  badgeText: { color: colors.text, fontWeight: '700' },
});

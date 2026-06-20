import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui';
import { colors, estadoColor, estadoLabel } from '../../lib/theme';

const money = (n) =>
  '$' + Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

function Kpi({ label, value, sub, color = colors.text, big }) {
  return (
    <View style={[styles.kpi, big && styles.kpiBig]}>
      <Text style={[styles.kpiValue, { color }, big && { fontSize: 30 }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function BarChart({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.total));
  return (
    <View style={styles.chart}>
      {serie.map((d, i) => (
        <View key={i} style={styles.barCol}>
          <Text style={styles.barNum}>{d.total || ''}</Text>
          <View style={styles.barTrack}>
            <View
              style={[styles.barFill, { height: `${(d.total / max) * 100}%` }]}
            />
            <View
              style={[
                styles.barFillDone,
                { height: `${(d.entregados / max) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.barDay}>{d.dia}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('estadisticas_admin');
    if (!error) setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-dash')
      .on('postgres_changes', { event: '*', schema: 'delivery', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'delivery', table: 'profiles' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const s = stats || {};
  const ped = s.pedidos || {};
  const fac = s.facturacion || {};
  const neg = s.negocios || {};
  const del = s.deliverys || {};
  const serie = s.serie_7d || [];
  const top = s.top_deliverys || [];

  const estados = [
    ['pendiente', ped.pendientes],
    ['tomado', ped.tomados],
    ['en_camino', ped.en_camino],
    ['entregado', ped.entregados],
    ['cancelado', ped.cancelados],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hi}>👑 Panel CEO</Text>
            <Text style={styles.sub}>Hola, {profile?.nombre || 'Leandro'}</Text>
          </View>
          <Text style={styles.logout} onPress={signOut}>Salir</Text>
        </View>

        {s.pendientes_aprobacion > 0 && (
          <Card style={{ borderColor: colors.warning, backgroundColor: colors.warning + '14' }}>
            <Text style={{ color: colors.warning, fontWeight: '700' }}>
              ⚠️ {s.pendientes_aprobacion} usuario{s.pendientes_aprobacion > 1 ? 's' : ''} esperando aprobación
            </Text>
            <Text style={styles.kpiSub}>Andá a la pestaña 👥 Usuarios para dar de alta.</Text>
          </Card>
        )}

        {/* Facturación */}
        <Text style={styles.section}>💰 Facturación</Text>
        <Card>
          <View style={styles.kpiRow}>
            <Kpi label="Total entregado" value={money(fac.total)} color={colors.primary} big />
            <Kpi label="Hoy" value={money(fac.hoy)} color="#22C55E" big />
          </View>
          <View style={[styles.kpiRow, { marginTop: 12 }]}>
            <Kpi label="Este mes" value={money(fac.mes)} />
            <Kpi label="Ticket promedio" value={money(fac.ticket_promedio)} />
          </View>
        </Card>

        {/* Pedidos */}
        <Text style={styles.section}>📦 Pedidos</Text>
        <Card>
          <View style={styles.kpiRow}>
            <Kpi label="Totales" value={ped.total ?? 0} big />
            <Kpi label="Activos ahora" value={ped.activos ?? 0} color="#3B82F6" big />
            <Kpi label="Entregados hoy" value={ped.entregados_hoy ?? 0} color="#22C55E" big />
          </View>
          <View style={styles.estadoWrap}>
            {estados.map(([e, n]) => (
              <View key={e} style={[styles.estadoPill, { borderColor: estadoColor[e], backgroundColor: estadoColor[e] + '1f' }]}>
                <Text style={[styles.estadoNum, { color: estadoColor[e] }]}>{n ?? 0}</Text>
                <Text style={styles.estadoLbl}>{estadoLabel[e]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Últimos 7 días */}
        <Text style={styles.section}>📈 Últimos 7 días</Text>
        <Card>
          <BarChart serie={serie} />
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={styles.legendTxt}>Pedidos</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#22C55E' }]} /><Text style={styles.legendTxt}>Entregados</Text></View>
          </View>
        </Card>

        {/* Equipo */}
        <Text style={styles.section}>👥 Equipo</Text>
        <View style={styles.kpiRow}>
          <Card style={styles.teamCard}>
            <Text style={styles.teamTitle}>🏪 Negocios</Text>
            <Text style={styles.teamBig}>{neg.aprobados ?? 0}</Text>
            <Text style={styles.kpiSub}>activos · {neg.pendientes ?? 0} pendientes</Text>
          </Card>
          <Card style={styles.teamCard}>
            <Text style={styles.teamTitle}>🛵 Deliverys</Text>
            <Text style={styles.teamBig}>{del.aprobados ?? 0}</Text>
            <Text style={styles.kpiSub}>
              <Text style={{ color: '#22C55E' }}>● {del.online ?? 0} online</Text> · {del.pendientes ?? 0} pend.
            </Text>
          </Card>
        </View>

        {/* Calidad + Top */}
        <Text style={styles.section}>🏆 Top deliverys</Text>
        <Card>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.calif}>⭐ {s.calificacion_global || '—'}</Text>
            <Text style={styles.kpiSub}>Calificación global del servicio</Text>
          </View>
          {top.length === 0 ? (
            <Text style={styles.kpiSub}>Sin deliverys todavía.</Text>
          ) : (
            top.map((t, i) => (
              <View key={t.id} style={styles.topRow}>
                <Text style={styles.topPos}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${t.posicion}`}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topName}>{t.nombre}</Text>
                  <Text style={styles.kpiSub}>{t.nivel} · {t.entregas_totales} entregas · ⭐ {t.calificacion_promedio ?? '—'}</Text>
                </View>
                <Text style={styles.topPts}>{t.puntos} pts</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hi: { fontSize: 26, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 2 },
  logout: { color: colors.danger, fontWeight: '700' },
  section: { color: colors.text, fontWeight: '800', fontSize: 17, marginTop: 18, marginBottom: 8 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1 },
  kpiBig: {},
  kpiValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  kpiLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '600' },
  kpiSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  estadoWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  estadoPill: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', minWidth: 64 },
  estadoNum: { fontSize: 18, fontWeight: '800' },
  estadoLbl: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 140, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: 18, flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden', position: 'relative' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 5, position: 'absolute', bottom: 0 },
  barFillDone: { width: '100%', backgroundColor: '#22C55E', borderRadius: 5, position: 'absolute', bottom: 0 },
  barNum: { color: colors.textMuted, fontSize: 10, marginBottom: 2, height: 12 },
  barDay: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { color: colors.textMuted, fontSize: 12 },
  teamCard: { flex: 1 },
  teamTitle: { color: colors.text, fontWeight: '700' },
  teamBig: { color: colors.text, fontSize: 34, fontWeight: '900', marginVertical: 2 },
  calif: { color: colors.warning, fontSize: 34, fontWeight: '900' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  topPos: { fontSize: 18, fontWeight: '800', width: 40, color: colors.text },
  topName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  topPts: { color: colors.primary, fontWeight: '800' },
});

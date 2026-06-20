# 🛵 Zona Ruta 20

Sistema de delivery en React Native (Expo) + Supabase. Reemplaza el grupo de WhatsApp:
los **negocios** cargan pedidos, los **deliverys** los toman (modelo tipo Uber/Rappi) y
**Leandro (admin)** ve y controla todo. **No hay rol de cliente.**

## Roles

- **🏪 Negocio:** se registra, carga pedidos con dirección/ubicación, ve estado en vivo, califica al delivery.
- **🛵 Delivery:** se registra, se pone "en línea", toma pedidos disponibles, comparte ubicación en vivo, marca entregado. Gana **puntos**, sube de **nivel** y compite en el **ranking**.
- **👑 Admin (Leandro):** aprueba altas, ve todos los pedidos, mapa de deliverys en vivo y ranking.

Negocios y deliverys quedan **pendientes de aprobación** hasta que el admin los habilita.

## Sistema de puntos (tipo Rappi)

- **+10 pts** por entrega completada, **+1 pt** por cada $1000 del pedido.
- **+2 pts** por cada estrella que el negocio le da (1 a 5).
- Niveles: Inicial → Bronce (50) → Plata (200) → Oro (500) → Diamante (1000).

## Instalación

```bash
npm install
npx expo start
```

Abrí la app con **Expo Go** en tu celular (o emulador). Para los mapas en build nativo
necesitás una **API Key de Google Maps** (ponela en `app.json` → android.config.googleMaps.apiKey).
En Expo Go funciona el mapa por defecto.

## Conexión a Supabase

Ya está configurada en `src/lib/supabase.js` (URL + clave pública). Todas las tablas viven
en el schema `delivery`. La base ya está creada con tablas, RLS y funciones de puntos.

## ⚠️ Crear el usuario Admin (Leandro)

El registro crea negocios y deliverys. El admin se crea a mano una sola vez:

1. Registrate normalmente en la app con el email de Leandro (como negocio o delivery, da igual).
2. En el SQL Editor de Supabase ejecutá:

```sql
update delivery.profiles
set rol = 'admin', aprobado = true
where id = (select id from auth.users where email = 'leandro@zonaruta20.com');
```

3. Cerrá sesión y volvé a entrar. Ahora ve el panel de admin completo.

## Estructura

```
src/
  lib/         supabase, theme
  context/     AuthContext (sesión + perfil + rol)
  components/  ui (botones, inputs, estrellas, badges)
  navigation/  RootNavigator (decide pantallas según rol)
  screens/
    auth/      Login, Register, Pending
    negocio/   Home (pedidos + calificar), NuevoPedido
    delivery/  Home (tomar pedidos), EntregaActiva (mapa+tracking), Perfil (puntos/ranking)
    admin/     Pedidos, Mapa, Ranking, Usuarios (aprobaciones)
```

## Notas técnicas

- **Tiempo real:** Supabase Realtime actualiza pedidos y ubicaciones sin recargar.
- **Tomar pedido atómico:** la función `tomar_pedido` evita que dos deliverys tomen el mismo.
- **Ubicación en vivo:** `expo-location` con `watchPositionAsync` actualiza la posición del
  delivery en la base mientras hace la entrega; el admin la ve en su mapa.
- **Seguridad:** RLS por rol. Cada quien ve solo lo que le corresponde.

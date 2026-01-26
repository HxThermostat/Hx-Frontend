# Sistema de Logging para Provisioning

## Resumen

Este sistema de logging proporciona evidencia detallada de errores de provisioning tanto en desarrollo como en producción, sin agregar delays innecesarios.

## Características

### 1. **Funciona en Producción**
- Usa `console.warn()` para que los logs aparezcan en **logcat** (Android) y **logs nativos** (iOS)
- Los logs se guardan automáticamente en los logs del sistema operativo

### 2. **Análisis Inteligente de Errores**
El logger analiza automáticamente los errores de Apollo Client y los clasifica en:

- **TIMEOUT_ERROR**: Apollo Client timeout (10s) alcanzado
- **NETWORK_ERROR**: Problemas de conectividad de red
- **AUTH_ERROR**: Problemas de autenticación/token
- **GRAPHQL_ERROR**: El servidor GraphQL rechazó la request
- **VALIDATION_ERROR**: Problemas con los datos de entrada (DSN/setupToken)
- **BACKEND_ERROR**: Error del servidor backend (500, etc)
- **UNKNOWN_ERROR**: Error desconocido

### 3. **Contexto Rico**
Cada log incluye:
- Timestamp ISO 8601
- DSN del dispositivo
- setupToken
- Información del peripheral (si está disponible)
- Estado del signal (aborted/no aborted)

### 4. **Recomendaciones Automáticas**
El logger proporciona recomendaciones específicas basadas en el tipo de error

## Uso

### Logs en Producción

Para ver los logs en producción:

#### Android (logcat)
```bash
# Ver todos los logs de provisioning
adb logcat | grep PROVISION

# Ver solo errores
adb logcat | grep "PROVISION.*ERROR"

# Guardar logs a un archivo
adb logcat | grep PROVISION > provisioning_logs.txt
```

#### iOS (Console.app o terminal)
```bash
# En la Mac, abrir Console.app y filtrar por "PROVISION"

# O usar terminal:
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "PROVISION"'
```

### Ejemplo de Log Output

```
[2025-10-07T10:30:45.123Z] [PROVISION] [INFO] WiFi-only registration started | Context: {"dsn":"AC233F123456","setupToken":"a1b2c3d4","hasPeripheral":false}

[2025-10-07T10:30:50.234Z] [PROVISION] [INFO] Sending RegisterLocation mutation | Context: {"dsn":"AC233F123456","setupToken":"a1b2c3d4"}

[2025-10-07T10:31:00.567Z] [PROVISION] [ERROR] Registration failed: TIMEOUT_ERROR | Context: {"dsn":"AC233F123456","setupToken":"a1b2c3d4","errorName":"ApolloError","errorMessage":"Aborted","errorType":"TIMEOUT_ERROR","isRecoverable":true}

[2025-10-07T10:31:00.568Z] [PROVISION] [ERROR] Error details: Apollo Client timeout reached (10s default). Device may be slow to respond. | Context: {}

[2025-10-07T10:31:00.569Z] [PROVISION] [INFO] Recommendation: Device is taking too long to respond. Ensure device is powered on and connected to WiFi network. | Context: {}
```

## Interpretación de Errores

### TIMEOUT_ERROR
**Causa**: El dispositivo está tardando más de 10 segundos en responder.

**Solución**: 
- Verificar que el dispositivo esté encendido
- Verificar que el dispositivo esté conectado a la red WiFi
- Considerar aumentar el timeout de Apollo Client en `graph/client/links/timeoutLink.ts`

### NETWORK_ERROR
**Causa**: Problemas de conectividad de red.

**Solución**:
- Verificar que el dispositivo tenga acceso a internet
- Verificar que la red WiFi del dispositivo tenga salida a internet
- Verificar que no haya firewalls bloqueando la conexión

### AUTH_ERROR
**Causa**: Token de autenticación expirado o inválido.

**Solución**:
- El usuario necesita hacer logout/login nuevamente
- Verificar que el refresh token esté funcionando correctamente

### GRAPHQL_ERROR
**Causa**: El servidor rechazó la request.

**Solución**:
- Verificar que el DSN sea válido
- Verificar que el setupToken sea correcto
- Revisar los logs del backend para más detalles

### BACKEND_ERROR
**Causa**: El servidor backend está experimentando problemas.

**Solución**:
- Reintentar más tarde
- Verificar el estado del servidor backend
- Contactar al equipo de backend si el problema persiste

## Notas Importantes

1. **No se agregan delays**: El logger solo registra información, no afecta el flujo de ejecución
2. **Logs persistentes**: Los logs quedan guardados en el sistema operativo para análisis posterior
3. **Privacidad**: No se loguean contraseñas ni información sensible del usuario
4. **Producción-ready**: Diseñado específicamente para debugging en producción

## Troubleshooting

### "No veo los logs en logcat"
- Verificar que el dispositivo esté conectado: `adb devices`
- Verificar que el filtro sea correcto: `adb logcat | grep PROVISION`
- En producción, los logs usan `console.warn()` para mayor visibilidad

### "Los logs no aparecen en iOS"
- Abrir Console.app en Mac
- Conectar el dispositivo iOS
- Filtrar por "PROVISION"
- O usar Xcode → Window → Devices and Simulators → View Device Logs


---
name: correr-y-verificar
description: Cómo levantar, compilar y verificar visualmente el sitio CIJJ. Úsala para correr el proyecto, confirmar que un cambio funciona, antes de dar una tarea por terminada o antes de hacer commit/deploy — incluye typecheck, build y capturas de escritorio y móvil con Chrome headless.
---

# Correr y verificar el sitio CIJJ

Ejecutar desde la raíz del repositorio. Gestor: **pnpm**.

## Comandos

| Objetivo | Comando |
| --- | --- |
| Instalar dependencias | `pnpm install` |
| Desarrollo (http://localhost:3000) | `pnpm dev` |
| Tipos | `pnpm exec tsc --noEmit` |
| Build de producción | `pnpm build` |
| Servir el build | `pnpm start -p 3100` |
| Lint | `pnpm lint` (debe terminar sin errores) |

Sin `.env.local`, el formulario de afiliación en desarrollo simula éxito sin guardar y en producción muestra un aviso de no disponible. Esto es esperado.

## Verificación mínima antes de terminar

1. `pnpm lint` y `pnpm exec tsc --noEmit` sin errores.
2. `pnpm build` completa y lista las rutas esperadas.
3. Revisión visual de las páginas afectadas en escritorio y móvil (abajo).
4. Reportar con honestidad lo que no se pudo probar (por ejemplo, inserción real en Supabase sin credenciales).

## Capturas con Chrome headless

1. Levantar el build en segundo plano: `pnpm start -p 3100` (con `run_in_background`).
2. Esperar sin `sleep`, con reintentos de curl, y capturar:

```bash
S="<directorio scratchpad>"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
curl -s -o /dev/null -w "HTTP %{http_code}\n" --retry 30 --retry-connrefused --retry-delay 1 http://localhost:3100/
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 \
  --window-size=1440,5200 --screenshot="$S/escritorio.png" http://localhost:3100/
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 \
  --window-size=500,1400 --screenshot="$S/movil.png" http://localhost:3100/
sips -Z 1800 "$S/escritorio.png" --out "$S/escritorio-r.png"
```

3. Abrir las imágenes con Read y revisar: desbordes horizontales, textos cortados, contraste, espaciado y que el botón "Únete" sea visible.
4. Detener el servidor: `lsof -ti tcp:3100 | xargs kill`.

## Trampas conocidas

- Chrome headless **no respeta anchos menores a ~500px**: a 390px recorta la captura y parece que el diseño se desborda. Usar 500px de ancho para móvil.
- Un espacio en blanco grande al final de la captura de escritorio suele ser la ventana más alta que la página, no un bug.
- Guardar capturas en el scratchpad de la sesión, nunca en el repositorio.

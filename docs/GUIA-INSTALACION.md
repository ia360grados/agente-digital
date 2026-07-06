# Guía de instalación — Agente Digital

Tiempo total estimado: **30-45 minutos**. Se hace en remoto por RustDesk
con el cliente al teléfono (hay 2 pasos que debe hacer él en persona).

---

## FASE 0 — Antes de la instalación (el cliente, solo)

Enviar al cliente esta lista por email/WhatsApp:

1. **Ordenador**: un Mac que pueda quedarse siempre encendido y con
   internet por cable si es posible (recomendado: Mac mini).
2. **Cuenta de Claude**: crear cuenta en https://claude.ai y contratar
   plan **Pro** (o superior) a su nombre y con su tarjeta.
3. **WhatsApp Business Cloud API**: necesita un número de teléfono que
   NO esté ya en WhatsApp. (Este paso lo podéis hacer juntos en la
   Fase 3 si al cliente le cuesta.)
4. **RustDesk**: descargar de https://rustdesk.com, abrirlo y pasarte
   el **ID** y la **contraseña de un solo uso** que aparecen en pantalla.

---

## FASE 1 — Conexión remota (tú, 5 min)

1. Conéctate por RustDesk con el ID que te pasó el cliente.
2. Pide al cliente que apruebe en pantalla los permisos que macOS
   solicite para RustDesk:
   - Ajustes del Sistema → Privacidad y Seguridad → **Accesibilidad** ✅
   - → **Grabación de pantalla** ✅
   - Reiniciar RustDesk tras dar los permisos (⌘Q y abrir de nuevo).
3. En RustDesk del cliente: fija una **contraseña permanente**
   (⋮ junto a la contraseña → "Establecer contraseña permanente") y
   guárdala en tu gestor de contraseñas. Es tu acceso de soporte.

---

## FASE 2 — Instalación del software (tú, por RustDesk, 10 min)

Abrir Terminal en el Mac del cliente:

```bash
git clone https://github.com/TU_USUARIO/agente-digital.git ~/agente-digital
cd ~/agente-digital
chmod +x install.sh wizard.sh
./install.sh
```

El instalador hace solo:
- Homebrew, Node.js, Claude Code, RustDesk (si faltara)
- Dependencias del puente WhatsApp
- Autoarranque del agente y anti-suspensión (launchd)

⚠️ `install.sh` pedirá la contraseña de administrador del Mac una o dos
veces (Homebrew y pmset): **la teclea el cliente**, no te la dicte.

---

## FASE 3 — Login de Claude (EL CLIENTE en persona, 3 min)

En la Terminal:

```bash
claude
```

Se abre el navegador → el cliente inicia sesión **con su cuenta**.
Tú no ves ni guardas su contraseña. Cuando la terminal muestre el
prompt de Claude, escribe `salir` o pulsa Ctrl+C dos veces.

---

## FASE 4 — WhatsApp Cloud API (juntos, 15 min)

1. Ir a https://developers.facebook.com → crear app de tipo **Business**.
2. Añadir el producto **WhatsApp** → registrar el número del negocio.
3. Anotar: **token permanente** y **Phone Number ID**.
4. Exponer el webhook. Opciones:
   - **Cloudflare Tunnel** (recomendado, gratis, dominio estable):
     `brew install cloudflared` y crear túnel hacia `localhost:3000`.
   - O cualquier proxy/dominio que ya uses.
5. En Meta → WhatsApp → Configuración → Webhook:
   - URL: `https://TU-TUNEL/webhook`
   - Verify token: el que genere el wizard (siguiente fase).
   - Suscribirse al campo `messages`.

---

## FASE 5 — Configuración del negocio (juntos, 10 min)

```bash
cd ~/agente-digital
./wizard.sh
```

El wizard pregunta: nombre del negocio, sector, tono, horario, y las
credenciales de WhatsApp de la Fase 4. Todo queda en `agente/.env`
**solo en la máquina del cliente**.

---

## FASE 6 — Prueba y entrega (el momento "wow", 5 min)

1. Desde el móvil del cliente, enviar un WhatsApp al número del negocio:
   *"Hola, ¿quién eres?"* → debe responder presentándose como su agente.
2. Probar la skill de ejemplo: *"Apunta a Prueba mañana a las 10"*.
3. Ver logs si algo falla:
   ```bash
   tail -f ~/agente-digital/agente/agente.log
   ```
4. Entregar al cliente por escrito: qué hace el agente, horario de
   soporte, y catálogo de skills adicionales.

---

## Solución de problemas

| Síntoma | Causa probable | Arreglo |
|---|---|---|
| No responde al WhatsApp | Webhook caído o túnel roto | `launchctl list \| grep agentedigital` y revisar el túnel |
| "No puedo procesar tu petición" | Sesión de Claude caducada | El cliente ejecuta `claude` y re-inicia sesión |
| El Mac se durmió | pmset no aplicado | Ajustes → Energía → nunca suspender |
| RustDesk ve pero no controla | Falta permiso Accesibilidad | Privacidad y Seguridad → Accesibilidad → RustDesk ✅ y reiniciar app |
| Responde a desconocidos | NUMEROS_AUTORIZADOS vacío | Re-ejecutar `./wizard.sh` |

## Checklist de entrega

- [ ] Agente responde por WhatsApp
- [ ] Solo responde a números autorizados
- [ ] Autoarranque probado (reiniciar el Mac y verificar)
- [ ] Anti-suspensión activa
- [ ] RustDesk con contraseña permanente guardada
- [ ] Contrato de encargado del tratamiento (RGPD) firmado
- [ ] Cliente sabe: qué hace el agente, qué no, y a quién llamar

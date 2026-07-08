# Agente Digital — Empleado IA para tu negocio

Un agente de IA que vive en un ordenador de tu oficina, siempre encendido,
y al que hablas por **WhatsApp** como a un empleado más: responde emails,
agenda citas, hace facturas y te informa cada mañana.

## Filosofía: como contratar a una persona

Tu agente tiene, igual que un trabajador de verdad:
- **Su propio móvil**: un número de WhatsApp dedicado (nunca el tuyo personal)
- **Su propia mesa**: un ordenador dedicado, siempre encendido

## Arquitectura (v2 — WhatsApp por QR)

```
[Ordenador del cliente — Mac o Windows]
   ├── agente/lector.mjs      ← WhatsApp vía QR (como WhatsApp Web)
   ├── Claude Code            ← el cerebro (cuenta propia del cliente)
   ├── agente/wizard.mjs      ← configuración en 6 preguntas
   ├── skills/                ← capacidades instalables (plugins)
   └── autoarranque           ← launchd (Mac) / Startup (Windows)
```

Sin API de Meta, sin webhooks, sin túneles: el agente se vincula
escaneando un QR, exactamente igual que WhatsApp Web.

## Instalación (doble clic)

- **Mac**: descargar **`Instalar Agente.command`** → clic derecho → Abrir
- **Windows**: descargar **`Instalar-Agente.bat`** → doble clic

El instalador lo hace todo solo. El cliente solo: acepta permisos,
inicia sesión en Claude, responde 6 preguntas y escanea el QR.

## Requisitos mínimos

| | Mac | Windows |
|---|---|---|
| Sistema | macOS 13+ (2018 en adelante) | Windows 10/11 (64 bits) |
| Memoria | 8 GB RAM | 8 GB RAM |
| Disco | 10 GB libres | 10 GB libres |
| Red | Internet estable (cable mejor) | Internet estable |

Además: número de WhatsApp **dedicado** (SIM prepago vale) activado en
cualquier móvil, y cuenta de **Claude Pro** propia del cliente.

## Sin credenciales en este repo

Este repositorio no contiene ningún acceso, clave ni token. La sesión de
WhatsApp, la cuenta de Claude y la configuración viven solo en la máquina
del cliente (ignorados por git).

## Skills (plugins)

El agente base conversa y gestiona citas. Las **skills** añaden
capacidades (facturación, email, informes...) copiando una carpeta en
`skills/`. Ver [skills/README.md](skills/README.md).

## Licencia

Uso comercial bajo licencia del distribuidor. Contacto: [tu email]

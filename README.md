# Agente Digital — Empleado IA para tu negocio

Un agente de IA que vive en un ordenador de tu oficina, siempre encendido,
y al que hablas por **WhatsApp** como a un empleado más: responde emails,
agenda citas, hace facturas y te informa cada mañana.

## Arquitectura

```
[Mac siempre encendido en el negocio del cliente]
   ├── Claude Code            ← el cerebro (cuenta propia del cliente)
   ├── agente/servidor.js     ← puente WhatsApp (Cloud API oficial)
   ├── skills/                ← capacidades instalables (plugins)
   ├── launchd/               ← autoarranque + anti-suspensión
   └── RustDesk               ← soporte remoto
```

## Instalación con UN comando (macOS)

Pega esto en la Terminal y sigue las instrucciones en pantalla:

```bash
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/agente-digital/main/instalar.sh | bash
```

Después, configura tu negocio:

```bash
cd ~/agente-digital && ./wizard.sh
```

Guía completa paso a paso (con capturas): [docs/GUIA-INSTALACION.md](docs/GUIA-INSTALACION.md)

## Sin credenciales en este repo

Este repositorio **no contiene ningún acceso, clave ni token**. Todas las
credenciales (WhatsApp, Claude, email...) se configuran en la máquina del
cliente durante el wizard y viven solo en su `agente/.env` (ignorado por git).

## Skills (plugins)

El agente base sabe conversar y ejecutar tareas generales. Las **skills**
añaden capacidades concretas (gestión de citas, facturación, informes...)
y se instalan copiando una carpeta dentro de `skills/`.
Ver [skills/README.md](skills/README.md).

## Requisitos

- macOS (Apple Silicon o Intel)
- Ordenador siempre encendido y con internet
- Cuenta de Claude (Pro o superior) propia del cliente
- Número de WhatsApp Business (Cloud API de Meta)

## Licencia

Uso comercial bajo licencia del distribuidor. Contacto: [tu email]

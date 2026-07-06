# Skills — Capacidades del agente (sistema de plugins)

El agente base sabe conversar y hacer tareas generales. Cada **skill** le
añade una capacidad concreta de negocio. Las skills se venden y se
instalan por separado: son el modelo de plugins del producto.

## Cómo funciona

Cada skill es una carpeta dentro de `skills/` con al menos un `SKILL.md`:

```
skills/
├── ejemplo-citas/
│   └── SKILL.md      ← qué hace, cómo se usa, qué necesita
├── facturacion/       (plugin de pago)
├── informe-diario/    (plugin de pago)
└── ...
```

El agente lee las skills instaladas antes de responder: si la carpeta
existe, tiene esa capacidad; si no, indica al cliente que puede adquirirla.

## Instalar una skill (para el distribuidor)

```bash
# Por RustDesk, en la máquina del cliente:
cp -R skill-comprada/ ~/agente-digital/skills/nombre-skill/
# Si la skill tiene dependencias propias:
cd ~/agente-digital/skills/nombre-skill && [ -f install.sh ] && ./install.sh
```

No hace falta reiniciar nada: el agente descubre las skills en cada mensaje.

## Formato de un SKILL.md

```markdown
# Nombre de la skill

## Qué hace
Descripción en una frase.

## Cuándo usarla
Frases del usuario que deben activar esta skill.

## Cómo ejecutarla
Pasos concretos, comandos, scripts incluidos en esta carpeta.

## Requisitos
Credenciales o accesos que el wizard debe configurar (van en .env, nunca aquí).
```

## Ideas de catálogo (precio orientativo por skill)

| Skill | Qué vende | Precio |
|---|---|---|
| Gestión de citas | Agenda por WhatsApp contra Google Calendar | 200€ |
| Facturación | Genera y envía facturas PDF | 250€ |
| Informe diario | Resumen del negocio cada mañana a las 8:00 | 150€ |
| Email | Lee, resume y responde el correo del negocio | 250€ |
| Seguimiento comercial | Reactiva presupuestos sin respuesta | 200€ |
| Pack sector (clínica, gestoría...) | 3-4 skills afinadas al gremio | 500-700€ |

# dimension.md — Plan: aislar worldgen por dimensión + reglas de viaje entre dimensiones

> Notas para continuar después. NO empezado (2026-06-02). Esto sería un **mod aparte**
> (repo propio, estilo voicechat-translate), no parte del modpack base.

## Objetivo

1. **Aislar worldgen de un mod a su dimensión** — que los biomas / estructuras / mobs de un
   mod solo generen dentro de su dimensión custom, y no contaminen overworld/nether/end.
2. **Reglas exclusivas de viaje entre dimensiones** — un grafo de transiciones permitidas.
   Ej: "de la dim 1 no se puede abrir portal a la dim 3"; viajes unidireccionales; rutas
   forzadas (tenés que pasar por la dim 2 para llegar a la 3); islas de dimensiones.

---

## Parte 1 — Aislamiento de worldgen  →  **datapack puro, 0 código**

Esto NO necesita el mod; es solo JSON (datapack). Se puede versionar.

- **Biomas solo ahí**: en el `biome_source` (multi_noise) de la dimensión custom listás solo
  esos biomas. Si el bioma del mod solo aparece en ese `biome_source` y en ningún otro, no
  genera fuera.
- **Estructuras solo ahí**: las structures se colocan por **biome tags**. Estructura que
  apunta a un tag de biomas que solo existe en la dim custom = estructura exclusiva. Además
  se pueden *quitar* estructuras de otras dimensiones sobrescribiendo su `structure_set` vacío.
- **Mobs solo ahí**: las spawn lists son por bioma. Mob en bioma exclusivo = mob exclusivo.
  Spawns "hardcoded" en overworld se anulan con datapack de spawns.

Robusto, no se rompe con updates de Forge.

---

## Parte 2 — Reglas de viaje  →  **mod Forge aparte, poco código, server-side**

**Hook clave: `EntityTravelToDimensionEvent`** (Forge, **cancelable**).
- Se dispara ANTES de que cualquier entidad (jugador incluido) cambie de dimensión.
- `event.getDimension()` = destino.
- `entity.level().dimension()` = origen.
- `event.setCanceled(true)` = bloquea el viaje.

NO necesita coremod/mixin para el caso general — es un evento normal de Forge.

### Esqueleto del mod

```
config: grafo de transiciones permitidas, p.ej.
   minecraft:overworld -> [mod:dim_A]
   mod:dim_A           -> [minecraft:overworld, mod:dim_B]
   mod:dim_B           -> [mod:dim_A]        # B no puede ir directo a overworld

@SubscribeEvent
onTravel(EntityTravelToDimensionEvent e):
   origen  = e.getEntity().level().dimension()
   destino = e.getDimension()
   if (origen -> destino) NOT in grafo:
       e.setCanceled(true)
       if (entity es jugador) mandar mensaje "no podés viajar de X a Y directo"
```

### Matices / decisiones pendientes
1. **Cancelar viaje vs. impedir que el portal se encienda.** El evento cancela el *viaje*
   (te parás en el portal y no pasa nada) — robusto, cubre ~95%. Si se quiere que el portal
   ni se encienda, es otro hook (interceptar flint&steel / creación del bloque de portal),
   más mod-específico. **Decisión: arrancar solo cancelando el viaje.**
2. **Teleports custom de otros mods.** El evento cubre todo lo que pase por
   `Entity.changeDimension` (portales vanilla, end, la mayoría de portales modded). Un mod
   que teletransporte con método propio raro podría saltárselo → ahí sí haría falta un
   **mixin** puntual. Reservar "core/coremod" SOLO para esos casos borde.
3. **Server-side.** Las reglas se aplican en el server (igual que voicetrans). El cliente no
   necesita el mod para que la regla funcione, aunque conviene que lo tenga para los mensajes.

---

## Veredicto / resumen

| Lo que quiero                                                      | Cómo                                   | Necesita            |
|-------------------------------------------------------------------|----------------------------------------|---------------------|
| Mobs/estructuras/biomas del mod no generan fuera                  | Datapack worldgen                      | **0 código**        |
| "De dim 1 no se puede abrir portal a dim 3" (grafo de viajes)     | Mod Forge + `EntityTravelToDimensionEvent` | Mod aparte, poco código, server-side |
| Bloquear que el portal ni se encienda / cubrir teleports raros    | Hooks extra / mixin                    | Solo si hace falta  |

## Próximos pasos cuando se retome
- [ ] Decidir si es repo nuevo o submódulo (probable: repo nuevo, estilo voicechat-translate).
- [ ] Confirmar versión Forge objetivo (modpack actual: Forge 1.20.1-47.4.0).
- [ ] Definir las dimensiones custom concretas y su grafo de viajes.
- [ ] Empezar por Parte 1 (datapack) que da resultado visible sin código.

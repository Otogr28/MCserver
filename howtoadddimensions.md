# Cómo agregar dimensiones y portales (guía para Claude / admin)

> Guía operativa para el server **summerBuddies** (Forge 1.20.1). Objetivo: agregar dimensiones y
> portales de forma **robusta y sin bloat**. Léela entera antes de tocar nada.

## Principio rector: ¿recompilar o solo archivos?

Hay una separación deliberada. Respetala:

| Querés… | Dónde | ¿Recompilar realmgates? |
|---|---|---|
| Una **dimensión nueva** (mundo/terreno) | datapack `datapacks/realm_dimensions/` (este repo) | ❌ NO |
| **Reglas** de viaje/gate/ambiente de una dim | `config/realmgates/dimensions/<id>.json` | ❌ NO (`/realmgates reload`) |
| Un **portal** hacia una dim | el bloque `portal` dentro de esa regla JSON | ❌ NO |
| Cambiar el **mecanismo** del portal (cómo detecta marco, teletransporta, etc.) | código Java de realmgates | ✅ SÍ, una vez |

**Regla de oro anti-bloat:** el motor (realmgates) se recompila **solo** si tocás el *mecanismo*.
Dimensiones y portales concretos = **solo editar archivos**. NO agregues KubeJS, NO agregues mods de
portal, NO inventes bloques nuevos por dimensión. El frame de un portal es **cualquier bloque vanilla
existente**; el igniter es **cualquier item existente**. Reutilizá; no registres.

## A) Crear la dimensión (datapack, sin recompilar)

1. En `datapacks/realm_dimensions/data/sb/`, creá los JSON. Mínimo: **un** archivo
   `dimension/<nombre>.json` (reusando tipo y biomas vanilla). Plantilla:
   `datapacks/realm_dimensions/data/sb/dimension/example_overworld.json`.
   - **Reutilizá vanilla siempre que puedas** (`"type": "minecraft:overworld"`, biome_source
     `multi_noise` preset `minecraft:overworld`, `settings: minecraft:overworld`). Solo agregá
     `dimension_type/`, `worldgen/biome/` y `forge/biome_modifier/` propios si la dim necesita terreno
     temático. Referencia temática completa: el `red_waste` del repo realmgates (`src/generated/resources/...`).
2. Namespace `sb` (cualquiera sirve). El ID queda `sb:<nombre>`.

## B) Hacerla alcanzable + darle portal (realmgates, sin recompilar)

Bajo deny-by-default, una dim sin regla es **inalcanzable**. Agregá su regla en el server:
`config/realmgates/dimensions/<nombre>.json`:

```json
{
  "dimension": "sb:tu_dim",
  "canEnterFrom": ["realmgates:v1"],
  "canExitTo": ["realmgates:v1"],
  "portal": { "frameBlock": "minecraft:gold_block", "igniter": "minecraft:fire_charge", "color": "#2BE04A" }
}
```

- El `portal` define el portal que lleva **HACIA** esta dim. Solo prende donde el grafo permite el
  viaje **y** se cumple `requiresToEnter` (si lo hay). Para el viaje de vuelta, poné un `portal` en la
  regla de la dim de origen.
- `color: "#RRGGBB"` opcional tiñe el portal encendido (default morado). El plano del portal es un
  panel fino orientado (como el del Nether), así que una pared de portal se ve continua, no en cubos.
- `arrival: [x, y, z]` opcional fija el punto de aterrizaje (default: superficie segura).
- `frameBlock`/`igniter` = IDs vanilla. Marco rectangular de cualquier tamaño, click derecho con el
  igniter. El bloque del plano lo pone realmgates (`realmgates:portal`); no se coloca a mano.
- `/realmgates reload` aplica cambios de **reglas/portales** en caliente. Una dim **nueva** igual
  necesita **un restart** la primera vez (Minecraft crea la dimensión al cargar el datapack).

## C) Desplegar y habilitar

1. Commit + push en este repo (commits como el usuario, sin trailer de Claude).
2. `ssh mcserver mc-update` → hace git pull, rsync de `mods/`, `config/` **y** del datapack
   `datapacks/realm_dimensions/` → `world/datapacks/`, con `chown -R 1000:0`, y reinicia vía API.
   - ⚠️ Si `mc-update` aún no sincroniza el datapack, hay que extender ese script en el VPS
     (`/usr/local/bin/mc-update`, dejar backup `.bak`) para añadir el rsync del datapack + chown.
3. **Alta única** de un datapack nuevo en un mundo existente:
   `ssh mcserver mc-cmd "datapack enable \"file/realm_dimensions\""` y reiniciar. Queda persistido en
   `level.dat`; no repetir.

## D) Persistencia ("que no se borren")

- La data de chunks vive en `world/dimensions/sb/<nombre>/region/*.mca` y **persiste sola**.
- La dim se registra mientras el datapack esté presente + habilitado en cada arranque. Al estar
  **versionado en git** y **redeployado por mc-update**, no se puede perder.
- Backups diarios de Crafty (04:00 UTC) snapshotean el mundo entero → red extra. **Nunca borres** el
  datapack ni su entrada en `level.dat`.

## E) Verificar

- `python3 -m json.tool <archivo>` en cada JSON nuevo.
- `mc-cmd "datapack list"` → `realm_dimensions` enabled.
- `mc-cmd "execute in sb:<dim> run tp <jugador> 0 200 0"` → entra y genera terreno.
- Portal: construir el marco, prenderlo con el igniter → abre solo si el viaje está permitido.
- Reiniciar y reconectar → dim y terreno siguen ahí.

## Qué NO hacer (anti-bloat)

- ❌ NO usar KubeJS para crear dimensiones ni portales (un datapack plano es más robusto; KubeJS solo
  si algún día querés *reglas de gameplay* por dimensión, ej. "2× daño a mobs", y aun así evaluá
  primero si conviene).
- ❌ NO agregar mods de portal externos (en 1.20.1 no hay opción robusta; el mecanismo ya es nativo).
- ❌ NO registrar un bloque/item nuevo por dimensión. Frame e igniter son vanilla, configurables.
- ❌ NO recompilar realmgates por una dimensión o portal nuevos. Solo por cambios al *mecanismo*.

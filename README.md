# MCserver — Modpack (Forge 1.20.1)

Modpack del servidor **summerBuddies**. Aquí se distribuyen los **mods** y **configs**.
El mundo, logs y archivos del servidor NO están aquí (cambian constantemente).

## 🎮 Para jugadores

### Primera vez
Clona este repo dentro de la carpeta de tu instancia de Minecraft (la que tiene `mods/`, `config/`):

```bash
git clone https://github.com/Otogr28/MCserver.git
```

Copia el contenido de `mods/` y `config/` a tu instancia de Forge 1.20.1.

#### Mod de traducción (opcional)
El mod **translate** traduce el chat usando tu propia clave de API (no se comparte).
Si lo quieres usar: copia `config/translator.config.example` a `config/translator.config`
y pon tu clave gratuita de DeepL (https://www.deepl.com/pro-api). Si no, el mod queda inactivo
(`enabled=false`) y no molesta.

### Cuando cambie un mod o config
Solo entra a la carpeta del repo y:

```bash
git pull
```

Vuelve a copiar `mods/` y `config/` a tu instancia (o clona directamente sobre ella).

> Necesitas **Forge 1.20.1** instalado en tu launcher.

## 🛠️ Para el admin

- Fuente de verdad: tu PC (`~/MCserver`).
- `git push` → GitHub → el servidor hace `git pull` y reinicia.

CANCIÓN DEL EPÍLOGO — ya está lista
===================================

Archivo:    epilogue_theme.ogg   (en ESTA carpeta — YA descargado y convertido, ~30s)
Sound id:   summerbuddies:epilogue_theme
Lo usa:     config/storykit/sequences/epilogue.json  (acción "music")
Fuente:     https://youtu.be/jUuPiBkbMVA  (primeros ~30s)

⚠️ EL .ogg NO SE SUBE AL REPO (está en .gitignore: kubejs/assets/summerbuddies/sounds/*.ogg)
   Es audio con copyright. En TU cliente suena igual (el archivo está acá local). Para que lo escuchen
   los JUGADORES tenés que distribuirlo aparte (pasarles el .ogg) o quitar esa línea del .gitignore
   asumiendo la redistribución pública. El SERVER no necesita el .ogg (solo el cliente reproduce el sonido).

LOS FADES YA NO SE HORNEAN ACÁ
------------------------------
StoryKit ahora hace el fade in/out de la música él mismo (acciones "music" fadeIn / "music_stop" fadeOut),
así que el .ogg es la canción "cruda". No hace falta tocarlo en Audacity.

¿Querés otro pedazo de la canción (no los primeros 30s)?
-------------------------------------------------------
Volvé a bajarlo cambiando el rango de tiempo (ej. el estribillo en 1:10):
  yt-dlp -x --audio-format vorbis --download-sections "*1:10-1:40" -o epilogue_src.%(ext)s 'URL'
  ffmpeg -y -i epilogue_src.ogg -t 30 -ac 2 -ar 44100 -c:a libvorbis -q:a 5 epilogue_theme.ogg
(El .ogg debe durar >= ~27s para cubrir la cinemática.)

(Este .txt es inofensivo; Minecraft ignora todo lo que no sea .ogg en esta carpeta.)

⚠️ NOMBRE EN MINÚSCULAS OBLIGATORIO: KubeJS escanea TODO archivo bajo kubejs/assets/ y valida su
   nombre como ResourceLocation (solo [a-z0-9/._-]). Una mayúscula en el nombre (ej. "README...")
   CRASHEA el arranque del cliente ("KubeJS startup script errors → Invalid file name: Uppercase 'R'").
   Por eso este archivo se llama "readme_..." en minúsculas. No le pongas mayúsculas al renombrarlo.

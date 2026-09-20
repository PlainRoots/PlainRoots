# PlainRoots

[English](README.md)

¿Es tu primera vez con GitHub y las herramientas de línea de comandos? Consulta
la [guía de primeros pasos en inglés](GETTING-STARTED.md).

**PlainRoots es un formato de historia familiar nativo de Git y legible por
personas.**

Los registros familiares se guardan en JSON claro, mientras que los archivos
HTML, imágenes, reportes imprimibles y reportes de texto son vistas generadas.
La fuente puede comprenderse sin el generador y está organizada para producir
diferencias significativas y pull requests fáciles de revisar.

> Todas las personas, fechas, relaciones, historias y fuentes de este
> repositorio son ficticias. El repositorio es una implementación pública de
> referencia y no contiene información o fotografías reales.

> **Aviso:** PlainRoots es una prueba de concepto de una solución de genealogía
> nativa de Git e IA, concebida para fines educativos y experimentales. Úsala
> bajo tu propio riesgo. Quien utilice este software con datos reales es
> responsable de los controles de acceso, consentimientos, respaldos,
> cumplimiento de las leyes aplicables y cualquier consecuencia resultante. El
> software se proporciona "tal cual," sin garantía alguna. Consulta la
> [Licencia MIT](LICENSE) para conocer los términos aplicables, incluidas las
> limitaciones de responsabilidad.

## Por qué PlainRoots

- Conserva la historia familiar en archivos de texto UTF-8 independientes de
  aplicaciones propietarias.
- Permite revisar correcciones mediante diferencias de Git enfocadas, en vez
  de reemplazar una exportación opaca de una base de datos.
- Usa ramas y pull requests para discutir la evidencia antes de publicarla.
- Genera árboles, fichas, reportes y mensajes en el inglés canónico y en cada
  configuración regional adicional definida en `supported-locales.json`.
- Conserva notas de investigación y procedencia junto a los datos que explican.
- Produce vistas completas, de ascendencia, descendencia, parientes
  consanguíneos, impresión y terminal.
- Resalta información faltante sin modificar las vistas publicadas normales.

## Familia de referencia

La familia ficticia García-Smith demuestra:

- Familiares conectados en México, Estados Unidos y España.
- Registros fuente en inglés y traducciones narrativas al español de México.
- Nombres y lugares con acentos Unicode.
- Un matrimonio del mismo sexo.
- Una rama con un solo progenitor.
- Hermanos cuyos padres se desconocen, sin inventar progenitores.
- Una relación de crianza separada de la ascendencia biológica.
- Comentarios, notas de investigación, orientación del proyecto y procedencia
  explícita.
- Valores desconocidos que permanecen visibles como preguntas de investigación.

Los ejemplos son deliberadamente comunes y no deben interpretarse como
afirmaciones acerca de personas reales.

## Idiomas admitidos

El inglés (`en-US`) es la configuración regional canónica y siempre se admite.
El archivo raíz `supported-locales.json` enumera todas las configuraciones
adicionales cuyas traducciones son obligatorias y cuyas salidas se generan.
Los IDs, nombres de recursos y claves de traducción usan la capitalización
canónica de BCP 47. Agrega una configuración al manifiesto y proporciona su
recurso y traducciones completas; los comandos estándar de generación,
reporte, renderizado y validación la descubren automáticamente.

## Estructura fuente

```text
PlainRoots/
|-- tree.json
|-- research-notes.json
|-- research-notes.translations.json
|-- supported-locales.json
|-- locales/
|   |-- en-US.json
|   `-- es-MX.json
|-- people/
|   `-- person-id/
|       |-- person.json
|       |-- translations.json
|       |-- story-*.md
|       |-- story-*.jpg
|       |-- story-*.m4a
|       `-- card*.html
|-- scripts/
|-- templates/
|-- styles.css
`-- tree.js
```

`tree.json`, `research-notes.json`, los recursos regionales, los registros de
personas, las traducciones narrativas y los medios opcionales son datos fuente.
No edites manualmente los archivos HTML generados.

## Registros de personas y fotografías

Los registros de personas pueden incluir `deathPlace` junto con `deathDate`.
Usa `"Unknown"` cuando se desconozca el lugar de fallecimiento y agrega cada
valor conocido al diccionario `deathPlaces` de todos los recursos regionales.
Las fichas combinan cada fecha de nacimiento o fallecimiento con su lugar en
una sola fila localizada de evento de vida.

Guarda las fechas de las personas como `YYYY-MM-DD`, `YYYY-MM` o `YYYY`,
conservando la precisión respaldada por la evidencia.

Cada registro de persona incluye `sex`, con uno de los valores `"male"`,
`"female"`, `"intersex"`, `"unknown"` o `"not-recorded"`. Este valor existe
para el intercambio de datos genealógicos y se asigna directamente a
`INDI.SEX` de GEDCOM 5.5.5; las etiquetas de las relaciones familiares no
deben inferirse a partir de este valor.

Establece `lifeStatus` como `"living"`, `"deceased"` o `"unknown"`. Al agregar o
revisar los datos fuente, presume que toda persona mayor de 110 años está
fallecida, salvo que una fuente confiable confirme explícitamente que sigue
viva. Para un mes o año de nacimiento sin fecha completa, aplica este valor
predeterminado solo cuando todas las fechas posibles de ese periodo hagan que
la persona sea mayor de 110 años. Los reportes muestran el estado almacenado
sin reemplazarlo.

Los registros pueden incluir `alternateNames`. Cada entrada necesita nombre,
etiqueta de idioma BCP 47, tipo y evidencia; la transliteración es opcional.
Usa:

| Tipo | Significado |
| --- | --- |
| `documented-variant` | Una forma u ortografía diferente que aparece realmente en una fuente, incluida una ortografía fonética institucional |
| `married-name` | Un nombre documentado que la persona usó después del matrimonio |
| `nickname` | Un apodo confirmado |
| `confirmed-original-spelling` | La ortografía confirmada en el idioma o sistema de escritura original |
| `likely-original-spelling` | Una reconstrucción no confirmada en el idioma original, respaldada por investigación lingüística e histórica |
| `translated-name-equivalent` | Un equivalente reconocido en otro idioma, sin afirmar que la persona lo usó |

Usa `maidenName` para un apellido de soltera confirmado. Los nombres
equivalentes o reconstruidos nunca deben reemplazar el nombre para mostrar de
la persona, y su evidencia debe explicar la incertidumbre.

Los registros también pueden incluir un arreglo `stories` para relatos escritos
por esa persona. Cada entrada necesita un `id` ASCII estable en minúsculas y un
objeto `original` con título, un archivo Markdown `content` no vacío y una
etiqueta de idioma BCP 47. Una `date` opcional acepta `YYYY`, `YYYY-MM` o
`YYYY-MM-DD`.
El objeto `translations`, indexado por idioma, puede proporcionar títulos y
contenido localizados. Los objetos opcionales `audio` e `images` adjuntan los
medios originales; cada imagen requiere texto alternativo no vacío y puede
incluir un pie y textos localizados. Conserva todos los archivos en la carpeta
del autor y usa nombres ASCII en minúsculas separados por guiones.

Los archivos de audio se almacenan con Git LFS. Los formatos admitidos son AAC,
FLAC, M4A, MP3, OGG, WAV y WebM. Procura mantener el audio de las historias en
5 MiB o menos; los archivos mayores de 10 MiB no pasan la validación. Nunca
sobrescribas un archivo de historia existente. Los reportes imprimibles
presentan el contenido y las imágenes localizados con enlaces opcionales al
audio y al texto. Los archivos faltantes son vacíos recuperables del archivo,
pero los archivos de contenido existentes no pueden estar vacíos.

Cuando no hay retrato, las fichas muestran como máximo cuatro iniciales: las
primeras dos de `givenNames`, seguidas de las primeras dos de `surnames`. Nunca
sobrescribas ni elimines un retrato existente al agregar uno mejor; consérvalo
y usa el siguiente nombre numerado, como `photo-2.jpg`. Incluye fotografías sin
edición mediante IA, preferentemente de las personas cuando tenían entre 20 y
39 años.

Las familias con dos integrantes usan `unknown` de manera predeterminada
cuando se omite `relationship`. Usa `"relationship": "married"` o
`"relationship": "divorced"` solo cuando el estado esté confirmado, y
`"relationship": "partnered"` para una unión informal o no matrimonial
confirmada. Los matrimonios conocidos deben guardar siempre
`"relationship": "married"` de forma explícita. Las etiquetas de grupos de
hermanos se derivan de los apellidos registrados, no de los IDs internos de
familia. Un único grupo de hermanos visible se incorpora directamente a la
fila de su generación. Las vistas previas PNG enfocadas en una persona usan
`<person-id>.<view>.<locale>.png`, lo que evita sobrescribir las vistas de otras
personas.

## Exportación a GEDCOM

Exporta el árbol canónico completo como GEDCOM 5.5.5 en UTF-8:

```powershell
npm run export:gedcom
npm run export:gedcom -- --output exports\family-tree.ged
```

La salida predeterminada es el archivo ignorado `family-tree.ged`. Los archivos
existentes no se reemplazan salvo que se especifique `--force`. La exportación
incluye los datos completos de las personas vivas y muestra un aviso destacado
de información sensible antes de compartir el archivo.

Se exportan personas, nombres, sexo, nacimientos, fallecimientos, ocupaciones,
familias, hijos, grupos de hermanos con padres desconocidos y relaciones de
crianza. Las familias `partnered` usan `EVEN` con
`TYPE Unmarried partnership`; las familias con relación desconocida omiten los
eventos de matrimonio y unión. Las relaciones de crianza usan un enlace de familia separado con
`PEDI foster`, sin cambiar la ascendencia biológica. La edad de inicio y la
evidencia no tienen una representación directa en GEDCOM 5.5.5 y se informan
como omitidas. Las historias, notas de investigación, fotografías y nombres
alternativos que no sean apodos y no tengan componentes de nombre
independientes también se omiten con advertencias.

GEDCOM 5.5.5 trata `FAM.HUSB` y `FAM.WIFE` como etiquetas históricas para
integrantes de una pareja y normalmente permite como máximo una de cada tipo.
Para mantener compatibilidad con aplicaciones que representan parejas del
mismo sexo mediante etiquetas repetidas, PlainRoots exporta deliberadamente
dos registros `HUSB` para dos integrantes masculinos o dos registros `WIFE`
para dos integrantes femeninas, e informa esta extensión mediante una
advertencia.

Consulta el [inventario de limitaciones de la exportación GEDCOM, en
inglés](GEDCOM-EXPORT-LIMITATIONS.md) para ver toda la funcionalidad omitida,
reducida, no estándar o exclusiva del repositorio.

## Revisión de importaciones GEDCOM

Analiza un archivo GEDCOM 5.5, 5.5.1 o 5.5.5 sin modificar los registros fuente
de PlainRoots:

```powershell
npm run import:gedcom -- --input ruta\familia.ged
```

El comando crea un paquete de revisión ignorado en
`.plainroots-import/<nombre-del-archivo>/` con personas y relaciones
propuestas, diagnósticos, registros fuente no resueltos e `IMPORT-REPORT.md`.
Acepta archivos UTF-8, UTF-16 y ASCII; rechaza ANSEL en vez de decodificarlo de
forma incorrecta. No existe un modo automático para aplicar o combinar los
datos.

Consulta [Importing GEDCOM for review, en inglés](GEDCOM-IMPORT.md) para ver
las asignaciones, medidas de seguridad, pérdidas conocidas y el flujo de
aprobación.

## Modelo de contribución

1. Crea una rama descriptiva.
2. Modifica la menor cantidad posible de archivos fuente.
3. Explica la evidencia y cualquier incertidumbre pendiente.
4. Genera e inspecciona cada configuración regional definida.
5. Ejecuta todas las validaciones.
6. Abre un pull request cuya diferencia cuente la historia de la corrección.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para ver la lista completa.

## Dirección del formato

Este repositorio es una implementación de referencia en desarrollo, no un
estándar finalizado. El trabajo planeado incluye JSON Schemas versionados,
relaciones con tipos independientes, afirmaciones y fuentes de primera clase,
controles de privacidad e importación y exportación GEDCOM 7 conscientes de
pérdidas.

## Licencia

PlainRoots se distribuye bajo la [Licencia MIT](LICENSE).

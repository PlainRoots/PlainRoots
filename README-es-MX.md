# PlainRoots

[English](README.md)

**PlainRoots es un formato de historia familiar nativo de Git y legible por
personas.**

Los registros familiares se guardan en JSON claro, mientras que los archivos
HTML, imágenes, reportes imprimibles y reportes de texto son vistas generadas.
La fuente puede comprenderse sin el generador y está organizada para producir
diferencias significativas y pull requests fáciles de revisar.

> Todas las personas, fechas, relaciones, historias y fuentes de este
> repositorio son ficticias. El repositorio es una implementación pública de
> referencia y no contiene datos ni fotografías del árbol familiar privado que
> lo inspiró.

## Por qué PlainRoots

- Conserva la historia familiar en archivos de texto UTF-8 independientes de
  aplicaciones propietarias.
- Permite revisar correcciones mediante diferencias de Git enfocadas, en vez
  de reemplazar una exportación opaca de una base de datos.
- Usa ramas y pull requests para discutir la evidencia antes de publicarla.
- Genera árboles, fichas, reportes y mensajes en inglés y español de México a
  partir de los mismos registros canónicos.
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

## Requisitos

- Git
- Node.js 20 o posterior
- Microsoft Edge o Google Chrome para capturar vistas previas PNG

No se requieren paquetes npm de terceros.

## Primeros pasos

```powershell
git clone <repository-url>
cd PlainRoots
npm run check
npm run check:mx-ES
npm run check:translations
```

Abre `index.html` para ver el árbol en inglés o `index.mx-ES.html` para ver la
versión en español de México.

## Estructura fuente

```text
PlainRoots/
|-- tree.json
|-- research-notes.json
|-- research-notes.translations.json
|-- locales/
|   |-- us-EN.json
|   `-- mx-ES.json
|-- people/
|   `-- person-id/
|       |-- person.json
|       |-- translations.json
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

Establece `lifeStatus` como `"living"`, `"deceased"` o `"unknown"`. Al agregar o
revisar los datos fuente, presume que toda persona mayor de 110 años está
fallecida, salvo que una fuente confiable confirme explícitamente que sigue
viva. Para un año de nacimiento sin fecha completa, aplica este valor
predeterminado solo cuando todas las fechas posibles de ese año hagan que la
persona sea mayor de 110 años. Los reportes muestran el estado almacenado sin
reemplazarlo.

Cuando no hay retrato, las fichas muestran como máximo cuatro iniciales: las
primeras dos de `givenNames`, seguidas de las primeras dos de `surnames`. Nunca
sobrescribas ni elimines un retrato existente al agregar uno mejor; consérvalo
y usa el siguiente nombre numerado, como `photo-2.jpg`. Incluye fotografías sin
edición mediante IA, preferentemente de las personas cuando tenían entre 20 y
39 años.

Las familias con dos integrantes usan `married` de manera predeterminada;
establece `"relationship": "divorced"` cuando el conector deba comunicar un
divorcio. Las etiquetas de grupos de hermanos se derivan de los apellidos
registrados, no de los IDs internos de familia. Un único grupo de hermanos
visible se incorpora directamente a la fila de su generación. Las vistas
previas PNG enfocadas en una persona usan
`<person-id>.<view>.<locale>.png`, lo que evita sobrescribir las vistas de otras
personas.

## Comandos útiles

```powershell
npm start
npm run generate
npm run generate:mx-ES
npm run check
npm run check:mx-ES
npm run check:translations
npm run report
npm run report:mx-ES
npm run view:ascii -- --view ancestry --person sofia-garcia-smith
npm run render
npm run render:mx-ES
```

Las vistas enfocadas aceptan identificadores estables como
`sofia-garcia-smith`, `daniel-garcia-smith` y `diego-garcia`.

Agrega `--highlight-missing` a los comandos de generación, validación, reporte
o renderizado para crear una vista separada de vacíos de investigación.

## Modelo de contribución

1. Crea una rama descriptiva.
2. Modifica la menor cantidad posible de archivos fuente.
3. Explica la evidencia y cualquier incertidumbre pendiente.
4. Genera e inspecciona ambos idiomas.
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

# MiBalance

Visualizador de finanzas personales con guardado automatico en Excel.

El objetivo del proyecto es permitir registrar ingresos, gastos personales, gastos generales e inversiones desde una pantalla simple. Los datos se guardan automaticamente en un archivo Excel para que puedan consultarse, respaldarse o exportarse.

## Funcionalidades

- Proyecto Node.js con TypeScript.
- Visualizador web.
- Formulario para registrar movimientos sin abrir Excel.
- Guardado automatico en `MiBalance.xlsx`.
- Resumen general de ingresos, gastos, inversiones y balance.
- Comparacion mensual.
- Resumen anual en grafico.
- Tabla de movimientos con filtros.
- Paginado de movimientos cada 20 registros.
- Edicion y eliminacion de movimientos.
- Lectura de registros desde Excel.
- Generacion de plantilla Excel.

## Requisitos

- Node.js instalado.
- npm instalado.

## Instalacion

```bash
npm install
```

## Comandos

Abrir el visualizador local:

```bash
npm run app
```

Despues entrar en el navegador a:

```text
http://localhost:3000
```

Crear una plantilla vacia:

```bash
npm run template
```

Generar un archivo demo y ver el reporte en consola:

```bash
npm run demo
```

Cargar un archivo Excel existente:

```bash
npm run load -- MiBalance.xlsx
```

Validar TypeScript sin generar archivos:

```bash
npm run check
```

Compilar el proyecto:

```bash
npm run build
```

Ejecutar la version compilada:

```bash
npm start
```

Ejecutar el reporte de consola compilado:

```bash
npm run start:cli
```

## Deploy

La app esta preparada para deploy como servicio web Node.js. Por ejemplo, en Render:

1. Subir el codigo a GitHub.
2. Crear un nuevo `Web Service` en Render.
3. Conectar el repositorio.
4. Usar estos comandos:

```bash
npm ci && npm run build
```

```bash
npm start
```

El archivo `render.yaml` tambien permite crear el servicio desde Render Blueprint.

Nota: en hostings gratuitos el archivo `MiBalance.xlsx` puede no ser persistente entre reinicios o redeploys. Para una demo o entrega academica sirve. Para uso real conviene migrar el almacenamiento a una base de datos o usar un disco persistente.

## Formato del Excel

El usuario no necesita abrir Excel para cargar datos. La app crea y actualiza `MiBalance.xlsx` automaticamente.

Si se quiere revisar o importar manualmente, la hoja debe llamarse `Finanzas` y tener estas columnas:

| Columna | Descripcion |
| --- | --- |
| Fecha | Fecha del movimiento |
| Descripcion | Nombre o detalle del movimiento |
| Categoria | Ingreso, Gasto Personal, Gasto General o Inversion |
| Subcategoria | Ejemplo: Salario, Supermercado, Alquiler, Acciones |
| Monto | Importe numerico |
| Notas | Comentarios opcionales |

## Archivos importantes

- `src/`: codigo fuente TypeScript.
- `plantilla.xlsx`: plantilla base para cargar movimientos.
- `MiBalance.xlsx`: archivo local/generado con datos personales o demo. Lo actualiza el visualizador y no se sube al repositorio.
- `dist/`: salida compilada. No se sube al repositorio.


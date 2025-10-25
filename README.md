# Trabajo Práctico Integrador

## Ingeniería aplicada a la comunicación de datos

**Materia:** Comunicación de Datos

**Comisión:** S31

**Año:** 2025

**Profesores:** Gerardo Leskiw y Agustin Alvarez Ferrando

**Propuesta:** Una aplicación que permita cargar o grabar audio en formato analógico (o simulado) y convertirlo a distintas resoluciones digitales, mostrando cómo varían la calidad y el tamaño del archivo según la configuración de muestreo y cuantización.

* Vamos a desarrollar las siguientes funcionalidades:
   * [x] Grabación de audio en tiempo real con un micrófono.
   * [x] Exportación del audio digitalizado en formatos como WAV o MP3.
   * [x] Cuantización con distintas profundidades de bits (8, 16, 24 bits).

**Arquitectura:** Vamos a utilizar una arquitectura web, específicamente una SPA (Single Page Application).

**Herramientas y tecnologías:** Vamos a utilizar IDEs del tipo de Visual Studio Code. En cuanto a tecnologías elegimos React y tailwindcss para el frontend y FastAPI (Python) para el backend.

## Ejecución con Docker

La forma más sencilla de levantar el proyecto completo (frontend y backend) es utilizando Docker Compose:

```bash
docker compose up
```

Esto levantará ambos servicios:
- **Backend:** disponible en `http://localhost:8002`
- **Frontend:** disponible en `http://localhost:8082`

Para detener los servicios:

```bash
docker compose down
```

## Backend

```bash
sudo apt update
sudo apt install python3-pip
```

```bash
cd backend/FastAPI/
```

```bash
python3 -m venv .venv && source .venv/bin/activate
```

Descargar algunas dependencias

```bash
pip install -r requirements.txt
```

Ejecutar el servidor

```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

## Frontend

Instalar [Node.js](https://nodejs.org/es/download)

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```


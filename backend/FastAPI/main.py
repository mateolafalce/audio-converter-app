from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from pydub import AudioSegment
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/convert")
async def convert_audio(
    file: UploadFile = File(...),
    bit_depth: int = Form(...),
    format: str = Form(...)
):
    # Leer archivo de entrada
    contents = await file.read()

    # Cargar audio con pydub
    audio = AudioSegment.from_file(io.BytesIO(contents))

    # Ajustar profundidad de bits
    if bit_depth == 8:
        audio = audio.set_sample_width(1)
    elif bit_depth == 16:
        audio = audio.set_sample_width(2)
    elif bit_depth == 24:
        audio = audio.set_sample_width(3)
    else:
        return {"error": "Profundidad de bits no soportada (solo 8, 16 o 24)."}

    # Convertir y preparar respuesta
    output_io = io.BytesIO()
    export_format = format.lower()

    # Exportar a WAV o MP3
    if export_format in ["wav", "mp3"]:
        audio.export(output_io, format=export_format)
        output_io.seek(0)
        return StreamingResponse(
            output_io,
            media_type=f"audio/{export_format}",
            headers={"Content-Disposition": f"attachment; filename=converted.{export_format}"}
        )
    else:
        return {"error": "Formato de salida no soportado (solo 'wav' o 'mp3')."}
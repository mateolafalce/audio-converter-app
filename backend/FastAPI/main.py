from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def convert_audio_with_bit_depth(audio_segment, bit_depth, format):
    output_io = io.BytesIO()
    
    if format == "wav":
        sample_width = bit_depth // 8
        audio_segment = audio_segment.set_sample_width(sample_width)
    
    export_kwargs = {"format": format}
    if format == "mp3":
        export_kwargs["bitrate"] = "192k"
    
    audio_segment.export(output_io, **export_kwargs)
    output_io.seek(0)
    return output_io.getvalue()

@app.post("/convert")
async def convert_audio(
    file: UploadFile = File(...),
    bit_depth: int = Form(16),
    use_selection: str = Form("false")
):
    try:
        input_bytes = await file.read()
        
        # Cargar el audio desde los bytes recibidos
        audio = AudioSegment.from_file(io.BytesIO(input_bytes), format="wav")
        
        formats = ["wav", "mp3"]
        bit_depths = [8, 16, 24]
        results = []
        
        for format in formats:
            for depth in bit_depths:
                try:
                    file_bytes = convert_audio_with_bit_depth(audio, depth, format)
                    encoded_content = base64.b64encode(file_bytes).decode('utf-8')
                    
                    results.append({
                        "format": format,
                        "bit_depth": depth,
                        "content": encoded_content,
                        "size": len(file_bytes),
                        "mime_type": f"audio/{format}"
                    })
                except Exception as e:
                    continue
        
        return JSONResponse(content={"results": results})
    
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
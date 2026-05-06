from __future__ import annotations

import io
import tempfile
from pathlib import Path

from django.http import FileResponse, JsonResponse
from django.shortcuts import render
from PIL import Image

from .stego import decode_message, encode_message


def index(request):
    return render(request, "index.html")


def encode_view(request):
    """
    Encode a message into an image.
    Accepts uploaded files or camera captures (as blobs).
    Returns encoded image as binary data for download (not saved).
    """
    if request.method == "POST":
        image = request.FILES.get("image")
        message = request.POST.get("message", "")

        if not image:
            return JsonResponse({"error": "Please choose an image to encode."}, status=400)

        if not message:
            return JsonResponse({"error": "Please enter a message to encode."}, status=400)

        try:
            # Create temporary files in memory/temp directory
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as input_temp:
                input_temp.write(image.read())
                input_path = input_temp.name

            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as output_temp:
                output_path = output_temp.name

            # Encode the message
            encode_message(input_path, message, output_path)

            # Read the encoded image into BytesIO buffer
            with open(output_path, "rb") as encoded_file:
                buffer = io.BytesIO(encoded_file.read())
            
            buffer.seek(0)
            response = FileResponse(
                buffer,
                content_type="image/png",
                as_attachment=True,
                filename="encoded.png"
            )
            
            # Cleanup temp files
            Path(input_path).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)

            return response

        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)
        except Exception as exc:
            return JsonResponse({"error": f"Encoding failed: {str(exc)}"}, status=500)

    return render(request, "index.html")


def decode_view(request):
    """
    Decode a message from an image.
    Accepts uploaded files only (no camera).
    Returns decoded message as JSON.
    """
    if request.method == "POST":
        image = request.FILES.get("image")

        if not image:
            return JsonResponse({"error": "Please choose an image to decode."}, status=400)

        try:
            # Create temporary file for upload
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
                temp_file.write(image.read())
                image_path = temp_file.name

            # Decode the message
            message = decode_message(image_path)

            # Cleanup temp file
            Path(image_path).unlink(missing_ok=True)

            return JsonResponse({"decoded": message})

        except Exception as exc:
            return JsonResponse({"error": f"Decode failed: {str(exc)}"}, status=400)

    return render(request, "index.html")

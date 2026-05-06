from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from PIL import Image

END_MARKER = "###"


def _to_rgb(image: Image.Image) -> Image.Image:
    if image.mode == "RGB":
        return image
    return image.convert("RGB")


def _message_to_bits(message: str) -> str:
    payload = f"{message}{END_MARKER}"
    return "".join(f"{ord(character):08b}" for character in payload)


def _bits_to_message(bits: str) -> str:
    characters = []
    for index in range(0, len(bits), 8):
        chunk = bits[index:index + 8]
        if len(chunk) < 8:
            break
        characters.append(chr(int(chunk, 2)))
        if "".join(characters).endswith(END_MARKER):
            return "".join(characters)[:-len(END_MARKER)]
    return "".join(characters).replace(END_MARKER, "")


def encode_message(image_path: str | Path, message: str, output_path: str | Path) -> None:
    image = _to_rgb(Image.open(image_path))
    encoded = image.copy()
    width, height = image.size
    bits = _message_to_bits(message)
    bit_index = 0

    for row in range(height):
        for column in range(width):
            if bit_index >= len(bits):
                encoded.save(output_path)
                return

            red, green, blue = image.getpixel((column, row))
            channels = [red, green, blue]

            for channel_index in range(3):
                if bit_index >= len(bits):
                    break
                channels[channel_index] = channels[channel_index] & ~1 | int(bits[bit_index])
                bit_index += 1

            encoded.putpixel((column, row), tuple(channels))

    if bit_index < len(bits):
        raise ValueError("The selected image does not have enough capacity for that message.")

    encoded.save(output_path)


def decode_message(image_path: str | Path) -> str:
    image = _to_rgb(Image.open(image_path))
    bits = []

    for row in range(image.size[1]):
        for column in range(image.size[0]):
            red, green, blue = image.getpixel((column, row))
            bits.append(str(red & 1))
            bits.append(str(green & 1))
            bits.append(str(blue & 1))

    return _bits_to_message("".join(bits))


def unique_upload_path(original_name: str, folder: str = "uploads") -> Path:
    suffix = Path(original_name).suffix or ".png"
    return Path(folder) / f"{uuid4().hex}{suffix}"

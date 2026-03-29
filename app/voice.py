import os
import io
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
import base64

load_dotenv()
el_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah — warm and clear

def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio using ElevenLabs Scribe STT"""
    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename
        response = el_client.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v1",
            language_code="en"
        )
        return response.text
    except Exception as e:
        print(f"ElevenLabs STT error: {e}")
        return None

def generate_audio_b64(text: str) -> str:
    """Generate ElevenLabs TTS audio and return as base64 string for browser playback"""
    try:
        audio = el_client.text_to_speech.convert(
            voice_id=VOICE_ID,
            text=text,
            model_id="eleven_turbo_v2",
            output_format="mp3_44100_128"
        )
        audio_bytes = b"".join(audio)
        return base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print(f"ElevenLabs TTS error: {e}")
        return None

def build_step_script(step: dict, child_name: str = "there") -> str:
    """Build the voice script for a micro-step"""
    return f"Hey {child_name}! {step['action']}. This takes about {step['seconds']} seconds."

def build_celebration_script(celebration: str, child_name: str = "there") -> str:
    """Build celebration voice line"""
    return f"{child_name}, {celebration}"

def build_what_now_script(task_name: str, reason: str, first_step: str) -> str:
    """Build the 'what should I do now' voice line"""
    return f"Okay! Right now, let's do {task_name}. {reason}. Your first step is: {first_step}."

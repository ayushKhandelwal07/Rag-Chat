import httpx
from dotenv import load_dotenv
import os

load_dotenv()

OPENROUTER_URL = os.getenv("OPENROUTER_URL")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL") 

def generate_response(prompt: str) -> str:
    try:
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You answer strictly from the provided Context derived from the current PDF(s). "
                        "If the answer is not found in the Context, reply: \"I couldn't find this in the provided document.\" "
                        "Be concise and only include information present in the Context. Do not use external knowledge."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        response = httpx.post(OPENROUTER_URL, json=payload, headers=headers, timeout=180.0)
        response.raise_for_status()
        data = response.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
        if not content:
            raise Exception("Empty response from LLM API")
        return content
    except httpx.HTTPStatusError as e:
        raise Exception(f"LLM API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise Exception(f"LLM API error: {str(e)}")


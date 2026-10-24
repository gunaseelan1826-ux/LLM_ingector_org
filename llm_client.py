"""
llm_client.py
Handles forwarding safe prompts to the Gemini Large Language Model.
"""

import os
import json
import urllib.request
import urllib.error

from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_api_key():
    return os.getenv("GEMINI_API_KEY", "").strip()


def query_llm(prompt_text: str):
    """
    Forwards a verified safe prompt to Gemini.

    Returns:
        (response_text, None) on success
        (None, error_message) on failure
    """

    api_key = get_api_key()

    if not api_key:
        return None, "GEMINI_API_KEY is missing from the environment."

    # Gemini Interactions API endpoint
    url = "https://generativelanguage.googleapis.com/v1beta/interactions"

    # Request payload
    payload = {
        "model": "gemini-3.8-flash",
        "input": prompt_text
    }

    try:
        data = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        # Check API response status
        status = result.get("status")

        if status == "failed":
            error = result.get("error", {})
            return None, f"Gemini API Error: {error}"

        # Extract generated text from the Interactions API response
        for step in reversed(result.get("steps", [])):
            if step.get("type") == "model_output":
                for part in step.get("content", []):
                    if part.get("type") == "text":
                        text = part.get("text", "").strip()

                        if text:
                            return text, None

        return None, "Gemini did not return any text response."

    except urllib.error.HTTPError as e:
        raw_error = e.read().decode("utf-8", errors="replace")

        try:
            error_data = json.loads(raw_error)
            message = error_data.get("error", {}).get(
                "message", str(e)
            )
        except (json.JSONDecodeError, ValueError):
            message = raw_error or str(e)

        return None, f"Gemini API Error: {message}"

    except urllib.error.URLError as e:
        return None, f"Connection Error: {e.reason}"

    except Exception as e:
        return None, f"Connection Error: {str(e)}"
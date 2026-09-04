import os
import logging
from typing import Dict, Any
import httpx

logger = logging.getLogger("land_record.services.grok")

XAI_API_URL = "https://api.x.ai/v1/chat/completions"

def get_xai_api_key() -> str:
    return os.getenv("XAI_API_KEY", "").strip()

def explain_conflict_with_grok(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends conflict details to xAI Grok API to obtain legal, GIS, and urban planning
    recommendations for land record harmonization.
    """
    api_key = get_xai_api_key()
    if not api_key:
        return {
            "status": "error",
            "message": "XAI_API_KEY environment variable is not configured.",
            "provider": "xAI Grok"
        }

    prompt = (
        "You are an expert GeoAI Municipal Land Records Administrator and Urban Planner.\n"
        "Analyze the following land record conflict between cadastral survey and GIS layers:\n\n"
        f"- Conflict Type: {conflict_data.get('conflict_type')}\n"
        f"- Severity: {conflict_data.get('severity')}\n"
        f"- Description: {conflict_data.get('description')}\n"
        f"- Source A ({conflict_data.get('source_a', 'Documented')}): {conflict_data.get('expected_value')}\n"
        f"- Source B ({conflict_data.get('source_b', 'GIS Geometry')}): {conflict_data.get('observed_value')}\n"
        f"- Confidence Score: {conflict_data.get('confidence_score')}\n\n"
        "Provide a concise 3-sentence expert recommendation and legal resolution action for the land registrar officer."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # xAI Grok model candidates
    models = ["grok-3-latest", "grok-3", "grok-2-latest", "grok-beta"]
    
    quota_error_msg = None

    for model in models:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a professional GeoAI Land Record Harmonization Assistant."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 250
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(XAI_API_URL, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    return {
                        "status": "success",
                        "explanation": content.strip(),
                        "model": model,
                        "provider": "xAI Grok"
                    }
                elif res.status_code == 403:
                    logger.warning(f"xAI API key quota/credits exceeded for model {model}.")
                    quota_error_msg = "xAI Grok API key is valid & authenticated, but your xAI team has used all available credits or reached its spending limit."
                else:
                    logger.warning(f"xAI API model {model} returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error connecting to xAI Grok API: {e}")

    if quota_error_msg:
        return {
            "status": "quota_exceeded",
            "message": quota_error_msg,
            "provider": "xAI Grok"
        }

    return {
        "status": "error",
        "message": "Could not connect to xAI Grok service. Please check API key status and credits.",
        "provider": "xAI Grok"
    }


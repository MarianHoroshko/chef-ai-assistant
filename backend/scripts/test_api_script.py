import json
import logging
from typing import Dict, Optional

import requests
from requests import Response
from requests.exceptions import RequestException, Timeout

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
BASE_URL = "http://localhost:3000"
TIMEOUT_SECONDS = 5

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}


# -----------------------------------------------------------------------------
# Logging setup
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# HTTP Client
# -----------------------------------------------------------------------------
class ApiClient:
    def __init__(
        self,
        base_url: str,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = TIMEOUT_SECONDS,
    ):
        self.base_url = base_url.rstrip("/")
        self.headers = headers or {}
        self.timeout = timeout

    def _handle_response(self, response: Response) -> Dict:
        try:
            response.raise_for_status()
            return response.json()
        except json.JSONDecodeError:
            logger.error("Invalid JSON response: %s", response.text)
            raise
        except RequestException:
            logger.error(
                "HTTP error %s: %s",
                response.status_code,
                response.text,
            )
            raise

    def post(
        self,
        endpoint: str,
        payload: Optional[Dict] = None,
    ) -> Dict:
        url = f"{self.base_url}{endpoint}"
        logger.info("POST %s", url)

        try:
            response = requests.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=self.timeout,
            )
            return self._handle_response(response)
        except Timeout:
            logger.error("POST request timed out")
            raise


# -----------------------------------------------------------------------------
# Example test requests
# -----------------------------------------------------------------------------
def run_tests():
    client = ApiClient(
        base_url=BASE_URL,
        headers=DEFAULT_HEADERS,
    )

    session_id = None

    # start session
    try:
        post_response = client.post(endpoint="/api/session/start")

        session_id = post_response.get("sessionId")

        logger.info("POST response: %s", post_response)
    except Exception:
        logger.exception("POST test failed")

    if not session_id:
        return

    form_questions_and_answers = [
        {"questionId": "celebration_type", "userAnswer": "corporate event"},
        {
            "questionId": "guests_count",
            "userAnswer": "50 persons",
        },
        {"questionId": "guests_allergies", "userAnswer": "No"},
        {"questionId": "cuisine_style", "userAnswer": "Polish"},
        {"questionId": "taste_preferences", "userAnswer": "Spicy"},
        {"questionId": "kitchen_equipment", "userAnswer": "Kitchen fully equipped"},
        {"questionId": "time_guests_arrive", "userAnswer": "6 pm"},
        {"questionId": "persons_budget", "userAnswer": "350 zł"},
        {"questionId": "event_personalization", "userAnswer": "Christmas party"},
        {"questionId": "generate_note_file", "userAnswer": "Yes. Generate PDF file"},
    ]

    # fill form
    for step in form_questions_and_answers:
        try:
            post_payload = {
                "sessionId": session_id,
                "data": {
                    "questionId": step.get("questionId"),
                    "userAnswer": step.get("userAnswer"),
                },
            }

            post_response = client.post(
                endpoint="/api/form/step",
                payload=post_payload,
            )
            logger.info("POST response: %s", post_response)
        except Exception:
            logger.exception("POST test failed")


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    run_tests()

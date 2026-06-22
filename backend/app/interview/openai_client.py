import logging
import os
from typing import AsyncGenerator

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

OPENAI_MODEL = os.environ.get("OPENAI_INTERVIEW_MODEL", "gpt-4.1-mini")


def _get_client() -> AsyncOpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    return AsyncOpenAI(api_key=api_key)


def _extract_question(response) -> str:
    text = getattr(response, "output_text", None)
    if text and text.strip():
        return text.strip()

    for item in response.output or []:
        if item.type != "message":
            continue
        for content in item.content:
            if getattr(content, "type", None) == "output_text":
                t = getattr(content, "text", "")
                if t and t.strip():
                    return t.strip()

    raise RuntimeError("No question returned by model.")


async def start_interview(system_prompt: str) -> tuple[str, str]:
    client = _get_client()
    response = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        input=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": "Start the interview now by asking the first personalized question.",
            },
        ],
    )
    question = _extract_question(response)
    return response.id, question


async def continue_interview(
    previous_response_id: str, candidate_answer: str
) -> tuple[str, str]:
    client = _get_client()
    response = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        previous_response_id=previous_response_id,
        input=candidate_answer,
    )
    question = _extract_question(response)
    return response.id, question


async def start_interview_stream(
    system_prompt: str,
) -> AsyncGenerator[tuple[str, str | dict], None]:
    client = _get_client()
    stream = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        stream=True,
        input=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": "Start the interview now by asking the first personalized question.",
            },
        ],
    )

    response_id = ""
    question = ""

    async for event in stream:
        event_type = getattr(event, "type", "")

        response_data = getattr(event, "response", None)
        if not response_id and response_data and getattr(response_data, "id", None):
            response_id = response_data.id

        if event_type == "response.output_text.delta":
            delta = getattr(event, "delta", "")
            if delta:
                question += delta
                yield ("delta", {"delta": delta})

        if event_type == "response.completed":
            if response_data:
                text = getattr(response_data, "output_text", "") or ""
                if text and text.strip():
                    question = text.strip()
            if not response_id or not question.strip():
                raise RuntimeError("Streaming completed without question payload.")
            yield ("done", {"responseId": response_id, "question": question.strip()})
            return

    raise RuntimeError("OpenAI stream ended before completion.")


async def continue_interview_stream(
    previous_response_id: str, candidate_answer: str
) -> AsyncGenerator[tuple[str, str | dict], None]:
    client = _get_client()
    stream = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        stream=True,
        previous_response_id=previous_response_id,
        input=candidate_answer.strip(),
    )

    response_id = ""
    question = ""

    async for event in stream:
        event_type = getattr(event, "type", "")

        response_data = getattr(event, "response", None)
        if not response_id and response_data and getattr(response_data, "id", None):
            response_id = response_data.id

        if event_type == "response.output_text.delta":
            delta = getattr(event, "delta", "")
            if delta:
                question += delta
                yield ("delta", {"delta": delta})

        if event_type == "response.completed":
            if response_data:
                text = getattr(response_data, "output_text", "") or ""
                if text and text.strip():
                    question = text.strip()
            if not response_id or not question.strip():
                raise RuntimeError("Streaming completed without question payload.")
            yield ("done", {"responseId": response_id, "question": question.strip()})
            return

    raise RuntimeError("OpenAI stream ended before completion.")

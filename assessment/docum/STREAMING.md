STREAMING.md — Real-Time Response Rendering
Why Streaming
Instead of waiting for the full question to generate then displaying it, streaming sends each word (token) as it is generated. The candidate sees the question appear word by word in real time. Perceived wait time drops from 1-2 seconds to near zero — first word appears in ~200-300ms.

Hard Rules

Always use stream: true on every OpenAI Responses API call. No exceptions.
Never wait for the full response to complete before showing anything to the candidate.
The frontend must render each incoming chunk immediately as it arrives, token by token.


How It Works
Backend
When calling the Responses API, set stream: true. The response comes back as a stream of Server-Sent Events (SSE). Each event contains a small chunk of text. Forward these chunks directly to the frontend as they arrive — do not buffer or wait.
Frontend
Open a connection that listens for incoming chunks. Append each chunk to the displayed question text as it arrives. The candidate sees the question being written in real time, word by word.

The Experience Goal
The candidate submits their answer → within 200-300ms the next question starts appearing on screen, character by character. It feels instant and alive, like a real person is typing the question in response to what they just said.

Common Mistake to Avoid
Do not collect all chunks on the backend, assemble the full response, then send it to the frontend in one shot. This kills the entire benefit of streaming and brings you back to the 1-2 second wait. Stream end-to-end: OpenAI → backend → frontend, with no buffering at any layer.
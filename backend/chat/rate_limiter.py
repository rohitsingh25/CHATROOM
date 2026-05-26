"""Token-bucket rate limiter — one bucket per WebSocket channel."""
import asyncio
import time
import logging

logger = logging.getLogger(__name__)

MAX_TOKENS = 30          # burst capacity
REFILL_RATE = 0.5        # tokens added per second (~30/min sustained)


class RateLimiter:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            inst = super().__new__(cls)
            inst._buckets: dict = {}   # channel_name -> [tokens, last_refill_time]
            inst._lock = asyncio.Lock()
            cls._instance = inst
        return cls._instance

    async def is_allowed(self, channel_name: str) -> bool:
        async with self._lock:
            now = time.monotonic()
            if channel_name not in self._buckets:
                self._buckets[channel_name] = [MAX_TOKENS, now]

            tokens, last = self._buckets[channel_name]
            # Refill proportional to elapsed time
            tokens = min(MAX_TOKENS, tokens + (now - last) * REFILL_RATE)

            if tokens >= 1:
                tokens -= 1
                self._buckets[channel_name] = [tokens, now]
                return True

            self._buckets[channel_name] = [tokens, now]
            return False

    async def remove(self, channel_name: str):
        async with self._lock:
            self._buckets.pop(channel_name, None)


rate_limiter = RateLimiter()

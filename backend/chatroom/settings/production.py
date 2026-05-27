from .base import *  # noqa
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS — must explicitly allow the Vercel frontend origin so that both
# the REST API calls and the WebSocket HTTP-upgrade handshake are accepted.
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://rosychats.vercel.app'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# Use Redis channel layer in production (requires channels-redis)
# Uncomment and set REDIS_URL env var to enable:
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {'hosts': [config('REDIS_URL', default='redis://localhost:6379')]},
#     }
# }

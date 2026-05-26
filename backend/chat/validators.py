import re


def validate_room_code(code: str) -> bool:
    """4-digit numeric room code."""
    return bool(re.match(r'^[0-9]{4}$', str(code)))


def validate_username(username: str) -> tuple[bool, str]:
    name = username.strip() if username else ''
    if not name:
        return False, 'Username cannot be empty.'
    if len(name) < 2:
        return False, 'Username must be at least 2 characters.'
    if len(name) > 20:
        return False, 'Username must be at most 20 characters.'
    if not re.match(r'^[A-Za-z0-9_ \-]+$', name):
        return False, 'Username may only contain letters, numbers, spaces, hyphens, and underscores.'
    return True, ''

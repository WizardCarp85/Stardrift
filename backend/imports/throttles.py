from rest_framework.throttling import UserRateThrottle


class ImportRateThrottle(UserRateThrottle):
    """
    Rate limit file imports to 10 per minute per authenticated user.
    """
    rate = "10/minute"
    scope = "imports"

    def get_cache_key(self, request, view):
        if request.user and getattr(request.user, "is_authenticated", False):
            ident = (
                getattr(request.user, "id", None)
                or getattr(request.user, "pk", None)
                or getattr(request.user, "email", None)
            )
            if ident:
                return self.cache_format % {
                    "scope": self.scope,
                    "ident": str(ident),
                }
        return super().get_cache_key(request, view)


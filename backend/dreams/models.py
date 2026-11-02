"""
Stardrift Django models.
Schema mirrors the spec in the implementation plan §6.
"""
import uuid
from django.db import models


def default_reminder_days():
    return ["mon", "tue", "wed", "thu", "fri"]


class UserProfile(models.Model):
    """Shadow table for Supabase auth.users."""

    class ThemeChoice(models.TextChoices):
        DARK = "dark", "Dark"
        LIGHT = "light", "Light"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supabase_id = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField()
    display_name = models.CharField(max_length=255)
    timezone = models.CharField(max_length=100, default="UTC")
    theme_preference = models.CharField(
        max_length=10,
        choices=ThemeChoice.choices,
        default=ThemeChoice.DARK,
    )

    # Profile info
    bio = models.TextField(blank=True, default="")
    dream_intention = models.CharField(max_length=50, blank=True, default="recall")
    recall_habit = models.CharField(max_length=50, blank=True, default="wake")

    # Capture & Journal preferences
    default_log_mode = models.CharField(max_length=10, default="voice")
    default_dream_type = models.CharField(max_length=20, default="normal")
    default_sleep_quality = models.IntegerField(default=0)
    voice_language = models.CharField(max_length=20, default="en-US")
    auto_save_drafts = models.BooleanField(default=True)
    auto_suggest_tags = models.BooleanField(default=True)

    # Reminder preferences
    reminder_enabled = models.BooleanField(default=False)
    reminder_time = models.CharField(max_length=10, default="07:30")
    reminder_days = models.JSONField(default=default_reminder_days, blank=True)
    lucid_check_enabled = models.BooleanField(default=False)
    lucid_check_interval = models.CharField(max_length=10, default="3h")

    # AI & Patterns preferences
    ai_insights_enabled = models.BooleanField(default=True)
    ai_style = models.CharField(max_length=20, default="symbolic")
    default_pattern_days = models.IntegerField(default=90)
    include_nightmares_in_ai = models.BooleanField(default=True)

    # Regional & Date/Time preferences
    date_format = models.CharField(max_length=20, default="locale")
    time_format = models.CharField(max_length=10, default="12h")
    week_start = models.CharField(max_length=10, default="monday")

    # Privacy & Vault preferences
    blur_previews = models.BooleanField(default=False)
    pin_lock_enabled = models.BooleanField(default=False)
    pin_code = models.CharField(max_length=10, blank=True, default="")
    auto_lock_minutes = models.IntegerField(default=15)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profiles"

    def __str__(self):
        return self.email


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "tags"

    def __str__(self):
        return self.name


class Dream(models.Model):
    """Central dream entry."""

    class DreamType(models.TextChoices):
        LUCID = "lucid", "Lucid"
        NIGHTMARE = "nightmare", "Nightmare"
        RECURRING = "recurring", "Recurring"
        NORMAL = "normal", "Normal"
        FRAGMENTED = "fragmented", "Fragmented"
        NAP = "nap", "Nap"

    class Mood(models.TextChoices):
        PEACEFUL = "peaceful", "Peaceful"
        ANXIOUS = "anxious", "Anxious"
        JOYFUL = "joyful", "Joyful"
        CONFUSING = "confusing", "Confusing"
        SCARY = "scary", "Scary"
        NEUTRAL = "neutral", "Neutral"

    class InputMethod(models.TextChoices):
        TEXT = "text", "Text"
        VOICE = "voice", "Voice"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="dreams",
        to_field="supabase_id",
        db_column="user_supabase_id",
    )
    title = models.CharField(max_length=500)
    body = models.TextField(blank=True)
    dream_date = models.DateField()
    dream_type = models.CharField(
        max_length=20,
        choices=DreamType.choices,
        default=DreamType.NORMAL,
    )
    mood = models.CharField(
        max_length=20,
        choices=Mood.choices,
        default=Mood.NEUTRAL,
    )
    sleep_quality = models.IntegerField(null=True, blank=True)  # 1–5
    is_lucid = models.BooleanField(default=False)
    is_recurring = models.BooleanField(default=False)
    input_method = models.CharField(
        max_length=10,
        choices=InputMethod.choices,
        default=InputMethod.TEXT,
    )
    tags = models.ManyToManyField(Tag, through="DreamTag", blank=True, related_name="dreams")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dreams"
        ordering = ["-dream_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-dream_date"]),
            models.Index(fields=["user", "dream_type"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.dream_date})"


class DreamTag(models.Model):
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "dream_tags"
        unique_together = [("dream", "tag")]


class Insight(models.Model):
    """Cached AI-generated narrative insight for a user/period."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="insights",
        to_field="supabase_id",
        db_column="user_supabase_id",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    summary_text = models.TextField()
    stats_json = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insights"
        ordering = ["-generated_at"]

    def __str__(self):
        return f"Insight for {self.user.email} ({self.period_start}–{self.period_end})"

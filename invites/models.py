
from django.db import models
from django.utils import timezone
import random
import string
from django.urls import reverse


def generate_unique_code():
    # allowed chars: lowercase letters except 'o','l' and digits except '0','1'
    letters = [c for c in string.ascii_lowercase if c not in ('o','l')]
    digits = [d for d in string.digits if d not in ('0','1')]
    alphabet = letters + digits
    while True:
        code = ''.join(random.choice(alphabet) for _ in range(5))
        if not Invite.objects.filter(code=code).exists():
            return code


class SiteConfig(models.Model):
    """Singleton-like model to keep config such as RSVP deadline."""
    rsvp_deadline = models.DateTimeField(null=True, blank=True, help_text='Datum bis zu dem Antworten editierbar sind (UTC)')

    def __str__(self):
        return 'Site Config'

    class Meta:
        verbose_name = 'Site Config'
        verbose_name_plural = 'Site Configs'


class Invite(models.Model):
    TYPE_CHOICES = (
        ('family', 'Familie'),
        ('individual', 'Einzelperson'),
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    address = models.TextField(blank=True)
    max_guests = models.PositiveIntegerField(default=1)
    diet = models.CharField(max_length=255, blank=True)
    allergies = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    code = models.CharField(max_length=5, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = generate_unique_code()
        super().save(*args, **kwargs)

    def get_rsvp_url(self, request=None):
        if not self.code:
            return None  # oder gib '' zurück
        return reverse('invites:rsvp_with_code', args=[self.code])

    def __str__(self):
        return f"{self.name} ({self.code})"


class RSVP(models.Model):
    invite = models.OneToOneField(Invite, on_delete=models.CASCADE, related_name='rsvp')
    attending = models.BooleanField(null=True)
    guests_count = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now=True)

    def editable(self):
        try:
            config = SiteConfig.objects.first()
            if config and config.rsvp_deadline:
                return timezone.now() <= config.rsvp_deadline
        except SiteConfig.DoesNotExist:
            pass
        # if no config set, editable
        return True

    def __str__(self):
        return f"RSVP for {self.invite.code} - attending={self.attending}"


class RSVPPerson(models.Model):
    rsvp = models.ForeignKey(RSVP, on_delete=models.CASCADE, related_name='persons')
    name = models.CharField(max_length=255, blank=True)
    diet = models.CharField(max_length=255, blank=True)
    allergies = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name or '(kein Name)'
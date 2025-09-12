
from django.contrib import admin
from .models import Invite, RSVP, RSVPPerson, SiteConfig
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import qrcode
from io import BytesIO
import base64


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    pass


class RSVPPersonInline(admin.TabularInline):
    model = RSVPPerson
    extra = 0


@admin.register(RSVP)
class RSVPAdmin(admin.ModelAdmin):
    list_display = ('invite', 'attending', 'guests_count', 'submitted_at')
    inlines = [RSVPPersonInline]


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'type', 'max_guests', 'code', 'qrcode_preview')
    readonly_fields = ('code', 'qrcode_image')
    fields = ('type','name','email','address','max_guests','diet','allergies','phone','code','qrcode_image')

    def qrcode_image(self, obj):
        if not obj:
            return ''
        url = obj.get_rsvp_url()
        # Create a full URL if needed — here we show the path; admins can copy the path and create links
        qr = qrcode.QRCode(box_size=4, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image()
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_b64 = base64.b64encode(buffer.getvalue()).decode()
        return mark_safe(f'<img src="data:image/png;base64,{img_b64}" alt="QR Code"/>')

    qrcode_image.short_description = 'QR Code (Deep Link)'

    def qrcode_preview(self, obj):
        return self.qrcode_image(obj)
    qrcode_preview.short_description = 'QR'
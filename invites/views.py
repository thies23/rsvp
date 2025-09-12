
from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone
from django.http import HttpResponse, HttpResponseForbidden
from .models import Invite, RSVP, RSVPPerson, SiteConfig
from .forms import CodeLoginForm, RSVPMainForm
from django.urls import reverse
import qrcode
from io import BytesIO
from django.views.decorators.http import require_http_methods


@require_http_methods(['GET','POST'])
def code_login(request):
    form = CodeLoginForm(request.POST or None)
    msg = None
    if form.is_valid():
        code = form.cleaned_data['code'].strip().lower()
        try:
            invite = Invite.objects.get(code=code)
            return redirect('invites:rsvp_with_code', code=invite.code)
        except Invite.DoesNotExist:
            msg = 'Ungültiger Code.'
    return render(request, 'invites/login.html', {'form': form, 'msg': msg})


@require_http_methods(['GET','POST'])
def rsvp_with_code(request, code):
    code = code.strip().lower()
    invite = get_object_or_404(Invite, code=code)

    # check deadline
    config = SiteConfig.objects.first()
    if config and config.rsvp_deadline and timezone.now() > config.rsvp_deadline:
        return render(request, 'invites/rsvp_closed.html', {'invite': invite, 'siteconfig': siteconfig})

    rsvp, created = RSVP.objects.get_or_create(invite=invite)

    if request.method == 'POST':
        # if not editable, forbid
        if not rsvp.editable():
            return HttpResponseForbidden('RSVP kann nicht mehr bearbeitet werden.')

        attending = request.POST.get('attending')
        if attending in ['True','true','true','1','on','Ja','ja']:
            attending_bool = True
        else:
            attending_bool = False

        if not attending_bool:
            rsvp.attending = False
            rsvp.guests_count = 0
            rsvp.save()
            rsvp.persons.all().delete()
            return render(request, 'invites/rsvp_success.html', {'invite': invite, 'siteconfig': config, 'rsvp': rsvp})

        # attending = True
        try:
            guests_count = int(request.POST.get('guests_count') or 0)
        except ValueError:
            guests_count = 0
        guests_count = max(0, min(guests_count, invite.max_guests))

        # read per-person fields arrays
        names = request.POST.getlist('person_name[]')
        diets = request.POST.getlist('person_diet[]')
        allergies = request.POST.getlist('person_allergies[]')

        # Clean up previous persons
        rsvp.attending = True
        rsvp.guests_count = guests_count
        rsvp.save()
        rsvp.persons.all().delete()

        # create persons up to guests_count
        for i in range(guests_count):
            name = names[i] if i < len(names) else ''
            diet = diets[i] if i < len(diets) else ''
            allergy = allergies[i] if i < len(allergies) else ''
            RSVPPerson.objects.create(rsvp=rsvp, name=name, diet=diet, allergies=allergy)

        return render(request, 'invites/rsvp_success.html', {'invite': invite, 'siteconfig': config, 'rsvp': rsvp})

    # GET: prepare data for template
    persons = rsvp.persons.all()
    persons_data = list(persons.values('name','diet','allergies'))
    return render(request, 'invites/rsvp.html', {
        'invite': invite,
        'rsvp': rsvp,
        'siteconfig': config,
        'persons': persons_data,
        'max_guests': invite.max_guests,
        'rsvp_deadline': config.rsvp_deadline if config else None,
    })


def qr_code_image(request, code):
    code = code.strip().lower()
    invite = get_object_or_404(Invite, code=code)
    url = request.build_absolute_uri(invite.get_rsvp_url())
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image()
    buf = BytesIO()
    img.save(buf, format='PNG')
    return HttpResponse(buf.getvalue(), content_type='image/png')
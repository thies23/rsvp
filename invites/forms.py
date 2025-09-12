
from django import forms
from .models import Invite


class CodeLoginForm(forms.Form):
    code = forms.CharField(max_length=5, label='5-stelliger Code')


class RSVPMainForm(forms.Form):
    attending = forms.ChoiceField(choices=((True,'Ja'),(False,'Nein')), widget=forms.RadioSelect, label='Nehmen Sie teil?')
    guests_count = forms.IntegerField(min_value=0, label='Anzahl Gäste', required=False)

    def clean_attending(self):
        val = self.cleaned_data['attending']
        return val == 'True' or val is True
# RSVP For Weddings


Simple RSVP System for Weddings

This is hacky and specific for our needs (i.e. German Language, Hardcoded events like no Omnivore food, etc.)

## Motivation

We needed a simple RSVP system for our wedding that is a little bit more than a form to mail. As we did not want to utilize some SaaS stuff we started coding it ourselves.

## Requirements
- django
- qrcode

## HowTo

1. Clone git Repo
2. `python3 manage makemigrations invites`
3. `python3 manage migrate`
4. `python3 manage createsuperuser`
5. `python3 manage runserver`
6. Go to `http://127.0.0.1:8000` and log in
7. Go to "Site Configs" and create a Site Config.
8. Start creating invites

## To Do:

- Auto invite guests
- Auto reminder emails
- Print invites
- Export CSV for allergies, guests, etc.

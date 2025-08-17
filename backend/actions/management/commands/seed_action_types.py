from django.core.management.base import BaseCommand
from django.db import transaction
from actions.models import ActionType

ACTIONS = [
    # ==== DAY ====
    {
        "slug": "fling_target", "name": "Flingy Target", "phase": "day",
        "config": {
            "requires_targets": True, "separate_per_target": True, "allow_self": False,
            "tags": [{"key": "target", "label": "Flingy Target"}],
        },
    },
    {
        "slug": "target", "name": "Target", "phase": "day",
        "config": {
            "requires_targets": True, "separate_per_target": True, "allow_self": False,
            "tags": [{"key": "target", "label": "Target"}],
        },
    },
    {
        "slug": "siding", "name": "Siding", "phase": "day",
        "config": {
            "requires_targets": True, "allow_self": False,
            "item_label": "Player to take side with",
        },
    },
    {
        "slug": "k_of_n_target", "name": "K of N Target", "phase": "day",
        "config": {
            "requires_targets": True, "allow_self": False,
            "params": {"k": {"type": "int", "required": True, "min": 1},
                       "n": {"type": "int", "required": True, "min": 1}},
            "item_label": "Potential Suspects",
        },
    },
    {
        "slug": "cover", "name": "Cover", "phase": "day",
        "config": {
            "requires_targets": True, "separate_per_target": True, "allow_self": False,
            "tags": [{"key": "target", "label": "Cover"}],
        },
    },
    {
        "slug": "k_of_n_cover", "name": "K of N Cover", "phase": "day",
        "config": {
            "requires_targets": True, "allow_self": False,
            "params": {"k": {"type": "int", "required": True, "min": 1},
                       "n": {"type": "int", "required": True, "min": 1}},
            "item_label": "Potential Citizens",
        },
    },
    {
        "slug": "dialogue", "name": "Dialogue", "phase": "day",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Dialogue partner"}],
        },
    },
    {
        "slug": "first_vote", "name": "First Vote", "phase": "day",
        "config": {
            "requires_targets": True, "allow_self": False,
            "item_label": "Voters",
            "derive_n_from_targets": True,
        },
    },
    {
        "slug": "second_vote", "name": "Second Vote", "phase": "day",
        "config": {
            "requires_targets": True, "allow_self": False,
            "item_label": "Voters",
            "derive_n_from_targets": True,
        },
    },
    {
        "slug": "defense", "name": "Cover for Defense", "phase": "day",
        "config": {
            "requires_targets": False, "allow_self": False,
            "details_schema": { "covering": {"required": True}, "targets": {"required": False}, "covered": {"required": False} },
        },
    },
    {
        "slug": "claim", "name": "Claim", "phase": "day",
        "config": {
            "requires_targets": False,
            "details_schema": {"role_slug": {"type": "string", "required": True}},
        },
    },
    {
        "slug": "will", "name": "Will", "phase": "day",
        "config": {
            "requires_targets": False,
            "details_schema": {
                "target": {"type": "int", "required": False},
                "cover": {"type": "int", "required": False},
                "claim_role": {"type": "string", "required": False},
            },
        },
    },
    {
        "slug": "terror", "name": "Terror", "phase": "day",  # << day per your spec
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [
                {"key": "target", "label": "Target"},
                {"key": "guard", "label": "Guard"},
                {"key": "save", "label": "Guard’s save"},
            ],
        },
    },

    # ==== NIGHT ====
    {
        "slug": "no_faces_choice", "name": "No Faces Choice", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Player with Ability"}],
        },
    },
    {
        "slug": "boozers_shot", "name": "Boozer's Shot", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Boozed Player"}],
        },
    },
    {
        "slug": "mafia_kill", "name": "Mafia Kill", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Kill"}],
        },
    },
    {
        "slug": "punished", "name": "Punished", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Punished"}],
        },
    },
    {
        "slug": "secured", "name": "Secured", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": True, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Secured"}],
        },
    },
    {
        "slug": "killer_target", "name": "Killer Target", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [
                {"key": "mafia_suggest", "label": "Mafia suggest"},
                {"key": "city_saviour", "label": "Random Citizen"},
                {"key": "city_suggest", "label": "City suggest"},
                {"key": "killer_kill", "label": "Killer’s shot"},
            ],
        },
    },
    {
        "slug": "snipers_shot", "name": "Sniper's Shot", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": False, "single_per_tag": True,
            "tags": [{"key": "target", "label": "Sniper's shot"}],
        },
    },
    {
        "slug": "doctors_save", "name": "Doctor's Save", "phase": "night",
        "config": {
            "requires_targets": True, "allow_self": True, "single_per_tag": True,
            "tags": [
                {"key": "doctor_choice", "label": "Doctor’s choice"},
                {"key": "backup", "label": "Backup choice"},
            ],
        },
    },
]

class Command(BaseCommand):
    help = "Seed default ActionType rows (idempotent)."

    @transaction.atomic
    def handle(self, *args, **opts):
        created = 0
        updated = 0
        for a in ACTIONS:
            obj, was_created = ActionType.objects.get_or_create(
                slug=a["slug"],
                defaults={"name": a["name"], "phase": a["phase"], "config": a["config"]},
            )
            if was_created:
                created += 1
            else:
                # update name/phase/config safely
                obj.name = a["name"]
                obj.phase = a["phase"]
                obj.config = {**(obj.config or {}), **a["config"]}
                obj.save(update_fields=["name", "phase", "config"])
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"ActionTypes seeded. created={created}, updated={updated}"))

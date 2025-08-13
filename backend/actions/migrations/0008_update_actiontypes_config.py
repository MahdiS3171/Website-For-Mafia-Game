from django.db import migrations

def up(apps, schema_editor):
    ActionType = apps.get_model('actions', 'ActionType')

    # Helper to update config shallowly while preserving unknown keys
    def merge_config(obj, extra):
        cfg = obj.config or {}
        cfg.update(extra)
        obj.config = cfg
        obj.save(update_fields=['config'])

    # Convenience fetch
    by_slug = {at.slug: at for at in ActionType.objects.all()}

    def set_labels(slug, *, tags=None, item_label=None, requires_targets=None, params=None, details_schema=None, allow_self=None, separate_per_target=None):
        at = by_slug.get(slug)
        if not at:
            return
        extra = {}
        if tags is not None:
            # tags should be a list of {key, label} OR a simple list of strings (keep compat)
            extra['tags'] = tags
        if item_label is not None:
            extra['item_label'] = item_label
        if requires_targets is not None:
            extra['requires_targets'] = requires_targets
        if params is not None:
            extra['params'] = params
        if details_schema is not None:
            extra['details_schema'] = details_schema
        if allow_self is not None:
            extra['allow_self'] = allow_self
        if separate_per_target is not None:
            extra['separate_per_target'] = separate_per_target
        merge_config(at, extra)

    # 1) Move Terror to DAY
    terror = by_slug.get('terror')
    if terror and terror.phase != 'day':
        terror.phase = 'day'
        terror.save(update_fields=['phase'])

    # 2) Dialogue - custom label
    set_labels('dialogue', tags=[{"key":"target","label":"Dialogue partner"}], requires_targets=True)

    # 3) Doctor’s save – two labeled picks
    set_labels('doctors_save', tags=[
        {"key":"doctor_choice","label":"Doctor’s choice"},
        {"key":"backup","label":"Backup choice"}
    ], requires_targets=True)

    # 4) Siding – variable length, nicer label
    set_labels('siding', item_label="Player to take side with", requires_targets=True)

    # 5) Killer target – four separate labeled boxes
    set_labels('killer_target', tags=[
        {"key":"mafia_suggest","label":"Mafia suggest"},
        {"key":"city_saviour","label":"City saviour"},
        {"key":"city_suggest","label":"City suggest"},
        {"key":"killer_kill","label":"Killer’s kill"}
    ], requires_targets=True)

    # 6) K-of-N target/cover – require k & n
    set_labels('k_of_n_target', params={"k":{"type":"int","required":True,"min":1},"n":{"type":"int","required":True,"min":1}}, requires_targets=True)
    set_labels('k_of_n_cover',  params={"k":{"type":"int","required":True,"min":1},"n":{"type":"int","required":True,"min":1}}, requires_targets=True)

    # 7) Votes – only n
    set_labels('first_vote',  params={"n":{"type":"int","required":True,"min":1}}, requires_targets=True)
    set_labels('second_vote', params={"n":{"type":"int","required":True,"min":1}}, requires_targets=True)

    # 8) Claim – no targets, must send role_slug
    set_labels('claim', requires_targets=False, details_schema={"role_slug":{"type":"string","required":True}})

    # 9) Will – single log with optional pieces inside details
    set_labels('will', requires_targets=False, details_schema={
        "target":{"type":"int","required":False},
        "cover":{"type":"int","required":False},
        "claim_role":{"type":"string","required":False}
    })

    # 10) Keep your “separate per target” behavior for single-target day actions
    for slug in ('fling_target','target','cover'):
        set_labels(slug, separate_per_target=True, requires_targets=True, tags=[{"key":"target","label":"Target"}])

def down(apps, schema_editor):
    # No-op (safe to leave labels as is)
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('actions', '0007_update_actiontypes_config'),
    ]
    operations = [migrations.RunPython(up, reverse_code=down)]

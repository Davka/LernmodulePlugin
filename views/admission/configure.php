<label>
    <?= _("Studierende m�ssen folgendes Lernmodul absolviert haben:") ?>
    <?= QuickSearch::get("seminar_id-module_id", $search)->render() ?>
</label>
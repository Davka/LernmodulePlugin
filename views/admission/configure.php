<label>
    <?= dgettext("lernmoduleplugin","Studierende müssen folgendes Lernmodul absolviert haben:") ?>
    <?= QuickSearch::get("seminar_id-module_id", $search)->render() ?>
</label>

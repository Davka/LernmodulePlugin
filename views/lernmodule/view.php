<input type="hidden" id="attempt_id" value="<?= $attempt->getId() ?>">

<? $template = $mod->getViewerTemplate($attempt, $game_attendence) ?>
<?= $template ? $template->render() : "" ?>

<script>
    STUDIP.Lernmodule.periodicalPushData = function () {
        return {
            'attempt_id': jQuery("#attempt_id").val(),
            'customData': STUDIP.Lernmodule.attemptCustomData
        };
    };
</script>

<?
Sidebar::Get()->setImage(Assets::image_path("sidebar/learnmodule-sidebar.png"));
if ($GLOBALS['perm']->have_studip_perm("tutor", Context::get()->id)) {
    $actions = new ActionsWidget();
    $actions->addLink(
        dgettext("lernmoduleplugin","Bearbeiten"),
        PluginEngine::getURL($plugin, array(), "lernmodule/edit/".$mod->getId()),
        Icon::create("edit", "clickable")

    );
    if ($mod->getDownloadURL()) {
        $actions->addLink(
            dgettext("lernmoduleplugin","Lernmodul herunterladen"),
            $mod->getDownloadURL(),
            Icon::create("download", "clickable")
        );
    }
    Sidebar::Get()->addWidget($actions);
}

$views = new ViewsWidget();
$views->addLink(
    $mod['name'],
    PluginEngine::getURL($plugin, array(), "lernmodule/view/".$mod->getId()),
    null,
    array()
)->setActive(true);
if ($course_connection['evaluation_for_students'] || $GLOBALS['perm']->have_studip_perm("tutor", $course_connection['seminar_id'])) {
    $views->addLink(
        dgettext("lernmoduleplugin","Auswertung"),
        PluginEngine::getURL($plugin, array(), "lernmodule/evaluation/" . $mod->getId()),
        null,
        array()
    );
}

Sidebar::Get()->addWidget($views);

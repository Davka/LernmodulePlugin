<!-- Allow us to mutate the prop 'taskDefinition' as much as we want-->
<!-- TODO refrain from mutating taskDefinition directly -- it breaks undo/redo-->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <form class="default">
    <fieldset>
      <legend>{{ $gettext('Drag the Words') }}</legend>

      <div class="h5pEditorTopPanel">
        <button
          @click="addBlank"
          class="button"
          type="button"
          style="margin-right: 0.1em"
        >
          {{ $gettext('Lücke hinzufügen') }}
        </button>
        <div class="tooltip tooltip-icon" :data-tooltip="instructions" />
      </div>

      <studip-wysiwyg
        v-model="taskDefinition.template"
        ref="wysiwyg"
        force-soft-breaks
        remove-wrapping-p-tag
        disable-autoformat
      />

      <label style="margin-top: 1.5ex">
        {{ $gettext('Irreführende Antworten') }}
        <span
          class="tooltip tooltip-icon"
          :data-tooltip="distratorInstructions"
        />
        <input type="text" v-model="taskDefinition.distractors" />
      </label>
    </fieldset>

    <fieldset class="collapsable collapsed">
      <legend>{{ $gettext('Einstellungen') }}</legend>

      <label>
        <input v-model="taskDefinition.instantFeedback" type="checkbox" />
        {{ $gettext('Lücken automatisch prüfen') }}
      </label>

      <label>
        <input v-model="taskDefinition.alphabeticOrder" type="checkbox" />
        {{ $gettext('Antworten alphabetisch sortieren') }}
      </label>

      <label>
        <input v-model="taskDefinition.retryAllowed" type="checkbox" />
        {{ $gettext('Mehrere Versuche erlauben') }}
      </label>

      <label>
        <input
          v-model="taskDefinition.showSolutionsAllowed"
          @change="updateAllBlanksRequirement"
          type="checkbox"
        />
        {{ $gettext('Lösungen anzeigen erlauben') }}
      </label>

      <label
        :class="{ 'setting-disabled': !taskDefinition.showSolutionsAllowed }"
      >
        <input
          v-model="taskDefinition.allBlanksMustBeFilledForSolutions"
          :disabled="!taskDefinition.showSolutionsAllowed"
          type="checkbox"
        />
        {{
          $gettext('Lösungen nur anzeigen, wenn alle Lücken ausgefüllt sind')
        }}
      </label>
    </fieldset>

    <fieldset class="collapsable collapsed">
      <legend>{{ $gettext('Beschriftungen') }}</legend>

      <label :class="{ 'setting-disabled': taskDefinition.instantFeedback }">
        {{ $gettext('Text für Überprüfen-Button:') }}
        <input
          v-model="taskDefinition.strings.checkButton"
          :disabled="taskDefinition.instantFeedback"
          type="text"
        />
      </label>

      <label :class="{ 'setting-disabled': !taskDefinition.retryAllowed }">
        {{ $gettext('Text für Wiederholen-Button:') }}
        <input
          v-model="taskDefinition.strings.retryButton"
          :disabled="!taskDefinition.retryAllowed"
          type="text"
        />
      </label>

      <label
        :class="{ 'setting-disabled': !taskDefinition.showSolutionsAllowed }"
      >
        {{ $gettext('Text für Lösungen-Button:') }}
        <input
          v-model="taskDefinition.strings.solutionsButton"
          :disabled="!taskDefinition.showSolutionsAllowed"
          type="text"
        />
      </label>

      <label
        :class="{
          'setting-disabled':
            !taskDefinition.showSolutionsAllowed ||
            !taskDefinition.allBlanksMustBeFilledForSolutions,
        }"
      >
        {{ $gettext('Hinweis, wenn nicht alle Lücken ausgefüllt sind:') }}
        <input
          v-model="taskDefinition.strings.fillInAllBlanksMessage"
          :disabled="
            !taskDefinition.showSolutionsAllowed ||
            !taskDefinition.allBlanksMustBeFilledForSolutions
          "
          type="text"
        />
      </label>
    </fieldset>

    <feedback-editor
      :feedback="taskDefinition.feedback"
      :result-message="taskDefinition.strings.resultMessage"
      @update:feedback="updateFeedback"
      @update:result-message="updateResultMessage"
    />
  </form>
</template>

<script lang="ts">
// Allow us to mutate the prop 'taskDefinition' as much as we want.
// TODO refrain from mutating taskDefinition directly -- it breaks undo/redo
/* eslint-disable vue/no-mutating-props */
import { defineComponent, inject } from 'vue';
import { DragTheWordsTask, Feedback } from '@/models/TaskDefinition';
import { taskEditorStore } from '@/store';
import { $gettext } from '@/language/gettext';
import StudipWysiwyg from '@/components/StudipWysiwyg.vue';
import produce from 'immer';
import FeedbackEditor from '@/components/FeedbackEditor.vue';
import {
  TaskEditorState,
  taskEditorStateSymbol,
} from '@/components/taskEditorState';

export default defineComponent({
  name: 'DragTheWordsEditor',
  setup() {
    return {
      taskEditor: inject<TaskEditorState>(taskEditorStateSymbol),
    };
  },
  components: { StudipWysiwyg, FeedbackEditor },
  computed: {
    taskDefinition: () => taskEditorStore.taskDefinition as DragTheWordsTask,

    currentUndoRedoState: () =>
      taskEditorStore.undoRedoStack[taskEditorStore.undoRedoIndex],

    instructions(): string {
      return $gettext(
        'Um eine Lücke zu erstellen, setzen Sie ein Sternchen (*) vor und hinter das korrekte Wort oder markieren Sie das Wort und klicken Sie auf den Button „Lücke hinzufügen“. Sie können auch einen Tooltip hinzufügen, indem Sie einen Doppelpunkt (:) vor den Tooltip-Text schreiben.'
      );
    },

    distratorInstructions(): string {
      return $gettext(
        'Geben Sie falsche Antworten als Distraktoren ein. Verwenden Sie das gleiche Sternchen (*)-Schema wie im Text.'
      );
    },
  },
  methods: {
    $gettext,

    /**
     * Surround the selected text with two asterisks
     */
    addBlank() {
      const wysiwygEl = (this.$refs.wysiwyg as any)?.$el;
      const editor = window.STUDIP.wysiwyg.getEditor(wysiwygEl);
      if (!editor) {
        console.error('getEditor(wysiwygEl) returned: ', editor);
        throw new Error('Could not get reference to wysiwyg editor');
      }
      const selection = editor.model.document.selection;
      const start = selection.getFirstPosition();
      const end = selection.getLastPosition();
      if (!start || !end) {
        console.error('selection start: ', start, ' selection end: ', end);
        throw new Error('Could not get selection in editor');
      }
      editor.model.change((writer) => {
        writer.insertText('*', end);
        writer.insertText('*', start);
      });
    },

    updateAllBlanksRequirement() {
      if (!this.taskDefinition.showSolutionsAllowed) {
        this.taskDefinition.allBlanksMustBeFilledForSolutions = false;
      }
    },

    updateFeedback(updatedFeedback: Feedback[]) {
      this.taskEditor!.performEdit({
        newTaskDefinition: produce(
          this.taskDefinition,
          (taskDraft: DragTheWordsTask) => {
            taskDraft.feedback = updatedFeedback;
          }
        ),
        undoBatch: {},
      });
    },

    updateResultMessage(updatedResultMessage: string) {
      this.taskEditor!.performEdit({
        newTaskDefinition: produce(
          this.taskDefinition,
          (taskDraft: DragTheWordsTask) => {
            taskDraft.strings.resultMessage = updatedResultMessage;
          }
        ),
        undoBatch: {},
      });
    },

    urlForIcon(iconName: string) {
      return (
        window.STUDIP.ASSETS_URL + 'images/icons/blue/' + iconName + '.svg'
      );
    },
  },
});
</script>

<style scoped></style>

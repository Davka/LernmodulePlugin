<template>
  <form class="default">
    <fieldset>
      <legend>{{ $gettext('Question') }}</legend>

      <label>
        <studip-wysiwyg
          v-model="taskDefinition.question"
          force-soft-breaks
          remove-wrapping-p-tag
          disable-autoformat
        />
      </label>

      <fieldset
        v-for="(answer, i) in taskDefinition.answers"
        :key="answer.uuid"
        class="answer collapsable collapsed"
      >
        <legend class="answer-title">
          {{ answer.text }}
          <button
            :title="$gettext('Antwort löschen')"
            :aria-label="$gettext('Antwort löschen')"
            @click="removeAnswer(answer)"
            type="button"
            class="button-with-icon"
          >
            <img :src="urlForIcon('trash')" alt="" />
          </button>
        </legend>

        <div class="answer-row">
          <input v-model="taskDefinition.answers[i].correct" type="checkbox" />

          <input v-model="taskDefinition.answers[i].text" type="text" />
        </div>

        <fieldset class="collapsable collapsed feedback">
          <legend>{{ $gettext('Hinweis und Feedback') }}</legend>

          <label>
            <span>{{ $gettext('Hinweis:') }}</span>
            <input
              v-model="taskDefinition.answers[i].strings.hint"
              type="text"
              class="textbox"
            />
          </label>

          <label>
            <span>{{ $gettext('Feedback, wenn ausgewählt:') }}</span>
            <input
              v-model="taskDefinition.answers[i].strings.feedbackSelected"
              type="text"
              class="textbox"
            />
          </label>

          <label>
            <span>{{ $gettext('Feedback, wenn nicht ausgewählt:') }}</span>
            <input
              v-model="taskDefinition.answers[i].strings.feedbackNotSelected"
              type="text"
              class="textbox"
            />
          </label>
        </fieldset>
      </fieldset>

      <button @click="addAnswer" type="button" class="button">
        {{ $gettext('Neue Antwort') }}
      </button>
    </fieldset>

    <fieldset class="collapsable collapsed">
      <legend>{{ $gettext('Einstellungen') }}</legend>

      <label>
        <input v-model="taskDefinition.canAnswerMultiple" type="checkbox" />
        {{ $gettext('Mehrfachauswahl erlauben') }}
      </label>

      <label>
        <input v-model="taskDefinition.randomOrder" type="checkbox" />
        {{ $gettext('Antworten in zufälliger Reihenfolge anzeigen') }}
      </label>

      <label>
        <input v-model="taskDefinition.retryAllowed" type="checkbox" />
        {{ $gettext('Mehrere Versuche erlauben') }}
      </label>

      <label>
        <input v-model="taskDefinition.showSolutionsAllowed" type="checkbox" />
        {{ $gettext('Lösungen anzeigen erlauben') }}
      </label>
    </fieldset>

    <fieldset class="collapsable collapsed">
      <legend>{{ $gettext('Beschriftungen') }}</legend>

      <label>
        {{ $gettext('Text für Überprüfen-Button:') }}
        <input v-model="taskDefinition.strings.checkButton" type="text" />
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
import { defineComponent, inject } from 'vue';
import {
  Feedback,
  QuestionAnswer,
  QuestionTask,
} from '@/models/TaskDefinition';
import { taskEditorStore } from '@/store';
import StudipWysiwyg from '@/components/StudipWysiwyg.vue';
import { $gettext } from '@/language/gettext';
import produce from 'immer';
import {
  TaskEditorState,
  taskEditorStateSymbol,
} from '@/components/taskEditorState';
import FeedbackEditor from '@/components/FeedbackEditor.vue';
import { v4 } from 'uuid';

export default defineComponent({
  name: 'QuestionEditor',
  setup() {
    return {
      taskEditor: inject<TaskEditorState>(taskEditorStateSymbol),
    };
  },
  components: { FeedbackEditor, StudipWysiwyg },
  methods: {
    $gettext,

    addAnswer(): void {
      this.taskDefinition.answers.push({
        uuid: v4(),
        text: this.$gettext('Neue Antwort'),
        correct: true,
        strings: {
          hint: '',
          feedbackSelected: '',
          feedbackNotSelected: '',
        },
      });
    },

    removeAnswer(answerToRemove: QuestionAnswer): void {
      this.taskDefinition.answers = this.taskDefinition.answers.filter(
        (answer) => answer !== answerToRemove
      );
    },

    urlForIcon(iconName: string) {
      return (
        window.STUDIP.ASSETS_URL + 'images/icons/blue/' + iconName + '.svg'
      );
    },

    updateFeedback(updatedFeedback: Feedback[]) {
      this.taskEditor!.performEdit({
        newTaskDefinition: produce(
          this.taskDefinition,
          (taskDraft: QuestionTask) => {
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
          (taskDraft: QuestionTask) => {
            taskDraft.strings.resultMessage = updatedResultMessage;
          }
        ),
        undoBatch: {},
      });
    },
  },
  computed: {
    taskDefinition: () => taskEditorStore.taskDefinition as QuestionTask,

    currentUndoRedoState: () =>
      taskEditorStore.undoRedoStack[taskEditorStore.undoRedoIndex],
  },
});
</script>

<style scoped>
.answer {
  max-width: 48em;
}

.answer-title {
  position: relative;
}

.answer-row {
  display: flex;
  gap: 0.25em;
  margin-bottom: 0.75em;
}

.button-with-icon {
  /* Positioning */
  position: absolute;
  top: 50%;
  right: 0.1em;
  transform: translateY(-50%);
  z-index: 10;

  /* Children layout*/
  display: flex;
  justify-content: center;
  align-items: center;

  /* Shape & size */
  aspect-ratio: 1 / 1;
  height: 100%;
  width: auto;
  border-radius: 50%;

  /* Appearance */
  border: 1px solid rgba(40, 73, 124, 0.1); /* Light translucent border for depth */
}

.button-with-icon:hover {
  background: rgba(100%, 100%, 100%, 0.75); /* Lighter background on hover */
}

.feedback {
  margin: 0.5em 0 0 0;
}
</style>

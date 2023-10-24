import { createApp } from 'vue';
import { taskEditorStore, store, coursewareBlockStore } from '@/store';
import { modelUndoable } from '@/directives/vModelUndoable';
import { gettextPlugin } from '@/language/gettext';
import './assets/global.css';
import { isString } from 'lodash';
import { newTask, taskDefinitionSchema } from '@/models/TaskDefinition';
import CoursewareBlock from '@/components/CoursewareBlock.vue';
import {
  InitializeMessage,
  iframeMessageSchema,
} from '@/models/CoursewareBlockIframeMessages';

// Wait to load until a message is posted to Window.
if (!window.frameElement) {
  throw new Error(
    'This script appears not to be running in an iframe.  It is only meant to ' +
      'be run in an iframe inside of Stud.IP'
  );
}

window.addEventListener('message', (event) => {
  const dataParseResult = iframeMessageSchema.safeParse(event.data);
  if (!dataParseResult.success) {
    // This produces a LOT of log spam when using the youtube iframe player api.
    // console.info('Message not recognized: ', event.data, dataParseResult.error);
    return;
  }
  if (isString(dataParseResult.data)) {
    // Either a 'webpackHotUpdatea324efae9d340c78' (or something like it)
    // or a message sent by the iFrameSizer library. We can ignore it.
    return;
  }

  switch (dataParseResult.data.type) {
    case 'webpackProgress':
    case 'webpackOk':
    case 'webpackClose':
    case 'webpackInvalid':
    case 'webpackErrors':
    case 'webpackStillOk':
      break; // ignore
    case 'InitializeCoursewareBlock':
      console.warn('message posted to Window: ', event, 'data: ', event.data);
      initializeApp(dataParseResult.data);
      break;
    case 'ShowEditChange':
      console.warn('message posted to Window: ', event, 'data: ', event.data);
      coursewareBlockStore.setShowEditorUI(dataParseResult.data.state);
      break;
    default:
  }
});

function initializeApp(initializeMessage: InitializeMessage) {
  if (initializeMessage.block.attributes.payload.initialized) {
    const existingTaskDefinition = taskDefinitionSchema.parse(
      initializeMessage.block.attributes.payload.task_json
    );
    taskEditorStore.initializeCourseware(existingTaskDefinition);
  } else {
    const newTaskDefinition = newTask(
      initializeMessage.block.attributes.payload.task_type
    );
    taskEditorStore.initializeCourseware(newTaskDefinition);
  }
  const app = createApp(CoursewareBlock);
  app.directive('model-undoable', modelUndoable);
  app.use(store);
  app.use(gettextPlugin);

  // This config is needed until Vue 3.3 in order to allow us to pass around
  // reactive refs using provide/inject.  In particular, this functionality
  // is used in the TabsComponent/TabComponent.vue used in the Interactive Video
  // task editor.
  // https://vuejs.org/guide/components/provide-inject.html#working-with-reactivity
  app.config.unwrapInjectedRef = true;

  app.mount('#app');
}

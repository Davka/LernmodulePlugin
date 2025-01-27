import FillInTheBlanksViewer from '@/components/FillInTheBlanksViewer.vue';
import FillInTheBlanksEditor from '@/components/FillInTheBlanksEditor.vue';
import FindTheWordsEditor from '@/components/FindTheWordsEditor.vue';
import FindTheWordsViewer from '@/components/FindTheWordsViewer.vue';
import QuestionEditor from '@/components/QuestionEditor.vue';
import QuestionViewer from '@/components/QuestionViewer.vue';
import DragTheWordsViewer from '@/components/DragTheWordsViewer.vue';
import DragTheWordsEditor from '@/components/DragTheWordsEditor.vue';
import MarkTheWordsViewer from '@/components/MarkTheWordsViewer.vue';
import MarkTheWordsEditor from '@/components/MarkTheWordsEditor.vue';
import MemoryEditor from '@/components/MemoryEditor.vue';
import MemoryViewer from '@/components/MemoryViewer.vue';
import PairingViewer from '@/components/PairingViewer.vue';
import PairingEditor from '@/components/PairingEditor.vue';
import SequencingViewer from '@/components/SequencingViewer.vue';
import SequencingEditor from '@/components/SequencingEditor.vue';
import { v4 } from 'uuid';
import { z } from 'zod';
import FindTheHotspotEditor from '@/components/FindTheHotspotEditor.vue';
import FindTheHotspotViewer from '@/components/FindTheHotspotViewer.vue';
import { interactiveVideoTaskSchema } from '@/models/InteractiveVideoTask';
import { $gettext } from '@/language/gettext';
import InteractiveVideoEditor from '@/components/interactiveVideo/InteractiveVideoEditor.vue';
import InteractiveVideoViewer from '@/components/interactiveVideo/InteractiveVideoViewer.vue';

export const feedbackSchema = z.object({
  percentage: z.number(),
  message: z.string(),
});
export type Feedback = z.infer<typeof feedbackSchema>;

/**
 * @deprecated Images are now stored as IDs rather than as absolute URLs.
 */
const imageSchema_v1 = z.object({
  uuid: z.string(),
  imageUrl: z.string(),
  altText: z.string(),
});
const imageSchema_v2 = z.object({
  v: z.literal(2),
  uuid: z.string(),
  file_id: z.string(),
  altText: z.string(),
});

const imageSchema = z
  .union([imageSchema_v1, imageSchema_v2])
  .transform((val) => {
    if (!Object.hasOwn(val, 'v')) {
      // Migration from v1 to v2
      const val_v1 = val as z.infer<typeof imageSchema_v1>;
      const urlParams = new URLSearchParams(val_v1.imageUrl);
      const file_id = urlParams.get('file_id');
      if (!file_id) {
        throw new Error(
          'Could not migrate imageUrl to file_id. The query param ' +
            '"file_id" was not found in the imageUrl string.'
        );
      }
      const val_v2 = {
        v: 2,
        uuid: val_v1.uuid,
        altText: val_v1.altText,
        file_id,
      } as z.infer<typeof imageSchema_v2>;
      console.log(
        'Migrating from imageSchema_v1 to imageSchema_v2',
        'v1:',
        val_v1,
        'v2:',
        val_v2
      );
      return val_v2;
    } else {
      return val as z.infer<typeof imageSchema_v2>;
    }
  });

export type Image = z.infer<typeof imageSchema>;

/**
 * @return The Stud.IP download URL for the file with the given ID, or '' if id is ''
 */
export function fileIdToUrl(fileId: string): string {
  if (fileId === '') {
    return '';
  }
  return window.STUDIP.URLHelper.getURL('sendfile.php', {
    file_id: fileId,
  });
}

/**
 * @return The Stud.IP URL to view 'details' about the file with the given ID.
 */
export function fileDetailsUrl(fileId: string): string {
  return window.STUDIP.URLHelper.getURL(`dispatch.php/file/details/${fileId}`);
}

// Drag the Words task schema
export const dragTheWordsTaskSchema = z.object({
  task_type: z.literal('DragTheWords'),
  template: z.string(),
  distractors: z.string().optional().default(''),
  retryAllowed: z.boolean(),
  showSolutionsAllowed: z.boolean(),
  instantFeedback: z.boolean(),
  allBlanksMustBeFilledForSolutions: z.boolean(),
  alphabeticOrder: z.boolean(),
  strings: z.object({
    checkButton: z.string(),
    retryButton: z.string(),
    solutionsButton: z.string(),
    fillInAllBlanksMessage: z.string(),
    resultMessage: z.string(),
  }),
  feedback: z.array(feedbackSchema),
});

export type DragTheWordsTask = z.infer<typeof dragTheWordsTaskSchema>;

export const findTheHotspotTaskSchema = z.object({
  task_type: z.literal('FindTheHotspot'),
  image: imageSchema,
});
export type FindTheHotspotTask = z.infer<typeof findTheHotspotTaskSchema>;

export const findTheWordsTaskSchema = z.object({
  task_type: z.literal('FindTheWords'),
  words: z.array(z.string()),
});
export type FindTheWordsTask = z.infer<typeof findTheWordsTaskSchema>;

export const markTheWordsTaskSchema = z.object({
  task_type: z.literal('MarkTheWords'),
  template: z.string(),
  retryAllowed: z.boolean(),
  showSolutionsAllowed: z.boolean(),
  strings: z.object({
    checkButton: z.string(),
    retryButton: z.string(),
    solutionsButton: z.string(),
    resultMessage: z.string(),
  }),
  feedback: z.array(feedbackSchema).default(() => defaultFeedback()),
});
export type MarkTheWordsTask = z.infer<typeof markTheWordsTaskSchema>;

export const memoryCardSchema = z.object({
  first: imageSchema,
  second: imageSchema.optional(),
});
export type MemoryCard = z.infer<typeof memoryCardSchema>;

export const memoryTaskSchema = z.object({
  task_type: z.literal('Memory'),
  cards: z.array(memoryCardSchema),
  squareLayout: z.boolean(),
  flipside: imageSchema.optional(),
  retryAllowed: z.boolean(),
  strings: z.object({
    retryButton: z.string(),
    resultMessage: z.string(),
  }),
});
export type MemoryTask = z.infer<typeof memoryTaskSchema>;

export const fillInTheBlanksTaskSchema = z.object({
  task_type: z.literal('FillInTheBlanks'),
  template: z.string(),
  retryAllowed: z.boolean(),
  showSolutionsAllowed: z.boolean(),
  caseSensitive: z.boolean(),
  autoCorrect: z.boolean(),
  allBlanksMustBeFilledForSolutions: z.boolean(),
  acceptTypos: z.boolean(),
  strings: z.object({
    checkButton: z.string(),
    retryButton: z.string(),
    solutionsButton: z.string(),
    fillInAllBlanksMessage: z.string(),
    resultMessage: z.string(),
  }),
  feedback: z.array(feedbackSchema),
});
export type FillInTheBlanksTask = z.infer<typeof fillInTheBlanksTaskSchema>;

export const questionAnswerSchema = z.object({
  uuid: z.string(),
  text: z.string(),
  correct: z.boolean(),
  strings: z.object({
    hint: z.string(),
    feedbackSelected: z.string(),
    feedbackNotSelected: z.string(),
  }),
});
export type QuestionAnswer = z.infer<typeof questionAnswerSchema>;

export const questionTaskSchema = z.object({
  task_type: z.literal('Question'),
  question: z.string(),
  answers: z.array(questionAnswerSchema),
  canAnswerMultiple: z.boolean(),
  retryAllowed: z.boolean(),
  randomOrder: z.boolean(),
  showSolutionsAllowed: z.boolean(),
  strings: z.object({
    checkButton: z.string(),
    retryButton: z.string(),
    solutionsButton: z.string(),
    resultMessage: z.string(),
  }),
  feedback: z.array(feedbackSchema).default(() => defaultFeedback()),
});
export type QuestionTask = z.infer<typeof questionTaskSchema>;

const imageElementSchema = z.object({
  uuid: z.string(),
  type: z.literal('image'),
  file_id: z.string(),
  altText: z.string(),
});
export type ImageElement = z.infer<typeof imageElementSchema>;
const audioElementSchema = z.object({
  uuid: z.string(),
  type: z.literal('audio'),
  file_id: z.string(),
  altText: z.string(),
});
export type AudioElement = z.infer<typeof audioElementSchema>;
const textElementSchema = z.object({
  uuid: z.string(),
  type: z.literal('text'),
  content: z.string(),
});
export const multimediaElementSchema = z.union([
  imageElementSchema,
  audioElementSchema,
  textElementSchema,
]);
export type LernmoduleMultimediaElement = z.infer<
  typeof multimediaElementSchema
>;
export type MultimediaElementType = LernmoduleMultimediaElement['type'];

export const pairSchema = z.object({
  uuid: z.string(),
  draggableElement: multimediaElementSchema,
  targetElement: multimediaElementSchema,
});
export type Pair = z.infer<typeof pairSchema>;

export const pairingTaskSchema = z.object({
  task_type: z.literal('Pairing'),
  pairs: z.array(pairSchema),
  retryAllowed: z.boolean().optional().default(true),
  showSolutionsAllowed: z.boolean().optional().default(true),
  strings: z.object({
    checkButton: z.string(),
    retryButton: z.string(),
    solutionsButton: z.string(),
    resultMessage: z.string(),
  }),
  feedback: z.array(feedbackSchema),
});
export type PairingTask = z.infer<typeof pairingTaskSchema>;

export const sequencingTaskSchema = z.object({
  task_type: z.literal('Sequencing'),
  images: z.array(imageSchema),
  retryAllowed: z.boolean().optional().default(true),
  resumeAllowed: z.boolean().optional().default(true),
  showSolutionsAllowed: z.boolean().optional().default(true),
  strings: z.object({
    checkButton: z.string(),
    retryButton: z.string(),
    resumeButton: z.string().optional().default($gettext('Fortsetzen')),
    solutionsButton: z.string(),
    resultMessage: z.string(),
  }),
  feedback: z.array(feedbackSchema),
});
export type SequencingTask = z.infer<typeof sequencingTaskSchema>;

export const taskDefinitionSchema = z.discriminatedUnion('task_type', [
  dragTheWordsTaskSchema,
  fillInTheBlanksTaskSchema,
  findTheHotspotTaskSchema,
  findTheWordsTaskSchema,
  sequencingTaskSchema,
  interactiveVideoTaskSchema,
  markTheWordsTaskSchema,
  memoryTaskSchema,
  pairingTaskSchema,
  questionTaskSchema,
]);
export type TaskDefinition = z.infer<typeof taskDefinitionSchema>;

// Allowed lmb task types to be inserted in the Interactive Video Editor.
// Excludes the type 'interactive video' to avoid a recursive reference, which
// is cumbersome to solve in Typescript/Zod.
// I at first used the workaround described at https://github.com/colinhacks/zod#recursive-types
// but I later ran into hard-to-resolve typechecking errors when I started to
// use .optional() inside of schemas. I decided this is the better option for now. -Ann
export const taskDefinitionSchemaMinusInteractiveVideo = z.discriminatedUnion(
  'task_type',
  [
    dragTheWordsTaskSchema,
    fillInTheBlanksTaskSchema,
    findTheHotspotTaskSchema,
    findTheWordsTaskSchema,
    sequencingTaskSchema,
    markTheWordsTaskSchema,
    memoryTaskSchema,
    pairingTaskSchema,
    questionTaskSchema,
  ]
);

// Here, a bit of boilerplate is required to create a schema for the union of
// all possible 'task_type' values
export const taskTypeSchema = z.union([
  dragTheWordsTaskSchema.shape.task_type,
  fillInTheBlanksTaskSchema.shape.task_type,
  findTheHotspotTaskSchema.shape.task_type,
  findTheWordsTaskSchema.shape.task_type,
  sequencingTaskSchema.shape.task_type,
  interactiveVideoTaskSchema.shape.task_type,
  markTheWordsTaskSchema.shape.task_type,
  memoryTaskSchema.shape.task_type,
  pairingTaskSchema.shape.task_type,
  questionTaskSchema.shape.task_type,
]);

function defaultFeedback(): Feedback[] {
  return [
    { percentage: 0, message: 'Versuchen Sie es noch einmal.' },
    { percentage: 50, message: 'Gut.' },
    { percentage: 75, message: 'Sehr gut.' },
    { percentage: 100, message: 'Perfekt!' },
  ];
}

export function newTask(type: TaskDefinition['task_type']): TaskDefinition {
  switch (type) {
    case 'DragTheWords':
      return {
        task_type: 'DragTheWords',
        template: 'Drag the *words* to the matching *gaps*.',
        distractors: '',
        retryAllowed: true,
        showSolutionsAllowed: true,
        instantFeedback: false,
        allBlanksMustBeFilledForSolutions: false,
        alphabeticOrder: false,
        strings: {
          checkButton: 'Antworten überprüfen',
          retryButton: 'Erneut versuchen',
          solutionsButton: 'Lösungen anzeigen',
          fillInAllBlanksMessage:
            'Alle Lücken müssen ausgefüllt sein, um Lösungen anzuzeigen.',
          resultMessage: ':correct von :total Lücken richtig ausgefüllt.',
        },
        feedback: defaultFeedback(),
      };
    case 'FillInTheBlanks':
      return {
        task_type: 'FillInTheBlanks',
        template: 'Hier entsteht der *Lücken*text.',
        retryAllowed: true,
        showSolutionsAllowed: true,
        caseSensitive: true,
        autoCorrect: false,
        allBlanksMustBeFilledForSolutions: false,
        acceptTypos: false,
        strings: {
          checkButton: 'Antworten überprüfen',
          retryButton: 'Erneut versuchen',
          solutionsButton: 'Lösungen anzeigen',
          fillInAllBlanksMessage:
            'Alle Lücken müssen ausgefüllt sein, um Lösungen anzuzeigen.',
          resultMessage: ':correct von :total Lücken richtig ausgefüllt.',
        },
        feedback: defaultFeedback(),
      };
    case 'FindTheHotspot':
      return {
        task_type: 'FindTheHotspot',
        image: {
          v: 2,
          uuid: v4(),
          file_id: '',
          altText: '',
        },
      };
    case 'FindTheWords':
      return {
        task_type: 'FindTheWords',
        words: ['apple', 'banana', 'orange'],
      };
    case 'Pairing':
      return {
        task_type: 'Pairing',
        pairs: [
          {
            uuid: v4(),
            draggableElement: {
              uuid: v4(),
              type: 'image',
              file_id: '',
              altText: '',
            },
            targetElement: {
              uuid: v4(),
              type: 'image',
              file_id: '',
              altText: '',
            },
          },
        ],
        retryAllowed: true,
        showSolutionsAllowed: true,
        strings: {
          checkButton: 'Antworten überprüfen',
          retryButton: 'Erneut versuchen',
          solutionsButton: 'Lösungen anzeigen',
          resultMessage: ':correct von :total Bilder richtig zugeordnet.',
        },
        feedback: defaultFeedback(),
      };
    case 'Sequencing':
      return {
        task_type: 'Sequencing',
        images: [
          {
            uuid: v4(),
            v: 2,
            file_id: '',
            altText: '',
          },
        ],
        retryAllowed: true,
        resumeAllowed: true,
        showSolutionsAllowed: true,
        strings: {
          checkButton: 'Reihenfolge überprüfen',
          retryButton: 'Erneut versuchen',
          resumeButton: 'Fortsetzen',
          solutionsButton: 'Lösungen anzeigen',
          resultMessage: ':correct von :total Elemente richtig sortiert.',
        },
        feedback: defaultFeedback(),
      };
    case 'InteractiveVideo':
      return {
        task_type: 'InteractiveVideo',
        interactions: [],
        video: {
          type: 'none',
        },
        autoplay: false,
        startAt: 0,
        disableNavigation: 'not disabled',
      };
    case 'MarkTheWords':
      return {
        task_type: 'MarkTheWords',
        template:
          '*The* moon is our natural satellite, *i.e.* it revolves around the *Earth!*',
        retryAllowed: true,
        showSolutionsAllowed: true,
        strings: {
          checkButton: 'Antworten überprüfen',
          retryButton: 'Erneut versuchen',
          solutionsButton: 'Lösungen anzeigen',
          resultMessage: ':correct von :total Wörter richtig ausgewählt.',
        },
        feedback: defaultFeedback(),
      };
    case 'Memory':
      return {
        task_type: 'Memory',
        cards: [
          {
            first: {
              uuid: v4(),
              v: 2,
              file_id: '',
              altText: '',
            },
          },
        ],
        retryAllowed: true,
        squareLayout: true,
        strings: {
          retryButton: 'Erneut versuchen',
          resultMessage: 'Gut gemacht!',
        },
      };
    case 'Question':
      return {
        task_type: 'Question',
        question:
          'Wie nennt man die strukturell abgrenzbaren Bereiche einer Zelle?',
        answers: [
          {
            uuid: v4(),
            text: 'Organellen',
            correct: true,
            strings: {
              hint: '',
              feedbackSelected: '',
              feedbackNotSelected: '',
            },
          },
          {
            uuid: v4(),
            text: 'Mitochondrien',
            correct: false,
            strings: {
              hint: '',
              feedbackSelected: '',
              feedbackNotSelected: '',
            },
          },
          {
            uuid: v4(),
            text: 'Ribosomen',
            correct: false,
            strings: {
              hint: '',
              feedbackSelected: '',
              feedbackNotSelected: '',
            },
          },
          {
            uuid: v4(),
            text: 'Plasma',
            correct: false,
            strings: {
              hint: '',
              feedbackSelected: '',
              feedbackNotSelected: '',
            },
          },
        ],
        canAnswerMultiple: true,
        retryAllowed: true,
        randomOrder: true,
        showSolutionsAllowed: true,
        strings: {
          checkButton: 'Antworten überprüfen',
          retryButton: 'Erneut versuchen',
          solutionsButton: 'Lösungen anzeigen',
          resultMessage: ':correct/:total',
        },
        feedback: defaultFeedback(),
      };
    default:
      throw new Error('Unimplemented type: ' + type);
  }
}

export function viewerForTaskType(type: TaskDefinition['task_type']) {
  switch (type) {
    case 'DragTheWords':
      return DragTheWordsViewer;
    case 'FillInTheBlanks':
      return FillInTheBlanksViewer;
    case 'FindTheHotspot':
      return FindTheHotspotViewer;
    case 'FindTheWords':
      return FindTheWordsViewer;
    case 'Pairing':
      return PairingViewer;
    case 'Sequencing':
      return SequencingViewer;
    case 'InteractiveVideo':
      return InteractiveVideoViewer;
    case 'MarkTheWords':
      return MarkTheWordsViewer;
    case 'Memory':
      return MemoryViewer;
    case 'Question':
      return QuestionViewer;
    default:
      throw new Error('Unimplemented task type: ' + type);
  }
}

export function editorForTaskType(type: TaskDefinition['task_type']) {
  switch (type) {
    case 'DragTheWords':
      return DragTheWordsEditor;
    case 'FillInTheBlanks':
      return FillInTheBlanksEditor;
    case 'FindTheHotspot':
      return FindTheHotspotEditor;
    case 'FindTheWords':
      return FindTheWordsEditor;
    case 'Pairing':
      return PairingEditor;
    case 'Sequencing':
      return SequencingEditor;
    case 'InteractiveVideo':
      return InteractiveVideoEditor;
    case 'MarkTheWords':
      return MarkTheWordsEditor;
    case 'Memory':
      return MemoryEditor;
    case 'Question':
      return QuestionEditor;
    default:
      throw new Error('Unimplemented task type: ' + type);
  }
}

export function printTaskType(type: TaskDefinition['task_type']): string {
  switch (type) {
    case 'DragTheWords':
      return $gettext('Drag The Words');
    case 'FillInTheBlanks':
      return $gettext('Fill In The Blanks');
    case 'FindTheHotspot':
      return $gettext('Find The Hotspot');
    case 'FindTheWords':
      return $gettext('Find The Words');
    case 'Pairing':
      return $gettext('Pairing');
    case 'Sequencing':
      return $gettext('Sequencing');
    case 'InteractiveVideo':
      return $gettext('Interactive Video');
    case 'MarkTheWords':
      return $gettext('Mark The Words');
    case 'Memory':
      return $gettext('Memory');
    case 'Question':
      return $gettext('Question');
  }
}

/**
 * @return true if the viewer for the given task type should be visible
 * while the editor for that task type is open.
 */
export function showViewerAboveEditor(
  type: TaskDefinition['task_type']
): boolean {
  switch (type) {
    case 'InteractiveVideo':
    case 'Pairing':
      return false;
    default:
      return true;
  }
}

export function iconForTaskType(type: TaskDefinition['task_type']): string {
  switch (type) {
    case 'Memory':
      break;
    case 'FillInTheBlanks':
      return 'file-office';
    case 'FindTheWords':
      break;
    case 'Question':
      return 'question';
    case 'DragTheWords':
      return 'tan3';
    case 'MarkTheWords':
      return 'tan3';
    case 'Pairing':
      break;
    case 'Sequencing':
      break;
    case 'InteractiveVideo':
      break;
  }
  return 'question';
}

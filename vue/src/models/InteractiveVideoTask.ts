// Types for the Interactive Video task type.
import { z } from 'zod';
import {
  iconForTaskType,
  printTaskType,
  taskDefinitionSchemaMinusInteractiveVideo,
} from '@/models/TaskDefinition';
import { $gettext } from '@/language/gettext';
import { uploadedFileSchema } from '@/routes';

// There are different types of 'interaction' which can be added to the video.
// TODO Maybe put the 'base' attributes shared by all types of interaction all in one place.
// TODO I think it may be wiser to use 'startTime' and 'duration' rather than 'startTime' and 'endTime'.
// I chose to use 'start' and 'end' because it made the ui in one place easier to implement
// (v-model for 'end time' input field), but I have noticed that I must calculate a duration
// by hand in many other places anyway.

// Overlay: An overlay is shown on top of the video over a span of time
const overlaySchema = z.object({
  type: z.literal('overlay'),
  id: z.string(),
  startTime: z.number(), // Seconds
  endTime: z.number(), // Seconds
  x: z.number(), // Position, as a fraction of video width, between 0 and 1
  y: z.number(), // Position, as a fraction of video height, between 0 and 1
  width: z.number(), // Width, as a fraction of video width, between 0 and 1
  height: z.number(), // Height, as a fraction of video width, between 0 and 1
  text: z.string(), // Sanitized HTML from Wysiwyg editor
  pauseWhenVisible: z.boolean().optional().default(true),
});
export type OverlayInteraction = z.infer<typeof overlaySchema>;

// LMB Task interaction: A Lernmodule Block Task (LMB Task) is shown at a given
// point in the video for the student to solve.
const lmbTaskInteractionSchema = z.object({
  type: z.literal('lmbTask'),
  id: z.string(),
  startTime: z.number(), // Seconds
  endTime: z.number(), // Seconds
  x: z.number(), // Position, as a fraction of video width, between 0 and 1
  y: z.number(), // Position, as a fraction of video height, between 0 and 1
  taskDefinition: z.lazy(() => taskDefinitionSchemaMinusInteractiveVideo),
  pauseWhenVisible: z.boolean().optional().default(true),
});
export type LmbTaskInteraction = z.infer<typeof lmbTaskInteractionSchema>;

const interactiveVideoInteractionSchema = z
  .union([overlaySchema, lmbTaskInteractionSchema])
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime cannot be earlier than startTime',
    path: ['endTime'],
  });
export type Interaction = z.infer<typeof interactiveVideoInteractionSchema>;

export const interactiveVideoTaskSchema = z.object({
  task_type: z.literal('InteractiveVideo'),
  video: z.union([
    z.object({
      type: z.literal('none'),
    }),
    z.object({
      type: z.literal('youtube'),
      url: z.string(),
    }),
    z.object({
      type: z.literal('studipFileReference'),
      // TODO #20 -- Consider storing file ID instead of { url, name, type }
      file: uploadedFileSchema,
    }),
  ]),
  autoplay: z.boolean().optional().default(false),
  startAt: z.number().optional().default(0),
  disableNavigation: z
    .union([
      z.literal('not disabled'),
      z.literal('forward disabled'),
      z.literal('forward and backward disabled'),
    ])
    .default('not disabled'),
  interactions: z.array(interactiveVideoInteractionSchema),
});
export type InteractiveVideoTask = z.infer<typeof interactiveVideoTaskSchema>;

export function printInteractionType(interaction: Interaction): string {
  switch (interaction.type) {
    case 'lmbTask':
      return printTaskType(interaction.taskDefinition.task_type);
    case 'overlay':
      return $gettext('Einblendung');
  }
}

export function iconForInteraction(interaction: Interaction): string {
  switch (interaction.type) {
    case 'overlay':
      return 'tan3';
    case 'lmbTask':
      return iconForTaskType(interaction.taskDefinition.task_type);
  }
}

export const resizeHandles = [
  'left',
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
] as const;
export type ResizeHandle = typeof resizeHandles[number];

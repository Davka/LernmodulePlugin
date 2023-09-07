import { CKEditorConfig, CKEditorInstance } from '@/ckeditor4';

export {};

// Declarations for variables passed from php to the client
declare global {
  interface Window {
    STUDIP: {
      URLHelper: {
        getURL: (path: string) => string;
      };
      wysiwyg: {
        replace: (element: Element, config?: CKEditorConfig) => void;
        getEditor: (element: Element) => CKEditorInstance | undefined;
        // e is a <textarea> wrapped with jQuery's $() function
        // TODO Type this function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getDefaultConfig: (e: any) => CKEditorConfig;
      };
      wysiwyg_enabled: boolean;
      INSTALLED_LANGUAGES: { [name: string]: InstalledLanguage };
      ABSOLUTE_URI_STUDIP: string;
      ASSETS_URL: string;
      CSRF_TOKEN: { name: string; value: string };
      LernmoduleVueJS: {
        infotext: string;
        module: {
          // customdata should be an instance of 'TaskDefinition', but that
          // should be checked via parsing at runtime. That's why customdata is
          // annotated as type 'unknown'.
          customdata: unknown;
          module_id: string;
          name: string;
        };
        block_id?: string;
        saveRoute: string;
        updateAttemptRoute: string;
      };
    };
    // TODO use correct types for jQuery
    $: any;
  }
}

export interface InstalledLanguage {
  name: string;
  path: string;
  picture: string;
  selected: boolean;
}

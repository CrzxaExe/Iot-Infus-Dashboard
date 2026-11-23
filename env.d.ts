/// <reference types="vite/client" />
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, Record<string, never>>;
  export default component;
}

type Navigations = {
  label: string;
  to: string;
  icon: DefineComponent<object, object, Record<string, never>>;
}

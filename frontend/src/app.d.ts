/// <reference types="@sveltejs/kit" />

declare namespace App {
  // extend these interfaces for additional typing support
  type Locals = Record<string, never>;
  type PageData = Record<string, never>;
  type Error = Record<string, never>;
  type Platform = Record<string, never>;
}

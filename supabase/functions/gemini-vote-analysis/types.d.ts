// Deno Edge Function型定義
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
}

declare module "supabase" {
  export function createClient(url: string, key: string): any;
}

declare module "@google/generative-ai" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: { model: string }): any;
  }
}

// Deno グローバル
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

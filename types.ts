
export interface GlossaryItem {
  termino: string;
  definicion: string;
}

export interface TranslationResponse {
  traduccionSimplificada: string;
  listaPorPasos?: string[];
  glosario?: GlossaryItem[];
  error?: string;
}

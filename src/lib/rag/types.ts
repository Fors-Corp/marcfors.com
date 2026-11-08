export type Citation = {
  source_path: string;
  chunk_index: number;
  distance: number;
};

export type ChunkRow = {
  content: string;
  source_path: string;
  chunk_index: number;
  distance: number;
};

export type AskResult = {
  answer: string;
  citations: Citation[];
  embedding_model: string;
  chat_model: string;
  run_id: null;
};

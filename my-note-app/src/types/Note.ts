export interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string; // ISO 8601
  tags?: string[];
  imageUris?: string[]; // Multiple images support
}

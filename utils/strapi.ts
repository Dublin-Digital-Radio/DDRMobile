interface StrapiEntry<T> {
  attributes: T;
}

export interface StrapiEntryResponse<T> {
  data: StrapiEntry<T> | null;
}

export interface StrapiEntryListResponse<T> {
  data: StrapiEntry<T>[];
}

export interface StrapiEntryListResponse<T> {
  data: {
    attributes: T;
  }[];
}

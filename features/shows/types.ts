import {StrapiEntryResponse} from '../../utils/strapi';

export interface ShowInfo {
  name: string;
  tagline: string;
  image?: StrapiEntryResponse<{url: string}>;
  instagram?: string;
  twitter?: string;
}

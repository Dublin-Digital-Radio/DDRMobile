import {DDR_CMS_URL} from '@env';
import {useEffect, useState} from 'react';

import {StrapiEntryResponse} from '../../utils/strapi';

const discordInviteApiUrl = `${DDR_CMS_URL}/strapi-invite-link`;

export function useFetchDiscordInviteUrl() {
  const [discordInviteUrl, setDiscordInviteUrl] = useState<string>();

  useEffect(() => {
    fetch(discordInviteApiUrl)
      .then(response => response.json())
      .then(response => response as StrapiEntryResponse<{URL: string}>)
      .then(response => setDiscordInviteUrl(response.data?.attributes.URL));
  }, []);

  const discordInviteDeepLinkUri = discordInviteUrl?.replace(
    'https://',
    'discord://',
  );

  return {
    discordInviteUrl,
    discordInviteDeepLinkUri,
  };
}

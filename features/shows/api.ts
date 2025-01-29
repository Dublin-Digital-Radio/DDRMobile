import {decode} from 'html-entities';
import {z} from 'zod';
import {RADIO_CULT_PUBLIC_API_KEY} from '@env';

import {ShowInfo} from '../../features/shows/types';
import {StrapiEntryListResponse} from '../../utils/strapi';

export function decodeAirtimeShowName(airtimeShowName: string) {
  return decode(airtimeShowName);
}

export function convertAirtimeToCmsShowName(airtimeShowName: string) {
  const trimmedAirtimeShowName = airtimeShowName
    ? decodeURIComponent(airtimeShowName)
        .split('|')
        .map(showNameFragment => showNameFragment.trim())[0]
    : '';

  return decode((trimmedAirtimeShowName ?? '').replace(/\s*\(R\)/, ''));
}

const radioCultLiveShowSchema = z.object({
  success: z.boolean(),
  result: z.union([
    z.object({
      status: z.literal('schedule'),
      content: z.object({
        title: z.string(),
      }),
    }),
    z.object({
      status: z.literal('defaultPlaylist'),
      content: z.object({
        name: z.string(),
      }),
    }),
    z.object({
      status: z.literal('offAir'),
      content: z.literal('Off Air'),
    }),
  ]),
});

export async function fetchRadioCultLiveShow() {
  try {
    return await fetch(
      'https://api.radiocult.fm/api/station/dublin-digital-radio/schedule/live',
      {
        headers: {
          'x-api-key': RADIO_CULT_PUBLIC_API_KEY,
        },
      },
    )
      .then(response => response.json())
      .then(response => {
        return radioCultLiveShowSchema.parse(response);
      })
      .then(response => {
        if (response.result.status === 'offAir') {
          return null;
        } else if (response.result.status === 'defaultPlaylist') {
          return {
            ...response.result.content,
            title: response.result.content.name,
          };
        } else {
          return response.result.content;
        }
      });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function fetchShowInfo(showName: string) {
  return await fetch(
    `https://ddr-cms.fly.dev/api/shows?${new URLSearchParams({
      'filters[name][$eqi]': showName,
      populate: '*',
    })}`,
  )
    .then(response => response.json())
    .then(
      showInfoResponse => showInfoResponse as StrapiEntryListResponse<ShowInfo>,
    )
    .then(showInfoResponse => showInfoResponse.data)
    .then(showInfoEntries => {
      if (showInfoEntries[0]) {
        let showInfo = showInfoEntries[0].attributes;
        if (showInfo.image?.data?.attributes.url) {
          showInfo.image.data.attributes.url =
            showInfo.image.data.attributes.url.replace(/^http:/, 'https:');
        }

        return showInfo;
      }
    });
}

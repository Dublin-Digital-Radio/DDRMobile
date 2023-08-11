// The airtime library doesn't have type declarations yet.
// @ts-expect-error
import airtime from 'airtime-pro-api';
import {decode} from 'html-entities';

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

export async function getShows() {
  const ddrAirtime = airtime.init({stationName: 'dublindigitalradio'});
  try {
    const res = await ddrAirtime.liveInfoV2();
    return res.shows;
  } catch (err: any) {
    return;
  }
}

export async function fetchShowInfo(showName: string) {
  return await fetch(
    `https://ddr-cms.fly.dev/api/shows?filters[name][$eqi]=${encodeURIComponent(
      showName,
    )}&populate=*`,
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

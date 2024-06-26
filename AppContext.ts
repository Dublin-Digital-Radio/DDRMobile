import React, {createContext} from 'react';

import {ShowInfo} from './features/shows/types';

interface AppContext {
  currentShowTitle: string;
  setCurrentShowTitle: React.Dispatch<React.SetStateAction<string>>;
  currentShowInfo?: ShowInfo;
  setCurrentShowInfo: React.Dispatch<
    React.SetStateAction<ShowInfo | undefined>
  >;
  refreshTrackData: () => Promise<void>;
  showInfoModalVisible: boolean;
  setShowInfoModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContext>({
  currentShowTitle: '...',
  setCurrentShowTitle: () => {},
  currentShowInfo: undefined,
  setCurrentShowInfo: () => {},
  refreshTrackData: () => new Promise(() => {}),
  showInfoModalVisible: false,
  setShowInfoModalVisible: () => {},
});

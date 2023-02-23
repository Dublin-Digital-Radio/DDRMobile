import React, {createContext} from 'react';

import {ShowInfo} from './features/shows/types';

interface AppContext {
  currentShowInfo?: ShowInfo;
  setCurrentShowInfo: React.Dispatch<
    React.SetStateAction<ShowInfo | undefined>
  >;
}

export const AppContext = createContext<AppContext>({
  currentShowInfo: undefined,
  setCurrentShowInfo: () => {},
});

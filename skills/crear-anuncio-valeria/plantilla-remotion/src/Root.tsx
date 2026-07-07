import React from 'react';
import {Composition} from 'remotion';
import {Anuncio, TOTAL_DURATION, FPS, WIDTH, HEIGHT} from './Anuncio';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Anuncio"
      component={Anuncio}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

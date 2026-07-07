import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Series,
  staticFile,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import {WhatsAppScene, WHATSAPP_DURATION} from './WhatsAppScene';

export const FPS = 30;
export const WIDTH = 720;
export const HEIGHT = 1280;

// ---------- Recortes de silencio por clip (frames a 30fps) ----------
// Detectados con silencedetect: se quitan cabeceras y colas mudas.
const T = {
  clip1: {startFrom: 0, endAt: 145},   // habla 0–4.85s (cola muda fuera)
  clip2: {startFrom: 27, endAt: 115},  // 1s mudo de cabecera fuera
  clip3: {startFrom: 7, endAt: 136},   // 0.25s cabecera + cola fuera
  cta_a: {startFrom: 16, endAt: 39},   // "Haz clic" (0.55–1.30s)
  cta_b: {startFrom: 66, endAt: 121},  // "e instala el tuyo" (2.20–4.05s)
};
const dur = (t: {startFrom: number; endAt: number}) => t.endAt - t.startFrom;

export const TOTAL_DURATION =
  dur(T.clip1) +
  dur(T.clip2) +
  WHATSAPP_DURATION +
  dur(T.clip3) +
  dur(T.cta_a) +
  dur(T.cta_b);

// ---------- Subtítulo estilo UGC ----------
type CaptionPart = {text: string; highlight?: boolean};

const Caption: React.FC<{parts: CaptionPart[]}> = ({parts}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 5], [0.85, 1], {
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 170,
        paddingLeft: 40,
        paddingRight: 40,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: 'center',
          fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 900,
          fontSize: 52,
          lineHeight: 1.15,
          color: 'white',
          textTransform: 'uppercase',
          textShadow:
            '0 3px 0 rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6), 2px 2px 8px rgba(0,0,0,0.9)',
          WebkitTextStroke: '2px black',
        }}
      >
        {parts.map((p, i) => (
          <span key={i} style={{color: p.highlight ? '#25D366' : 'white'}}>
            {p.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Clip de Valeria con recorte y subtítulo ----------
const ValeriaClip: React.FC<{
  src: string;
  parts: CaptionPart[];
  startFrom: number;
  endAt: number;
}> = ({src, parts, startFrom, endAt}) => {
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        endAt={endAt}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
      <Caption parts={parts} />
    </AbsoluteFill>
  );
};

// ---------- Composición final ----------
export const Anuncio: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Series>
        <Series.Sequence durationInFrames={dur(T.clip1)}>
          <ValeriaClip
            src="clip1-hook.mp4"
            {...T.clip1}
            parts={[
              {text: 'EN ESTE ORDENADOR TENGO UN '},
              {text: 'TRABAJADOR DE IA', highlight: true},
              {text: ' TRABAJANDO '},
              {text: '24 HORAS', highlight: true},
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={dur(T.clip2)}>
          <ValeriaClip
            src="clip2-whatsapp.mp4"
            {...T.clip2}
            parts={[
              {text: 'Y LE HABLO POR '},
              {text: 'WHATSAPP', highlight: true},
              {text: ' COMO A UNA PERSONA'},
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={WHATSAPP_DURATION}>
          <WhatsAppScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={dur(T.clip3)}>
          <ValeriaClip
            src="clip3-precio.mp4"
            {...T.clip3}
            parts={[
              {text: 'NO COBRA NÓMINA, NO COGE VACACIONES.'},
              {text: ' CUESTA '},
              {text: 'UN CAFÉ AL DÍA ☕', highlight: true},
            ]}
          />
        </Series.Sequence>

        {/* CTA partido en dos: fuera la pausa interna de 1.14s (jump cut UGC) */}
        <Series.Sequence durationInFrames={dur(T.cta_a)}>
          <ValeriaClip
            src="clip4-cta.mp4"
            {...T.cta_a}
            parts={[{text: 'HAZ CLIC', highlight: true}]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={dur(T.cta_b)}>
          <ValeriaClip
            src="clip4-cta.mp4"
            {...T.cta_b}
            parts={[
              {text: 'E INSTALA '},
              {text: 'EL TUYO 👇', highlight: true},
            ]}
          />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

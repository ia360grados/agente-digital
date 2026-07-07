import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  spring,
  useVideoConfig,
  interpolate,
} from 'remotion';

const FPS = 30;
const NARRATION_TRIM = 5; // frames mudos recortados de la cabecera del clip5
export const WHATSAPP_DURATION = 356 - NARRATION_TRIM; // ~11.7s, al ritmo de la voz

// ---------- Guion del chat, sincronizado con la voz en off ----------
// VO: "Mira: hazle la factura de 450€ a García... hecha y enviada.
//      ¿Qué tengo mañana?... me lo dice.
//      Y a las 3 de la madrugada un cliente pide cita... y él se la da. Solo."
type Msg = {
  at: number;
  from: 'me' | 'bot';
  text: string;
  time: string;
  divider?: string;
};

const MESSAGES: Msg[] = [
  {at: 0.6, from: 'me', text: 'Hazle la factura de 450€ a García', time: '9:14'},
  {at: 2.2, from: 'bot', text: '✅ Hecha y enviada', time: '9:14'},
  {at: 4.2, from: 'me', text: '¿Qué tengo mañana?', time: '9:15'},
  {
    at: 5.4,
    from: 'bot',
    text: '4 citas: 10:00 García · 11:30 Ortiz · 16:00 Prado · 17:30 Vidal',
    time: '9:15',
  },
  {
    at: 7.6,
    from: 'me',
    text: 'Hola, ¿tenéis hueco esta semana?',
    time: '3:12',
    divider: '🌙 3:12 AM',
  },
  {
    at: 9.6,
    from: 'bot',
    text: '¡Claro! 😊 Jueves 10:00. ¿Te lo reservo?',
    time: '3:12',
  },
];

// Momentos de "punch" de zoom: cada respuesta del agente
const PUNCHES = [2.2, 5.4, 9.6];

// Indicador escribiendo: ráfagas cortas antes de cada respuesta
const TYPING: Array<[number, number]> = [
  [1.4, 2.2],
  [4.8, 5.4],
  [8.8, 9.6],
];

// ---------- Burbuja ----------
const Bubble: React.FC<{msg: Msg}> = ({msg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = Math.round(msg.at * FPS);
  if (frame < startFrame) return null;

  const pop = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 12, stiffness: 300},
  });

  const isMe = msg.from === 'me';
  return (
    <>
      {msg.divider ? (
        <div
          style={{
            alignSelf: 'center',
            background: '#0B141A',
            color: '#8FB99C',
            borderRadius: 14,
            padding: '8px 20px',
            fontSize: 26,
            fontWeight: 800,
            margin: '14px 0 4px',
            opacity: pop,
          }}
        >
          {msg.divider}
        </div>
      ) : null}
      <div
        style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          transform: `scale(${pop})`,
          transformOrigin: isMe ? 'bottom right' : 'bottom left',
          background: isMe ? '#DCF8C6' : 'white',
          borderRadius: 18,
          borderBottomRightRadius: isMe ? 4 : 18,
          borderBottomLeftRadius: isMe ? 18 : 4,
          padding: '15px 20px 9px',
          maxWidth: '80%',
          margin: '5px 0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          fontSize: 33,
          lineHeight: 1.3,
          fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
          color: '#111B21',
          fontWeight: 500,
        }}
      >
        {msg.text}
        <div
          style={{
            fontSize: 19,
            color: '#667781',
            textAlign: 'right',
            marginTop: 3,
          }}
        >
          {msg.time} {isMe ? '✓✓' : ''}
        </div>
      </div>
    </>
  );
};

// ---------- Indicador "escribiendo…" ----------
const TypingIndicator: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const active = TYPING.some(([a, b]) => sec >= a && sec < b);
  if (!active) return null;

  const dot = (i: number) => {
    const phase = (frame / 5 + i) % 3;
    const up = phase < 1 ? phase : 2 - phase;
    return (
      <div
        key={i}
        style={{
          width: 13,
          height: 13,
          borderRadius: '50%',
          background: '#8696A0',
          transform: `translateY(${-6 * Math.max(0, up)}px)`,
        }}
      />
    );
  };

  return (
    <div
      style={{
        alignSelf: 'flex-start',
        background: 'white',
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        padding: '18px 22px',
        margin: '5px 0',
        display: 'flex',
        gap: 7,
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }}
    >
      {[0, 1, 2].map(dot)}
    </div>
  );
};

// ---------- Escena: chat + Valeria narrando en círculo (PiP) ----------
export const WhatsAppScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = frame / FPS;

  // Zoom "punch" en cada respuesta del agente: golpe de 1.06 que decae en ~0.5s
  let zoom = 1;
  for (const p of PUNCHES) {
    const pf = Math.round(p * FPS);
    const since = frame - pf;
    if (since >= 0 && since <= 16) {
      zoom += 0.06 * (1 - since / 16);
    }
  }

  // Rótulo nocturno
  const nightOpacity = interpolate(sec, [7.6, 8.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Entrada del PiP
  const pipIn = spring({frame, fps, config: {damping: 14, stiffness: 180}});

  return (
    <AbsoluteFill style={{background: '#ECE5DD'}}>
      {/* Chat con zoom punch */}
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <AbsoluteFill
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 24px)',
          }}
        />
        {/* Cabecera */}
        <div
          style={{
            background: '#075E54',
            padding: '26px 24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            🤖
          </div>
          <div style={{fontFamily: '-apple-system, Arial, sans-serif'}}>
            <div style={{color: 'white', fontSize: 32, fontWeight: 700}}>
              Tu Agente · Empleado IA
            </div>
            <div style={{color: '#B5DCCD', fontSize: 23}}>en línea</div>
          </div>
        </div>

        {/* Mensajes */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px 26px 340px',
          }}
        >
          {MESSAGES.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
          <TypingIndicator />
        </div>
      </AbsoluteFill>

      {/* Valeria narrando — círculo PiP con SU VOZ (audio del clip) */}
      <div
        style={{
          position: 'absolute',
          bottom: 46,
          left: 40,
          width: 300,
          height: 300,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '7px solid #25D366',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          transform: `scale(${pipIn})`,
          transformOrigin: 'bottom left',
        }}
      >
        <OffthreadVideo
          src={staticFile('clip5-narracion.mp4')}
          startFrom={NARRATION_TRIM}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.35)',
          }}
        />
      </div>

      {/* Rótulo nocturno */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          paddingBottom: 120,
          paddingRight: 40,
          opacity: nightOpacity,
        }}
      >
        <div
          style={{
            textAlign: 'right',
            fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 900,
            fontSize: 44,
            textTransform: 'uppercase',
            color: 'white',
            WebkitTextStroke: '2px black',
            textShadow: '0 3px 0 rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)',
            maxWidth: 380,
            lineHeight: 1.1,
          }}
        >
          ATIENDE <span style={{color: '#25D366'}}>A LAS 3 AM</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

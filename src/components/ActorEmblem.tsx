import React from 'react';
import { ActorEmblemKind } from '../data/globalActorsData';

interface ActorEmblemProps {
  kind: ActorEmblemKind;
  color: string;
  size?: number;
}

/**
 * Bespoke miniature character portraits & city/institution/media crest SVGs
 * representing each commune, medium, or public figure visually.
 */
export const ActorEmblem: React.FC<ActorEmblemProps> = ({ kind, color, size = 38 }) => {
  const renderArt = () => {
    switch (kind) {
      case 'faro-laserena':
        // Faro Monumental de La Serena
        return (
          <g>
            <path d="M9 31h22" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
            <path d="M13 31l2.5-15h9L27 31H13z" fill="#F8FAFC" stroke={color} strokeWidth="1.5" />
            <path d="M16 16v-3.5h8V16" fill={color} />
            <circle cx="20" cy="10.5" r="2.2" fill="#FFB800" />
            <path d="M8 10.5l6.5 0M25.5 10.5l6.5 0M10.5 6.5l5 2.5M29.5 6.5l-5 2.5" stroke="#FFB800" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M17 31v-5a3 3 0 0 1 6 0v5" fill="#0F172A" />
          </g>
        );

      case 'cruz-coquimbo':
        // Cruz del Tercer Milenio + Ancla Portuaria Coquimbo
        return (
          <g>
            <path d="M20 6v23M12 13.5h16" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
            <path d="M20 7.5v20M13.5 13.5h13" stroke="#F8FAFC" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M11 26c2 4 6 5.5 9 5.5s7-1.5 9-5.5" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="24" r="1.6" fill="#FFB800" />
          </g>
        );

      case 'valle-ovalle':
        // Valle y arcos plaza de Ovalle / Limarí
        return (
          <g>
            <path d="M6 27c5-6 9-6 14 0s9 6 14 0" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="13" r="4.5" fill="#FFB800" />
            <path d="M12 29v-8a8 8 0 0 1 16 0v8" fill="none" stroke={color} strokeWidth="2" />
            <path d="M16.5 29v-5.5a3.5 3.5 0 0 1 7 0V29" fill={color} opacity="0.4" />
          </g>
        );

      case 'astro-vicuna':
        // Cúpula Astronómica Valle del Elqui / Vicuña
        return (
          <g>
            <circle cx="11" cy="10" r="1.3" fill="#FFB800" />
            <circle cx="29" cy="11" r="1.5" fill="#00F0FF" />
            <circle cx="25" cy="7" r="1" fill="#FFFFFF" />
            <path d="M11 28v-5a9 9 0 0 1 18 0v5H11z" fill="#1E293B" stroke={color} strokeWidth="1.7" />
            <path d="M20 14l5-6" stroke="#00F0FF" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M8 29h24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'embalse-mpatria':
        // Embalse La Paloma · Monte Patria
        return (
          <g>
            <path d="M6 19l8-8 6 5 6-6 8 9" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 22h22l-3 7H12l-3-7z" fill="#0F172A" stroke={color} strokeWidth="1.6" />
            <path d="M8 25.5c3-1.5 6 1.5 9 0s6 1.5 9 0 4 1 6 0" fill="none" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        );

      case 'costa-losvilos':
        // Borde costero y olas Los Vilos
        return (
          <g>
            <circle cx="26" cy="12" r="4" fill="#FFB800" />
            <path d="M7 22c3-2.5 6 2.5 9 0s6 2.5 9 0 5 2 8 0" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M7 27.5c3-2.5 6 2.5 9 0s6 2.5 9 0 5 2 8 0" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M12 19l4-7 4 7" fill="none" stroke="#F8FAFC" strokeWidth="1.6" strokeLinejoin="round" />
          </g>
        );

      case 'oro-illapel':
      case 'cordillera-salamanca':
        // Cordillera del Choapa + Sol
        return (
          <g>
            <circle cx="26" cy="11" r="3.5" fill="#FFB800" />
            <path d="M6 28l9-12 5 6 5-9 9 15H6z" fill="#1E293B" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M12 21l3-4 2.5 3M22.5 18l2.5-4.5 3 4.5" stroke="#F8FAFC" strokeWidth="1.3" strokeLinecap="round" />
          </g>
        );

      case 'radio-wave':
        // Antena y ondas de Mi Radio
        return (
          <g>
            <path d="M15 30l5-16 5 16M16.5 25h7" fill="none" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="20" cy="13" r="2.5" fill={color} />
            <path d="M13 17a8 8 0 0 1 0-8M27 9a8 8 0 0 1 0 8M9.5 19.5a12 12 0 0 1 0-13M30.5 6.5a12 12 0 0 1 0 13" fill="none" stroke="#38BDF8" strokeWidth="1.7" strokeLinecap="round" />
          </g>
        );

      case 'press-sheet':
        // Portada de Prensa Diario El Día
        return (
          <g>
            <rect x="9" y="9" width="22" height="22" rx="3" fill="#F8FAFC" stroke={color} strokeWidth="1.8" />
            <rect x="12.5" y="12.5" width="15" height="4" rx="1" fill={color} />
            <rect x="12.5" y="19" width="7" height="8.5" rx="1" fill="#0F172A" />
            <path d="M22 20h5.5M22 23.5h5.5M22 27h4" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        );

      case 'sound-leaf':
        // Guayacán FM / Media Verde
        return (
          <g>
            <path d="M11 25c0-8 7-14 17-14 0 9-5 16-14 16-1.2 0-2.2-.8-3-2z" fill={color} opacity="0.9" />
            <path d="M11 26c5-4 10-7 15-11" stroke="#060B19" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="13" cy="13" r="2" fill="#34D399" />
          </g>
        );

      case 'cam-urban':
        // Cámara urbana / transmisión en vivo
        return (
          <g>
            <rect x="8" y="13" width="17" height="14" rx="3" fill="#1E293B" stroke={color} strokeWidth="1.8" />
            <path d="M25 17l7-3.5v13L25 23v-6z" fill={color} />
            <circle cx="16.5" cy="20" r="3.5" fill="#F8FAFC" />
            <circle cx="12" cy="16" r="1.2" fill="#EF4444" />
          </g>
        );

      case 'papaya-tv':
        // Pantalla viral Papaya TV
        return (
          <g>
            <rect x="8" y="11" width="24" height="17" rx="4" fill="#1E293B" stroke={color} strokeWidth="1.8" />
            <path d="M17 15.5l8 4-8 4v-8z" fill={color} />
            <path d="M15 8l5 3 5-3" fill="none" stroke="#FFB800" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        );

      case 'neighbors':
        // Red Vecinos La Serena
        return (
          <g>
            <path d="M9 28v-8l5.5-4.5L20 20v8H9z" fill="#1E293B" stroke={color} strokeWidth="1.6" />
            <path d="M20 28v-9l5.5-4.5L31 19v9H20z" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.6" />
            <circle cx="20" cy="10" r="2.5" fill="#FFB800" />
          </g>
        );

      case 'persona-alcaldesa':
        // Miniatura retrato Alcaldesa Daniela Norambuena (traje ejecutivo + banda edilicia)
        return (
          <g>
            <path d="M10 33c0-5.5 4.2-9 10-9s10 3.5 10 9" fill="#0F172A" stroke={color} strokeWidth="1.5" />
            <path d="M15 24.5l10 8.5" stroke="#0284C7" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M13.5 15.5c0-4.5 2.8-7.5 6.5-7.5s6.5 3 6.5 7.5v3.5c0 1-.5 2-1.5 2h-10c-1 0-1.5-1-1.5-2v-3.5z" fill="#92400E" />
            <circle cx="20" cy="16.5" r="5" fill="#FDBA74" />
            <path d="M15 15.5c1.5-2.5 8-2.5 10 0" fill="#92400E" />
          </g>
        );

      case 'persona-ali':
        // Miniatura retrato Alcalde de Coquimbo Ali Manouchehri (traje oscuro + banda alcaldicia)
        return (
          <g>
            <path d="M10 33c0-5.5 4.2-9 10-9s10 3.5 10 9" fill="#1E293B" stroke={color} strokeWidth="1.5" />
            <path d="M15 24.5l10 8.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="20" cy="16" r="5.2" fill="#FED7AA" />
            <path d="M14.8 14.5c0-3.8 2.4-6 5.2-6s5.2 2.2 5.2 6c-1.8-1.2-8.6-1.2-10.4 0z" fill="#0F172A" />
            <path d="M16.5 19c1.2 1.6 5.8 1.6 7 0" fill="none" stroke="#334155" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        );

      case 'persona-ahumada':
        // Miniatura retrato Alcalde Ahumada (Paihuano + detalle OVNI Cochiguaz)
        return (
          <g>
            <path d="M10 33c0-5.5 4.2-9 10-9s10 3.5 10 9" fill="#0F172A" stroke={color} strokeWidth="1.5" />
            <circle cx="20" cy="16.5" r="5" fill="#FDBA74" />
            <path d="M15 15c0-3.4 2.2-5.5 5-5.5s5 2.1 5 5.5" fill="#334155" />
            <ellipse cx="30" cy="9.5" rx="4.2" ry="1.6" fill="#00F0FF" />
            <circle cx="30" cy="8.6" r="1.5" fill="#F8FAFC" />
          </g>
        );

      case 'persona-denis':
        // Miniatura retrato Denis Cortés (Illapel + nota musical Reel viral)
        return (
          <g>
            <path d="M10 33c0-5.5 4.2-9 10-9s10 3.5 10 9" fill="#1E293B" stroke={color} strokeWidth="1.5" />
            <path d="M15.5 24.5l9 8.5" stroke="#FFB800" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="20" cy="16.5" r="5" fill="#FED7AA" />
            <path d="M15 15c0-3.2 2.2-5.5 5-5.5s5 2.3 5 5.5" fill="#1E293B" />
            <path d="M29 14v-6l4-1v5" fill="none" stroke="#FF2E93" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="27.8" cy="14" r="1.4" fill="#FF2E93" />
          </g>
        );

      case 'persona-vega':
        // Miniatura retrato Héctor Vega + gota hídrica Embalse
        return (
          <g>
            <path d="M10 33c0-5.5 4.2-9 10-9s10 3.5 10 9" fill="#1E293B" stroke={color} strokeWidth="1.5" />
            <circle cx="20" cy="16.5" r="5" fill="#FDBA74" />
            <path d="M15 15c0-3.2 2.2-5.5 5-5.5s5 2.3 5 5.5" fill="#475569" />
            <path d="M30 7c2 2.6 2.8 4 2.8 5.2a2.8 2.8 0 0 1-5.6 0C27.2 11 28 9.6 30 7z" fill="#38BDF8" />
          </g>
        );
    }
  };

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[#0B1328]"
      style={{
        width: size,
        height: size,
        borderColor: `${color}80`,
        boxShadow: `0 0 14px ${color}33`,
      }}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <defs>
          <radialGradient id={`bg-${kind}`} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor="#060B19" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#bg-${kind})`} />
        {renderArt()}
      </svg>
    </div>
  );
};

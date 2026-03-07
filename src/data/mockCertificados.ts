import type {
  CertificadoGenerado,
  PlantillaCertificado,
  TipoCertificado,
  SolicitudExcepcionCertificado,
} from '@/types/certificado';

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#FAFAF8" rx="8"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#1a365d" stroke-width="3" rx="6"/>
  <rect x="30" y="30" width="740" height="540" fill="none" stroke="#2b6cb0" stroke-width="1" rx="4"/>

  <g id="header-logo">
    <circle cx="400" cy="80" r="30" fill="#2b6cb0" opacity="0.15"/>
    <text id="titulo-empresa" x="400" y="88" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a365d">CEFIH</text>
  </g>

  <text id="titulo-certificado" x="400" y="140" text-anchor="middle" font-size="28" font-weight="bold" fill="#1a365d">CERTIFICADO DE FORMACIÓN</text>
  <text id="subtitulo" x="400" y="170" text-anchor="middle" font-size="14" fill="#4a5568">Se otorga el presente certificado a:</text>

  <text id="nombre-persona" x="400" y="220" text-anchor="middle" font-size="24" font-weight="bold" fill="#2b6cb0">{{nombreCompleto}}</text>
  <text id="documento-persona" x="400" y="250" text-anchor="middle" font-size="13" fill="#4a5568">{{tipoDocumento}} {{numeroDocumento}}</text>

  <g id="bloque-curso">
    <text id="label-curso" x="400" y="300" text-anchor="middle" font-size="13" fill="#718096">Por haber completado satisfactoriamente el curso:</text>
    <text id="tipo-formacion" x="400" y="330" text-anchor="middle" font-size="18" font-weight="600" fill="#1a365d">{{tipoFormacion}}</text>
    <text id="numero-curso" x="400" y="355" text-anchor="middle" font-size="13" fill="#718096">Curso N° {{numeroCurso}}</text>
  </g>

  <g id="bloque-detalles">
    <text id="duracion" x="250" y="400" text-anchor="middle" font-size="12" fill="#4a5568">Duración: {{duracionDias}} días ({{horasTotales}} horas)</text>
    <text id="fechas" x="550" y="400" text-anchor="middle" font-size="12" fill="#4a5568">Periodo: {{fechaInicio}} - {{fechaFin}}</text>
  </g>

  <g id="bloque-empresa">
    <text id="empresa" x="400" y="440" text-anchor="middle" font-size="12" fill="#4a5568">Empresa: {{empresaNombre}} — NIT: {{empresaNit}}</text>
    <text id="cargo" x="400" y="460" text-anchor="middle" font-size="12" fill="#4a5568">Cargo: {{empresaCargo}}</text>
  </g>

  <g id="bloque-firmas">
    <line x1="150" y1="510" x2="350" y2="510" stroke="#1a365d" stroke-width="1"/>
    <text id="firma-entrenador" x="250" y="530" text-anchor="middle" font-size="11" fill="#4a5568">{{entrenadorNombre}}</text>
    <text x="250" y="545" text-anchor="middle" font-size="10" fill="#718096">Entrenador</text>

    <line x1="450" y1="510" x2="650" y2="510" stroke="#1a365d" stroke-width="1"/>
    <text id="firma-supervisor" x="550" y="530" text-anchor="middle" font-size="11" fill="#4a5568">{{supervisorNombre}}</text>
    <text x="550" y="545" text-anchor="middle" font-size="10" fill="#718096">Supervisor</text>
  </g>

  <text id="codigo-certificado" x="400" y="575" text-anchor="middle" font-size="10" fill="#a0aec0">Código: {{codigoCertificado}} — Generado: {{fechaGeneracion}}</text>
</svg>`;

const now = new Date().toISOString();

export const mockCertificados: CertificadoGenerado[] = [];
export const mockPlantillas: PlantillaCertificado[] = [
  {
    id: 'plantilla-001',
    nombre: 'Certificado Estándar CEFIH',
    svgRaw: MOCK_SVG,
    tokensDetectados: [
      'nombreCompleto', 'tipoDocumento', 'numeroDocumento',
      'tipoFormacion', 'numeroCurso', 'duracionDias', 'horasTotales',
      'fechaInicio', 'fechaFin', 'empresaNombre', 'empresaNit',
      'empresaCargo', 'entrenadorNombre', 'supervisorNombre',
      'codigoCertificado', 'fechaGeneracion',
    ],
    activa: true,
    version: 1,
    historial: [{ version: 1, svgRaw: MOCK_SVG, fecha: now, modificadoPor: 'admin' }],
    createdAt: now,
    updatedAt: now,
  },
];
export const mockTiposCertificado: TipoCertificado[] = [];
export const mockExcepcionesCertificado: SolicitudExcepcionCertificado[] = [];

import logoEmpresa from "@/assets/logo-empresa.png";

interface DocumentHeaderProps {
  nombreDocumento: string;
  codigo: string;
  version: string;
  fechaCreacion: string;
  fechaEdicion: string;
  empresaNombre?: string;
  sistemaGestion?: string;
  subsistema: string;
}

const DEFAULTS = {
  empresaNombre: "FREDDY IVAN HOYOS INSTRUCTORES Y FACILITADORES LTDA.",
  sistemaGestion: "SISTEMA DE GESTIÓN INTEGRADO",
};

export default function DocumentHeader({
  nombreDocumento,
  codigo,
  version,
  fechaCreacion,
  fechaEdicion,
  empresaNombre = DEFAULTS.empresaNombre,
  sistemaGestion = DEFAULTS.sistemaGestion,
  subsistema,
}: DocumentHeaderProps) {
  return (
    <div className="doc-header" style={styles.header}>
      {/* Logo */}
      <div className="doc-header-logo" style={styles.logo}>
        <img src={logoEmpresa} alt="Logo empresa" style={styles.logoImg} />
      </div>

      {/* Center: document name + code/version */}
      <div className="doc-header-center" style={styles.center}>
        <div className="doc-header-center-title" style={styles.centerTitle}>
          {nombreDocumento}
        </div>
        <div className="doc-header-center-meta" style={styles.centerMeta}>
          <div className="doc-header-meta-cell" style={styles.metaCellLeft}>
            <span style={styles.metaLabel}>Código:</span>
            <span style={styles.metaValue}>{codigo}</span>
          </div>
          <div className="doc-header-meta-cell" style={styles.metaCellRight}>
            <span style={styles.metaLabel}>Versión:</span>
            <span style={styles.metaValue}>{version}</span>
          </div>
        </div>
      </div>

      {/* Right: company info */}
      <div className="doc-header-right" style={styles.right}>
        <div className="doc-header-empresa" style={styles.empresa}>
          {empresaNombre}
        </div>
        <div className="doc-header-sgi" style={styles.sgi}>
          {sistemaGestion}
        </div>
        <div className="doc-header-subsistema" style={styles.subsistema}>
          SUBSISTEMA: {subsistema}
        </div>
        <div className="doc-header-fechas" style={styles.fechas}>
          <div className="doc-header-fecha-cell" style={styles.fechaCellLeft}>
            CREACIÓN: {fechaCreacion}
          </div>
          <div className="doc-header-fecha-cell" style={styles.fechaCellRight}>
            EDICIÓN: {fechaEdicion}
          </div>
        </div>
      </div>
    </div>
  );
}

const border = "1px solid #9ca3af";

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 1fr",
    border,
    breakInside: "avoid",
    fontSize: "11px",
    lineHeight: "1.4",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRight: border,
  },
  logoImg: {
    maxWidth: "105px",
    maxHeight: "73px",
    objectFit: "contain",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    borderRight: border,
  },
  centerTitle: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "8px",
    textAlign: "center",
  },
  centerMeta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderTop: border,
  },
  metaCellLeft: {
    padding: "4px 8px",
    borderRight: border,
    display: "flex",
    flexDirection: "column",
  },
  metaCellRight: {
    padding: "4px 8px",
    display: "flex",
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: "9px",
    textTransform: "uppercase",
    color: "#6b7280",
    letterSpacing: "0.05em",
  },
  metaValue: {
    fontWeight: 600,
  },
  right: {
    display: "flex",
    flexDirection: "column",
  },
  empresa: {
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "6px 8px",
    borderBottom: border,
    fontSize: "11px",
    lineHeight: "1.3",
  },
  sgi: {
    padding: "4px 8px",
    borderBottom: border,
    fontWeight: 500,
  },
  subsistema: {
    padding: "4px 8px",
    borderBottom: border,
  },
  fechas: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
  },
  fechaCellLeft: {
    padding: "4px 8px",
    borderRight: border,
    fontSize: "10px",
    fontWeight: 500,
  },
  fechaCellRight: {
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 500,
  },
};

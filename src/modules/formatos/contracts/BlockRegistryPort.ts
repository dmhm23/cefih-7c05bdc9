/**
 * BlockRegistryPort — registro extensible de tipos de bloque.
 *
 * Cada bloque declara su comportamiento (schema, defaults, componentes UI),
 * permitiendo que el host SAFA o cualquier host externo añada sus propios
 * bloques sin tocar el core.
 */
import type { ComponentType } from 'react';

export interface BlockDefinition<TProps = Record<string, unknown>> {
  /** Identificador único del tipo de bloque. */
  type: string;
  /** Etiqueta humana para el catálogo del editor. */
  label: string;
  /** Categoría para agrupar en el catálogo (texto, formulario, firma, etc.). */
  category?: string;
  /** Icono opcional (nombre de lucide-react o componente). */
  icon?: string;
  /** Props por defecto al crear el bloque. */
  defaultProps?: TProps;
  /** Componente que renderiza el bloque dentro del editor (modo edición). */
  EditorComponent?: ComponentType<{ block: BlockInstance<TProps>; onChange: (b: BlockInstance<TProps>) => void }>;
  /** Componente que renderiza el bloque en el render final (preview, portal, PDF). */
  RendererComponent?: ComponentType<{ block: BlockInstance<TProps>; value: unknown; onChange?: (v: unknown) => void; readOnly?: boolean }>;
  /** Componente custom para inspector (panel de propiedades). */
  InspectorComponent?: ComponentType<{ block: BlockInstance<TProps>; onChange: (b: BlockInstance<TProps>) => void }>;
  /** Validación opcional de los props del bloque. */
  validate?: (block: BlockInstance<TProps>) => string[];
  /** Indica si el bloque produce respuesta persistible (vs decorativo). */
  isInput?: boolean;
}

export interface BlockInstance<TProps = Record<string, unknown>> {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  editable?: boolean;
  visibilityRule?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'is_filled' | 'is_empty';
    value?: unknown;
  };
  props?: TProps;
}

export interface BlockRegistryPort {
  register<TProps>(definition: BlockDefinition<TProps>): void;
  get(type: string): BlockDefinition | undefined;
  list(): BlockDefinition[];
  has(type: string): boolean;
}

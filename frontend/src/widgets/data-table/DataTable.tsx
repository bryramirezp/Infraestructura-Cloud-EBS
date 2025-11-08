/**
 * Widget: DataTable
 * Tabla de datos completa con filtros, ordenamiento y paginación
 * 
 * @module widgets/data-table/DataTable
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

/**
 * Definición de columna
 */
export interface ColumnDef<T> {
  /**
   * Key único de la columna (debe coincidir con una propiedad del objeto de datos)
   */
  key: string;
  
  /**
   * Etiqueta a mostrar en el encabezado
   */
  label: string;
  
  /**
   * Si la columna es ordenable
   * @default false
   */
  sortable?: boolean;
  
  /**
   * Función de renderizado personalizada para la celda
   */
  render?: (value: any, row: T) => React.ReactNode;
  
  /**
   * Ancho de la columna (opcional)
   */
  width?: string;
}

/**
 * Props del componente DataTable
 */
export interface DataTableProps<T> {
  /**
   * Array de datos a mostrar
   */
  data: T[];
  
  /**
   * Definición de columnas
   */
  columns: ColumnDef<T>[];
  
  /**
   * Si la tabla es buscable
   * @default true
   */
  searchable?: boolean;
  
  /**
   * Placeholder para el campo de búsqueda
   * @default "Buscar..."
   */
  searchPlaceholder?: string;
  
  /**
   * Si la tabla es ordenable
   * @default true
   */
  sortable?: boolean;
  
  /**
   * Si la tabla tiene paginación
   * @default true
   */
  paginated?: boolean;
  
  /**
   * Tamaño de página (cuando paginated es true)
   * @default 10
   */
  pageSize?: number;
  
  /**
   * Función para renderizar acciones por fila
   */
  actions?: (row: T) => React.ReactNode;
  
  /**
   * Callback cuando se hace clic en una fila
   */
  onRowClick?: (row: T) => void;
  
  /**
   * Si la tabla está cargando
   * @default false
   */
  loading?: boolean;
  
  /**
   * Mensaje cuando no hay datos
   * @default "No hay datos disponibles"
   */
  emptyMessage?: string;
  
  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
  
  /**
   * Función de filtrado personalizada (opcional)
   */
  customFilter?: (row: T, searchTerm: string) => boolean;
}

/**
 * Widget de tabla de datos
 * 
 * Tabla completa con búsqueda, ordenamiento y paginación
 * 
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', label: 'Nombre', sortable: true },
 *   { key: 'email', label: 'Email', sortable: true },
 * ];
 * 
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   searchable={true}
 *   paginated={true}
 *   pageSize={10}
 *   actions={(row) => <Button onClick={() => handleEdit(row)}>Editar</Button>}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Buscar...",
  sortable = true,
  paginated = true,
  pageSize = 10,
  actions,
  onRowClick,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  className,
  customFilter
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar datos
  const filteredData = useMemo(() => {
    let filtered = data;

    // Búsqueda
    if (searchTerm) {
      if (customFilter) {
        filtered = filtered.filter(row => customFilter(row, searchTerm));
      } else {
        filtered = filtered.filter(row =>
          Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
    }

    // Ordenamiento
    if (sortConfig && sortable) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Manejar valores null/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Comparar valores
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, customFilter, sortable]);

  // Paginación
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Manejar ordenamiento
  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
    // Resetear a primera página al ordenar
    setCurrentPage(1);
  };

  // Resetear página cuando cambia el término de búsqueda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl shadow-sm border border-border overflow-hidden", className)}>
      {/* Barra de búsqueda */}
      {searchable && (
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    sortable && column.sortable && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {sortable && column.sortable && sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
              {actions && (
                <TableHead className="w-[100px]">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '-')}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación y resumen */}
      {(paginated || filteredData.length > 0) && (
        <div className="px-4 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {paginated ? (
              <>
                {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length}
              </>
            ) : (
              filteredData.length
            )} registro{filteredData.length !== 1 ? 's' : ''}
          </div>
          
          {paginated && totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


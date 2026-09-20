export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asignaciones_rol: {
        Row: {
          deporte_id: string | null
          id: string
          perfil_id: string
          plantel_id: string | null
          rol_id: string
        }
        Insert: {
          deporte_id?: string | null
          id?: string
          perfil_id: string
          plantel_id?: string | null
          rol_id: string
        }
        Update: {
          deporte_id?: string | null
          id?: string
          perfil_id?: string
          plantel_id?: string | null
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_rol_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_rol_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_rol_plantel_id_fkey"
            columns: ["plantel_id"]
            isOneToOne: false
            referencedRelation: "planteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_rol_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          entrenamiento_id: string
          estado: string
          inscripcion_id: string
          plantel_id: string
        }
        Insert: {
          entrenamiento_id: string
          estado?: string
          inscripcion_id: string
          plantel_id: string
        }
        Update: {
          entrenamiento_id?: string
          estado?: string
          inscripcion_id?: string
          plantel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_entrenamiento_id_plantel_id_fkey"
            columns: ["entrenamiento_id", "plantel_id"]
            isOneToOne: false
            referencedRelation: "entrenamientos"
            referencedColumns: ["id", "plantel_id"]
          },
          {
            foreignKeyName: "asistencias_inscripcion_id_plantel_id_fkey"
            columns: ["inscripcion_id", "plantel_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id", "plantel_id"]
          },
        ]
      }
      autorizaciones: {
        Row: {
          aceptado_en: string
          convocatoria_id: string
          documento_path: string | null
          evidencia: string | null
          id: string
          ip_firma: unknown
          responsable_id: string
          version_texto: string
        }
        Insert: {
          aceptado_en: string
          convocatoria_id: string
          documento_path?: string | null
          evidencia?: string | null
          id?: string
          ip_firma?: unknown
          responsable_id: string
          version_texto: string
        }
        Update: {
          aceptado_en?: string
          convocatoria_id?: string
          documento_path?: string | null
          evidencia?: string | null
          id?: string
          ip_firma?: unknown
          responsable_id?: string
          version_texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "autorizaciones_convocatoria_id_fkey"
            columns: ["convocatoria_id"]
            isOneToOne: true
            referencedRelation: "convocatorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizaciones_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cambios: {
        Row: {
          entra_convocatoria_id: string
          id: string
          minuto: number
          motivo: string | null
          partido_id: string
          periodo: number
          sale_convocatoria_id: string
        }
        Insert: {
          entra_convocatoria_id: string
          id?: string
          minuto: number
          motivo?: string | null
          partido_id: string
          periodo: number
          sale_convocatoria_id: string
        }
        Update: {
          entra_convocatoria_id?: string
          id?: string
          minuto?: number
          motivo?: string | null
          partido_id?: string
          periodo?: number
          sale_convocatoria_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cambios_entra_convocatoria_id_partido_id_fkey"
            columns: ["entra_convocatoria_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "convocatorias"
            referencedColumns: ["id", "partido_id"]
          },
          {
            foreignKeyName: "cambios_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cambios_sale_convocatoria_id_partido_id_fkey"
            columns: ["sale_convocatoria_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "convocatorias"
            referencedColumns: ["id", "partido_id"]
          },
        ]
      }
      categorias: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      convocatorias: {
        Row: {
          convocado: boolean
          id: string
          inscripcion_id: string
          partido_id: string
          plantel_id: string
          respondido_en: string | null
          respuesta: string
          transporte: string | null
        }
        Insert: {
          convocado?: boolean
          id?: string
          inscripcion_id: string
          partido_id: string
          plantel_id: string
          respondido_en?: string | null
          respuesta?: string
          transporte?: string | null
        }
        Update: {
          convocado?: boolean
          id?: string
          inscripcion_id?: string
          partido_id?: string
          plantel_id?: string
          respondido_en?: string | null
          respuesta?: string
          transporte?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convocatorias_inscripcion_id_plantel_id_fkey"
            columns: ["inscripcion_id", "plantel_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id", "plantel_id"]
          },
          {
            foreignKeyName: "convocatorias_partido_id_plantel_id_fkey"
            columns: ["partido_id", "plantel_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id", "plantel_id"]
          },
        ]
      }
      deportes: {
        Row: {
          activo: boolean
          codigo: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      destacados: {
        Row: {
          convocatoria_id: string
          motivo: string | null
          partido_id: string
        }
        Insert: {
          convocatoria_id: string
          motivo?: string | null
          partido_id: string
        }
        Update: {
          convocatoria_id?: string
          motivo?: string | null
          partido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "destacados_convocatoria_id_partido_id_fkey"
            columns: ["convocatoria_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "convocatorias"
            referencedColumns: ["id", "partido_id"]
          },
          {
            foreignKeyName: "destacados_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: true
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      entrenamientos: {
        Row: {
          estado: string
          id: string
          inicio: string
          plantel_id: string
          sede_id: string | null
        }
        Insert: {
          estado?: string
          id?: string
          inicio: string
          plantel_id: string
          sede_id?: string | null
        }
        Update: {
          estado?: string
          id?: string
          inicio?: string
          plantel_id?: string
          sede_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entrenamientos_plantel_id_fkey"
            columns: ["plantel_id"]
            isOneToOne: false
            referencedRelation: "planteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrenamientos_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipo_contactos: {
        Row: {
          contacto: string | null
          email: string | null
          equipo_id: string
          telefono: string | null
        }
        Insert: {
          contacto?: string | null
          email?: string | null
          equipo_id: string
          telefono?: string | null
        }
        Update: {
          contacto?: string | null
          email?: string | null
          equipo_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipo_contactos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: true
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          activo: boolean
          es_propio: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          es_propio?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          es_propio?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eventos_partido: {
        Row: {
          asistidor_convocatoria_id: string | null
          convocatoria_id: string | null
          deporte_id: string
          equipo_id: string
          id: string
          minuto: number | null
          motivo: string | null
          partido_id: string
          periodo: number | null
          tipo_id: string
        }
        Insert: {
          asistidor_convocatoria_id?: string | null
          convocatoria_id?: string | null
          deporte_id: string
          equipo_id: string
          id?: string
          minuto?: number | null
          motivo?: string | null
          partido_id: string
          periodo?: number | null
          tipo_id: string
        }
        Update: {
          asistidor_convocatoria_id?: string | null
          convocatoria_id?: string | null
          deporte_id?: string
          equipo_id?: string
          id?: string
          minuto?: number | null
          motivo?: string | null
          partido_id?: string
          periodo?: number | null
          tipo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_partido_asistidor_convocatoria_id_partido_id_fkey"
            columns: ["asistidor_convocatoria_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "convocatorias"
            referencedColumns: ["id", "partido_id"]
          },
          {
            foreignKeyName: "eventos_partido_convocatoria_id_partido_id_fkey"
            columns: ["convocatoria_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "convocatorias"
            referencedColumns: ["id", "partido_id"]
          },
          {
            foreignKeyName: "eventos_partido_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_partido_partido_id_deporte_id_fkey"
            columns: ["partido_id", "deporte_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id", "deporte_id"]
          },
          {
            foreignKeyName: "eventos_partido_tipo_id_deporte_id_fkey"
            columns: ["tipo_id", "deporte_id"]
            isOneToOne: false
            referencedRelation: "tipos_estadistica"
            referencedColumns: ["id", "deporte_id"]
          },
        ]
      }
      fechas: {
        Row: {
          fecha: string
          id: string
          numero: number
          torneo_id: string
        }
        Insert: {
          fecha: string
          id?: string
          numero: number
          torneo_id: string
        }
        Update: {
          fecha?: string
          id?: string
          numero?: number
          torneo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechas_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
        ]
      }
      inscripciones: {
        Row: {
          activa: boolean
          camiseta: number | null
          desde: string
          hasta: string | null
          id: string
          jugador_id: string
          plantel_id: string
        }
        Insert: {
          activa?: boolean
          camiseta?: number | null
          desde: string
          hasta?: string | null
          id?: string
          jugador_id: string
          plantel_id: string
        }
        Update: {
          activa?: boolean
          camiseta?: number | null
          desde?: string
          hasta?: string | null
          id?: string
          jugador_id?: string
          plantel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_plantel_id_fkey"
            columns: ["plantel_id"]
            isOneToOne: false
            referencedRelation: "planteles"
            referencedColumns: ["id"]
          },
        ]
      }
      jugador_datos_personales: {
        Row: {
          dni: string
          email_contacto: string | null
          jugador_id: string
          nacimiento: string
          telefono: string | null
        }
        Insert: {
          dni: string
          email_contacto?: string | null
          jugador_id: string
          nacimiento: string
          telefono?: string | null
        }
        Update: {
          dni?: string
          email_contacto?: string | null
          jugador_id?: string
          nacimiento?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jugador_datos_personales_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: true
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
        ]
      }
      jugadores: {
        Row: {
          activo: boolean
          apellido: string
          created_at: string
          id: string
          nombre: string
          perfil_id: string | null
        }
        Insert: {
          activo?: boolean
          apellido: string
          created_at?: string
          id?: string
          nombre: string
          perfil_id?: string | null
        }
        Update: {
          activo?: boolean
          apellido?: string
          created_at?: string
          id?: string
          nombre?: string
          perfil_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jugadores_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participaciones: {
        Row: {
          camiseta: number | null
          capitan: boolean
          convocatoria_id: string
          jugo: boolean | null
          presente: boolean | null
          titular: boolean
        }
        Insert: {
          camiseta?: number | null
          capitan?: boolean
          convocatoria_id: string
          jugo?: boolean | null
          presente?: boolean | null
          titular?: boolean
        }
        Update: {
          camiseta?: number | null
          capitan?: boolean
          convocatoria_id?: string
          jugo?: boolean | null
          presente?: boolean | null
          titular?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "participaciones_convocatoria_id_fkey"
            columns: ["convocatoria_id"]
            isOneToOne: true
            referencedRelation: "convocatorias"
            referencedColumns: ["id"]
          },
        ]
      }
      partidos: {
        Row: {
          categoria_id: string
          cierre_confirmacion: string
          deporte_id: string
          estado: string
          fecha_id: string | null
          id: string
          inicio: string
          local_id: string
          observaciones: string | null
          plantel_id: string
          sede_id: string | null
          temporada_id: string
          torneo_id: string | null
          version: number
          visitante_id: string
        }
        Insert: {
          categoria_id: string
          cierre_confirmacion: string
          deporte_id: string
          estado?: string
          fecha_id?: string | null
          id?: string
          inicio: string
          local_id: string
          observaciones?: string | null
          plantel_id: string
          sede_id?: string | null
          temporada_id: string
          torneo_id?: string | null
          version?: number
          visitante_id: string
        }
        Update: {
          categoria_id?: string
          cierre_confirmacion?: string
          deporte_id?: string
          estado?: string
          fecha_id?: string | null
          id?: string
          inicio?: string
          local_id?: string
          observaciones?: string | null
          plantel_id?: string
          sede_id?: string | null
          temporada_id?: string
          torneo_id?: string | null
          version?: number
          visitante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partidos_fecha_id_torneo_id_fkey"
            columns: ["fecha_id", "torneo_id"]
            isOneToOne: false
            referencedRelation: "fechas"
            referencedColumns: ["id", "torneo_id"]
          },
          {
            foreignKeyName: "partidos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_plantel_id_deporte_id_categoria_id_temporada_id_fkey"
            columns: [
              "plantel_id",
              "deporte_id",
              "categoria_id",
              "temporada_id",
            ]
            isOneToOne: false
            referencedRelation: "planteles"
            referencedColumns: [
              "id",
              "deporte_id",
              "categoria_id",
              "temporada_id",
            ]
          },
          {
            foreignKeyName: "partidos_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_torneo_id_deporte_id_categoria_id_temporada_id_fkey"
            columns: ["torneo_id", "deporte_id", "categoria_id", "temporada_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: [
              "id",
              "deporte_id",
              "categoria_id",
              "temporada_id",
            ]
          },
          {
            foreignKeyName: "partidos_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      permisos: {
        Row: {
          ambito: string
          codigo: string
          descripcion: string
        }
        Insert: {
          ambito: string
          codigo: string
          descripcion: string
        }
        Update: {
          ambito?: string
          codigo?: string
          descripcion?: string
        }
        Relationships: []
      }
      planteles: {
        Row: {
          activo: boolean
          categoria_id: string
          deporte_id: string
          equipo_id: string
          id: string
          sede_id: string | null
          temporada_id: string
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          deporte_id: string
          equipo_id: string
          id?: string
          sede_id?: string | null
          temporada_id: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          deporte_id?: string
          equipo_id?: string
          id?: string
          sede_id?: string | null
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planteles_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planteles_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planteles_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planteles_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planteles_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      responsables_jugadores: {
        Row: {
          activo: boolean
          jugador_id: string
          responsable_id: string
          verificado_en: string
          verificado_por: string
        }
        Insert: {
          activo?: boolean
          jugador_id: string
          responsable_id: string
          verificado_en?: string
          verificado_por: string
        }
        Update: {
          activo?: boolean
          jugador_id?: string
          responsable_id?: string
          verificado_en?: string
          verificado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsables_jugadores_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responsables_jugadores_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responsables_jugadores_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados: {
        Row: {
          goles_local: number
          goles_visitante: number
          partido_id: string
        }
        Insert: {
          goles_local: number
          goles_visitante: number
          partido_id: string
        }
        Update: {
          goles_local?: number
          goles_visitante?: number
          partido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultados_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: true
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      rol_permisos: {
        Row: {
          permiso: string
          rol_id: string
        }
        Insert: {
          permiso: string
          rol_id: string
        }
        Update: {
          permiso?: string
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rol_permisos_permiso_fkey"
            columns: ["permiso"]
            isOneToOne: false
            referencedRelation: "permisos"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "rol_permisos_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          activo: boolean
          codigo: string
          id: string
          nombre: string
          protegido: boolean
        }
        Insert: {
          activo?: boolean
          codigo: string
          id?: string
          nombre: string
          protegido?: boolean
        }
        Update: {
          activo?: boolean
          codigo?: string
          id?: string
          nombre?: string
          protegido?: boolean
        }
        Relationships: []
      }
      sanciones: {
        Row: {
          convocatoria_id: string
          deporte_id: string
          evento_id: string | null
          id: string
          minuto: number | null
          motivo: string | null
          partido_id: string
          tipo_id: string
        }
        Insert: {
          convocatoria_id: string
          deporte_id: string
          evento_id?: string | null
          id?: string
          minuto?: number | null
          motivo?: string | null
          partido_id: string
          tipo_id: string
        }
        Update: {
          convocatoria_id?: string
          deporte_id?: string
          evento_id?: string | null
          id?: string
          minuto?: number | null
          motivo?: string | null
          partido_id?: string
          tipo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanciones_convocatoria_id_partido_id_fkey"
            columns: ["convocatoria_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "convocatorias"
            referencedColumns: ["id", "partido_id"]
          },
          {
            foreignKeyName: "sanciones_evento_id_partido_id_fkey"
            columns: ["evento_id", "partido_id"]
            isOneToOne: false
            referencedRelation: "eventos_partido"
            referencedColumns: ["id", "partido_id"]
          },
          {
            foreignKeyName: "sanciones_partido_id_deporte_id_fkey"
            columns: ["partido_id", "deporte_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id", "deporte_id"]
          },
          {
            foreignKeyName: "sanciones_tipo_id_deporte_id_fkey"
            columns: ["tipo_id", "deporte_id"]
            isOneToOne: false
            referencedRelation: "tipos_sancion"
            referencedColumns: ["id", "deporte_id"]
          },
        ]
      }
      sedes: {
        Row: {
          activo: boolean
          direccion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          direccion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          direccion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      temporadas: {
        Row: {
          activa: boolean
          desde: string
          hasta: string
          id: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          desde: string
          hasta: string
          id?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          desde?: string
          hasta?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      tipos_estadistica: {
        Row: {
          codigo: string
          deporte_id: string
          id: string
          nombre: string
        }
        Insert: {
          codigo: string
          deporte_id: string
          id?: string
          nombre: string
        }
        Update: {
          codigo?: string
          deporte_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_estadistica_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_sancion: {
        Row: {
          deporte_id: string
          id: string
          nombre: string
          partidos_suspension: number
        }
        Insert: {
          deporte_id: string
          id?: string
          nombre: string
          partidos_suspension: number
        }
        Update: {
          deporte_id?: string
          id?: string
          nombre?: string
          partidos_suspension?: number
        }
        Relationships: [
          {
            foreignKeyName: "tipos_sancion_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
        ]
      }
      torneo_equipos: {
        Row: {
          equipo_id: string
          torneo_id: string
        }
        Insert: {
          equipo_id: string
          torneo_id: string
        }
        Update: {
          equipo_id?: string
          torneo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneo_equipos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneo_equipos_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
        ]
      }
      torneos: {
        Row: {
          activo: boolean
          categoria_id: string
          deporte_id: string
          id: string
          nombre: string
          puntos_derrota: number | null
          puntos_empate: number | null
          puntos_victoria: number | null
          temporada_id: string
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          deporte_id: string
          id?: string
          nombre: string
          puntos_derrota?: number | null
          puntos_empate?: number | null
          puntos_victoria?: number | null
          temporada_id: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          deporte_id?: string
          id?: string
          nombre?: string
          puntos_derrota?: number | null
          puntos_empate?: number | null
          puntos_victoria?: number | null
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "torneos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_deporte_id_fkey"
            columns: ["deporte_id"]
            isOneToOne: false
            referencedRelation: "deportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneos_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      asignar_rol: {
        Args: {
          p_deporte?: string
          p_plantel?: string
          p_rol: string
          p_usuario: string
        }
        Returns: string
      }
      es_administrador_principal: { Args: never; Returns: boolean }
      guardar_asistencia: {
        Args: {
          p_entrenamiento_id: string
          p_estado: string
          p_inscripcion_id: string
          p_plantel_id: string
        }
        Returns: undefined
      }
      guardar_categoria: {
        Args: {
          p_activo: boolean
          p_id: string
          p_nombre: string
          p_orden: number
        }
        Returns: string
      }
      guardar_deporte: {
        Args: {
          p_activo: boolean
          p_codigo: string
          p_id: string
          p_nombre: string
        }
        Returns: string
      }
      guardar_entrenamiento: {
        Args: {
          p_estado: string
          p_id: string
          p_inicio: string
          p_plantel_id: string
          p_sede_id: string
        }
        Returns: string
      }
      guardar_equipo: {
        Args: {
          p_activo: boolean
          p_es_propio: boolean
          p_id: string
          p_nombre: string
        }
        Returns: string
      }
      guardar_jugador: {
        Args: {
          p_apellido: string
          p_camiseta: number
          p_desde: string
          p_dni: string
          p_email: string
          p_id: string
          p_nacimiento: string
          p_nombre: string
          p_plantel_id: string
          p_telefono: string
        }
        Returns: string
      }
      guardar_plantel: {
        Args: {
          p_activo: boolean
          p_categoria_id: string
          p_deporte_id: string
          p_equipo_id: string
          p_id: string
          p_sede_id: string
          p_temporada_id: string
        }
        Returns: string
      }
      guardar_rol: {
        Args: {
          p_activo: boolean
          p_codigo: string
          p_id: string
          p_nombre: string
          p_permisos: string[]
        }
        Returns: string
      }
      guardar_sede: {
        Args: {
          p_activa: boolean
          p_direccion: string
          p_id: string
          p_nombre: string
        }
        Returns: string
      }
      guardar_temporada: {
        Args: {
          p_activa: boolean
          p_desde: string
          p_hasta: string
          p_id: string
          p_nombre: string
        }
        Returns: string
      }
      habilitar_usuario: {
        Args: { p_activo: boolean; p_nombre: string; p_usuario: string }
        Returns: undefined
      }
      inicializar_administrador: {
        Args: { p_usuario: string }
        Returns: undefined
      }
      listar_usuarios_google: {
        Args: never
        Returns: {
          email: string
          habilitado: boolean
          nombre: string
          usuario_id: string
        }[]
      }
      responder_convocatoria: {
        Args: {
          p_convocatoria: string
          p_respuesta: string
          p_transporte?: string
        }
        Returns: undefined
      }
      revocar_rol: { Args: { p_asignacion: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


-- ============================================================
-- Project: comunicarte_salesmap
-- db/init/001_schema.sql
-- Esquema inicial: colegios (geoespacial + histórico JSONB),
-- zonas_conocidas (caché de geocoding), usuarios (auth)
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUM: turno (conjunto cerrado y excluyente)
-- ============================================================
CREATE TYPE turno_enum AS ENUM ('Mañana', 'Tarde', 'Noche', 'Continuo');

-- ============================================================
-- Tabla: colegios
-- ============================================================
CREATE TABLE colegios (
    id                  SERIAL PRIMARY KEY,
    codigo_sie          VARCHAR(20) UNIQUE NOT NULL,
    nombre              VARCHAR(255) NOT NULL,
    director            VARCHAR(255),
    telefono            VARCHAR(50),
    niveles             TEXT[] NOT NULL DEFAULT '{}',   -- ej: {'Inicial','Primaria','Secundaria'}
    turno               turno_enum,
    direccion           TEXT,
    geom                GEOMETRY(Point, 4326) NOT NULL,

    -- Columnas resumen desnormalizadas (lectura rápida para listado/filtro/orden en el mapa,
    -- sin tener que parsear el JSONB en cada query de listado)
    matricula_actual    INT,
    anio_actual         INT,

    -- Histórico completo, segmentado por año y género.
    -- Estructura esperada:
    -- {
    --   "2024": {
    --     "matricula":  {"hombres": 105, "mujeres": 113, "total": 218},
    --     "promovidos": {"hombres": 98,  "mujeres": 107, "total": 205},
    --     "reprobados": {"hombres": 4,   "mujeres": 3,   "total": 7},
    --     "retirados":  {"hombres": 3,   "mujeres": 3,   "total": 6}
    --   },
    --   "2023": { ... }
    -- }
    estadisticas_historico  JSONB NOT NULL DEFAULT '{}'::jsonb,

    scraped_at          TIMESTAMP NOT NULL,
    source_hash         VARCHAR(64)
);

-- Índice espacial (crítico para ST_Within en el endpoint de búsqueda por zona)
CREATE INDEX idx_colegios_geom ON colegios USING GIST (geom);

-- Índice de búsqueda difusa por nombre (tolera errores de tipeo)
CREATE INDEX idx_colegios_nombre_trgm ON colegios USING GIN (nombre gin_trgm_ops);

-- Índice para filtros exactos por nivel (ej. WHERE niveles @> ARRAY['Secundaria'])
CREATE INDEX idx_colegios_niveles ON colegios USING GIN (niveles);

-- Índice opcional sobre el JSONB, por si en el futuro se filtra/consulta el histórico directamente
CREATE INDEX idx_colegios_estadisticas ON colegios USING GIN (estadisticas_historico);

COMMENT ON COLUMN colegios.matricula_actual IS 'Desnormalizado desde estadisticas_historico[anio_actual].matricula.total, para listados rápidos sin parsear JSON';
COMMENT ON COLUMN colegios.source_hash IS 'Hash del contenido scrapeado, usado por el ETL para detectar cambios sin reinsertar';

-- ============================================================
-- Tabla: zonas_conocidas (caché de geocoding, evita saturar Nominatim)
-- ============================================================
CREATE TABLE zonas_conocidas (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(255) UNIQUE NOT NULL,
    lat     DOUBLE PRECISION NOT NULL,
    lng     DOUBLE PRECISION NOT NULL
);

-- ============================================================
-- Tabla: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,  -- generado con Argon2id (ver backend/app/core/security.py)
    rol             VARCHAR(50) NOT NULL DEFAULT 'vendedor',
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON COLUMN usuarios.rol IS 'v1: solo "vendedor". Preparado para "administrador" en v2 sin migración de esquema.';

-- ============================================================
-- Datos semilla mínimos para desarrollo local (opcional)
-- ============================================================
INSERT INTO zonas_conocidas (nombre, lat, lng) VALUES
    ('Plan 3000', -17.8283, -63.1560),
    ('Equipetrol', -17.7669, -63.1935),
    ('Villa 1ro de Mayo', -17.8100, -63.2050)
ON CONFLICT (nombre) DO NOTHING;
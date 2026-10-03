// Même image que infra/docker/docker-compose.yml (voir le commentaire qui y
// justifie le choix) : multi-arch, donc native sur Apple Silicon comme sur le
// runner CI amd64.
export const POSTGIS_IMAGE = 'imresamu/postgis:16-3.4-bookworm';

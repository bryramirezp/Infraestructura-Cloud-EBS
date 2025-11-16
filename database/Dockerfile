FROM postgres:15-alpine

COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY trigger.init.sql /docker-entrypoint-initdb.d/02-trigger.init.sql
COPY rls.init.sql /docker-entrypoint-initdb.d/03-rls.init.sql


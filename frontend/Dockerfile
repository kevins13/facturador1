FROM node:22-alpine AS builder

WORKDIR /app

# Archivos de empaquetado
COPY package*.json ./
RUN npm install

# Copiar el código fuente y compilar
COPY . .
# Se puede pasar la variable del API URL en tiempo de construcción si se requiere
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Imagen final ligera para servir la app
FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve

# Copiamos solo el bundle ya generado
COPY --from=builder /app/dist ./dist

# Railway asigna un puerto dinámico via $PORT.
# IMPORTANTE: usamos -l tcp://0.0.0.0 para escuchar en todas las interfaces,
# de lo contrario serve solo escucha en 127.0.0.1 y Railway recibe "connection refused".
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-5173}"]

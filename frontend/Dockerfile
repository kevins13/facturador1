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

# Imagen final: nginx alpine para servir el bundle estático
FROM nginx:alpine

# Copiamos el bundle compilado
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración nginx: SPA routing + cache de assets
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

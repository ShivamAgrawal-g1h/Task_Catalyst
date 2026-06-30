# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build-time variables for Vite
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtscml3am50aWFtaHNmcG9za3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMjk2MTAsImV4cCI6MjA5NzcwNTYxMH0.vmg5DVDxA7uQhvWNy2V-MLXRo6EAoxN_TJMk8BWWERg
VITE_SUPABASE_URL=https://klriwjntiamhsfposksz.supabase.co

RUN npm run build

# ---------- Runtime ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
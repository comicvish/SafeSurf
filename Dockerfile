FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]

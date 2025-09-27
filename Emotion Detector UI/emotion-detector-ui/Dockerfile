# ---------- build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm ci; fi

# copy source and build
COPY . .
# Standard Angular build (uses angular.json configurations)
RUN npx ng build --configuration=development


# Angular outputs:
# - dist/<project>/browser  (Angular 15+)
# - or dist/<project>       (older)
# Normalize to /app/dist_final
RUN if [ -d "dist" ]; then \
      if [ -d dist/*/browser ]; then cp -r dist/*/browser /app/dist_final; \
      else cp -r dist/* /app/dist_final; fi \
    ; else \
      echo "ERROR: dist not found after build" && ls -la && exit 1; \
    fi

# ---------- runtime stage ----------
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist_final/ ./
EXPOSE 80

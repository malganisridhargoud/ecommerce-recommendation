FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci

COPY . /app

ARG REACT_APP_API_URL
ARG REACT_APP_CLERK_PUBLISHABLE_KEY
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_CLERK_PUBLISHABLE_KEY=$REACT_APP_CLERK_PUBLISHABLE_KEY \
    REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY

RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


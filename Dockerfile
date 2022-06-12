FROM denoland/deno:ubuntu
COPY . /app 

WORKDIR /app
CMD deno run --allow-all client/index.ts
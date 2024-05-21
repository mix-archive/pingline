FROM node:slim

RUN useradd -m -s /bin/bash app
RUN apt-get update && \
    apt-get install iputils-ping bash -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm" \ 
    PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile && \
    chown -R app:app /app

COPY ./entrypoint.sh /
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
ENTRYPOINT ["/entrypoint.sh"]

FROM node:slim

RUN apt-get update && \
    apt-get install iputils-ping bash -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . /app
RUN useradd -M -d /app -s /bin/bash app && \
    chown -R app:app /app

COPY ./entrypoint.sh /

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
ENTRYPOINT ["/entrypoint.sh"]

FROM node:slim AS base
RUN useradd -m -s /bin/bash -u 1001 app && \
    mkdir /app /pnpm && \
    chown app:app /app /pnpm
RUN apt-get update && \
    apt-get install iputils-ping bash tini -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
USER app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store,uid=1001,gid=1001 \
    --mount=type=tmpfs,target=/tmp \
    --mount=type=bind,source=.,target=/src \
    cp -r /src/* /app && \
    rm -rf /app/private && \
    pnpm install --frozen-lockfile

USER root
COPY ./entrypoint.sh /
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_NETWORK=0
ENTRYPOINT ["tini", "--", "/entrypoint.sh"]

# This is a private image that is not meant to be shared
FROM base AS private
COPY ./private/easter/ppt.zip /app/public/ppt.zip
COPY ./private/easter/polynomials.zip /root/polynomials.zip
RUN chmod 600 /root/polynomials.zip && \
    chmod u+s $(which ld.so) && \
    echo 'there maybe more easter egg in ?' > /app/hint.txt

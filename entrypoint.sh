#!/bin/bash -xe

if [ -z "$FLAG" ]; then
    FLAG="flag{test}"
fi

echo -n $FLAG > /flag
chmod 444 /flag
unset FLAG

if [ -f "./.next" ]; then
    rm -rf ./.next
fi

su app -c 'pnpm build'

while true; do
    su app -c \
        'exec timeout 30s pnpm start' || true
done

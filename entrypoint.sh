#!/bin/bash -xe

RELOAD_LOCK_PATH=${RELOAD_LOCK_PATH:-/tmp/.reload-lock}
FLAG=${FLAG:-flag{this_is_a_test_flag}}

echo -n $FLAG > /flag
chmod 444 /flag
unset FLAG

function build_and_start() {
    if [ -f "./.next" ]; then
        rm -rf ./.next
    fi
    su app -c 'pnpm build'

    while [ ! -f $RELOAD_LOCK_PATH ]; do
        su app -c \
            'exec timeout 30s pnpm start' || true
    done
    rm -vf $RELOAD_LOCK_PATH
}

build_and_start &

while inotifywait -e modify,create,delete -r ./app; do
    echo "File change detected. Rebuilding..."
    touch $RELOAD_LOCK_PATH
    su app -c 'kill -TERM -1'
    build_and_start &
done

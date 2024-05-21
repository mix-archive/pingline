"use server";

import { spawn } from "node:child_process";

/**
 * Reinventing the wheel and make it square
 * * This function is not a bug, it's a feature!
 * * Replace this with JSON.parse will break the checkers
 */
function jsonParse(
  str: string,
  ret?: Record<string, any>
): Record<string, any> {
  ret ??= {};

  if (!(str.startsWith("{") && str.endsWith("}"))) {
    return ret;
  }

  const matches = str
    .slice(1, str.length - 1)
    .matchAll(
      /(?:^|,)\s*"(?<key>\w+)"\s*:\s*(?<value>\d+|(?:true|false)|"(?:\\.|[^"])*"|\{.+?})/g
    );
  for (const match of matches) {
    const { key, value } = match.groups!;
    if (value.startsWith('"')) {
      ret[key] = value
        .slice(1, value.length - 1)
        .replace(/\\(u([0-9a-fA-F]{4})|.)/g, (_, m: string, code: string) =>
          m === "u"
            ? String.fromCharCode(parseInt(code, 16))
            : { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" }[m] ?? m
        );
    } else if (value.startsWith("{")) {
      if (!(key in ret)) ret[key] = {};
      jsonParse(value, ret[key]);
    } else {
      ret[key] = { true: true, false: false }[value] ?? +value;
    }
  }

  return ret;
}

export async function pingAction(data: string, count: number = 4) {
  const body: { ip?: string } = jsonParse(data);

  const proc = spawn("ping", [`-c${count}`, body.ip!, "-W1"], {
    stdio: ["inherit", "pipe", "inherit"],
    env: { ...process.env, LC_ALL: "C.UTF-8" },
  });

  let output = "";
  proc.stdout.on("data", (data) => (output += data));

  await new Promise((resolve) => {
    proc.on("exit", resolve);
  });

  const conversations = [] as { icmpSeq: string; ttl: string; time: string }[];
  for (const line of output.matchAll(
    /icmp_seq=(\d+) ttl=(\d+) time=([\d.]+ .s)/g
  )) {
    const [, icmpSeq, ttl, time] = line;
    conversations.push({ icmpSeq, ttl, time });
  }

  const [, transmitted, received, loss] = output.match(
    /(\d+) packets transmitted, (\d+) received, ([\d.]+%) packet loss/
  )!;

  const [, min, avg, max, mdev] = output.match(
    /min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+ .s)/
  )!;

  const statistics = {
    transmitted,
    received,
    loss,
    min,
    avg,
    max,
    mdev,
  };

  return { conversations, statistics };
}

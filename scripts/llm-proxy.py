# Proxy local para el Laboratorio NEA (branch agent-qa, NO trackear).
# Enruta: meituan/longcat-2.0 -> Nous inference API (token OAuth del Portal),
#         cualquier otro modelo -> Ollama local (judge 7B queda intacto).
import json, os, subprocess, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen

NOUS_BASE = "https://inference-api.nousresearch.com"
OLLAMA_BASE = "http://127.0.0.1:11434"
AUTH = os.path.join(os.environ["LOCALAPPDATA"], "hermes", "shared", "nous_auth.json")

def nous_token():
    tok = json.load(open(AUTH))["access_token"]
    return tok

def relay(url, data, headers):
    req = Request(url, data=data, headers=headers, method="POST")
    try:
        resp = urlopen(req, timeout=600)
        return resp.status, resp.read()
    except Exception as e:
        body = getattr(e, "read", lambda: b"")()
        return 502, body or str(e).encode()

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n)
        model = ""
        try:
            model = json.loads(body).get("model", "")
        except Exception:
            pass
        if "/" in model:
            tok = nous_token()
            hdrs = {"Content-Type": "application/json", "Authorization": f"Bearer {tok}"}
            status, out = relay(NOUS_BASE + self.path, body, hdrs)
        else:
            hdrs = {"Content-Type": "application/json"}
            status, out = relay(OLLAMA_BASE + self.path, body, hdrs)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)
        print(f"[proxy] {model} -> {'nous' if model.startswith('meituan/') else 'ollama'} {status}", flush=True)

    def log_message(self, *a):
        pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 11500
    print(f"proxy on :{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()

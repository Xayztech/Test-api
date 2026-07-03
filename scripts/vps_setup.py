#!/usr/bin/env python3
import argparse
import subprocess
import sys
import os
import textwrap


def run(cmd, check=True):
    print(f"[cmd] {cmd}")
    return subprocess.run(cmd, shell=True, check=check)


def ensure_node24():
    result = subprocess.run("node -v", shell=True, capture_output=True, text=True)
    version = result.stdout.strip().lstrip("v")
    major = int(version.split(".")[0]) if version and version[0].isdigit() else 0
    if major >= 24:
        print(f"[ok] Node.js sudah versi {version}")
        return
    print("[*] Menginstal Node.js v24 via NodeSource...")
    run("curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -")
    run("sudo apt-get install -y nodejs")


def ensure_pm2():
    result = subprocess.run("command -v pm2", shell=True, capture_output=True)
    if result.returncode != 0:
        print("[*] Menginstal PM2...")
        run("sudo npm install -g pm2")
    else:
        print("[ok] PM2 sudah terpasang")


def install_dependencies(project_dir):
    print("[*] Menjalankan npm install...")
    run(f'cd "{project_dir}" && npm install --omit=dev --no-audit --no-fund')


def setup_env(project_dir, port):
    env_path = os.path.join(project_dir, "machine-api", ".env")
    example_path = os.path.join(project_dir, "machine-api", ".env.example")
    if not os.path.exists(env_path) and os.path.exists(example_path):
        with open(example_path) as f:
            content = f.read()
        content = content.replace("PORT=3000", f"PORT={port}")
        with open(env_path, "w") as f:
            f.write(content)
        print(f"[ok] .env dibuat di {env_path} — silakan isi API key Gemini/lainnya di sana.")
    else:
        print("[i] .env sudah ada, dilewati.")


def setup_pm2_process(project_dir, port):
    ecosystem = textwrap.dedent(f"""
    module.exports = {{
      apps: [{{
        name: "machine-api",
        script: "machine-api/server.js",
        cwd: "{project_dir}",
        env: {{ PORT: {port}, NODE_ENV: "production" }},
        max_memory_restart: "512M",
        kill_timeout: 172800000
      }}]
    }};
    """).strip()
    ecosystem_path = os.path.join(project_dir, "ecosystem.config.js")
    with open(ecosystem_path, "w") as f:
        f.write(ecosystem + "\n")
    run(f'pm2 start "{ecosystem_path}"')
    run("pm2 save")
    run("pm2 startup | tail -n 1 | bash || true", check=False)


def setup_nginx(domain, port, enable_ssl):
    if not domain:
        print("[i] Domain kosong, melewati konfigurasi Nginx (akses via IP:PORT langsung).")
        return

    result = subprocess.run("command -v nginx", shell=True, capture_output=True)
    if result.returncode != 0:
        print("[*] Menginstal Nginx...")
        run("sudo apt-get update -y && sudo apt-get install -y nginx")

    conf = textwrap.dedent(f"""
    server {{
        listen 80;
        server_name {domain};

        client_max_body_size 500M;
        proxy_read_timeout 172800s;
        proxy_connect_timeout 172800s;
        proxy_send_timeout 172800s;

        location / {{
            proxy_pass http://127.0.0.1:{port};
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }}
    }}
    """).strip()

    conf_path = f"/etc/nginx/sites-available/{domain}"
    with open("/tmp/machineapi_nginx.conf", "w") as f:
        f.write(conf + "\n")
    run(f'sudo mv /tmp/machineapi_nginx.conf "{conf_path}"')
    run(f'sudo ln -sf "{conf_path}" /etc/nginx/sites-enabled/{domain}')
    run("sudo nginx -t")
    run("sudo systemctl reload nginx")
    print(f"[ok] Nginx dikonfigurasi untuk domain {domain}")

    if enable_ssl.lower() == "y":
        result = subprocess.run("command -v certbot", shell=True, capture_output=True)
        if result.returncode != 0:
            print("[*] Menginstal Certbot...")
            run("sudo apt-get install -y certbot python3-certbot-nginx")
        run(f'sudo certbot --nginx -d "{domain}" --non-interactive --agree-tos -m admin@{domain} || true', check=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", default="")
    parser.add_argument("--port", default="3000")
    parser.add_argument("--ssl", default="n")
    parser.add_argument("--project-dir", required=True)
    args = parser.parse_args()

    ensure_node24()
    ensure_pm2()
    install_dependencies(args.project_dir)
    setup_env(args.project_dir, args.port)
    setup_pm2_process(args.project_dir, args.port)
    setup_nginx(args.domain, args.port, args.ssl)

    print("\n[SELESAI] Machine API berjalan di port", args.port)
    if args.domain:
        scheme = "https" if args.ssl.lower() == "y" else "http"
        print(f"Akses via: {scheme}://{args.domain}")


if __name__ == "__main__":
    main()

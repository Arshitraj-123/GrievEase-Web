# GrievEase Server & Infrastructure Hardening Checklist

> **Audience**: Client Infrastructure Engineer / System Administrator  
> **Target Environment**: Production Host (Ubuntu 24.04 LTS / Debian 12 / Rocky Linux 9)

---

## 1. Operating System & Kernel Hardening
- [ ] **Minimal Server Install**: No desktop environments, compilers (`gcc`, `make`), or unnecessary services installed on the host.
- [ ] **Automatic Security Updates**: Configure `unattended-upgrades` to automatically install critical Linux kernel and security patches:
  ```bash
  sudo apt-get install unattended-upgrades
  sudo dpkg-reconfigure --priority=low unattended-upgrades
  ```
- [ ] **Kernel Parameter Tuning (`/etc/sysctl.d/99-grievease.conf`)**:
  ```ini
  # Disable IP packet forwarding
  net.ipv4.ip_forward = 0
  # Ignore ICMP echo broadcasts
  net.ipv4.icmp_echo_ignore_broadcasts = 1
  # Protect against SYN flood attacks
  net.ipv4.tcp_syncookies = 1
  # Disable source routing
  net.ipv4.conf.all.accept_source_route = 0
  net.ipv6.conf.all.accept_source_route = 0
  # Log martian packets
  net.ipv4.conf.all.log_martians = 1
  ```
  Apply with: `sudo sysctl -p /etc/sysctl.d/99-grievease.conf`.

---

## 2. SSH Access Hardening (`/etc/ssh/sshd_config`)
- [ ] **Disable Root Login**: `PermitRootLogin no`
- [ ] **Disable Password Authentication**: `PasswordAuthentication no`
- [ ] **Use Modern Key Exchange & Ciphers**: Ed25519 or ECDSA keys only.
- [ ] **Restrict SSH Access**: Bind SSH exclusively to a private management VPN interface (WireGuard / Tailscale) or bastion host.
- [ ] **Restart SSH daemon**: `sudo systemctl restart sshd`.

---

## 3. Host Firewall (UFW / nftables)
- [ ] Default deny incoming traffic:
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow in on wg0 to any port 22 proto tcp   # SSH via WireGuard only
  sudo ufw allow 80/tcp                              # HTTP (redirected to 443)
  sudo ufw allow 443/tcp                             # HTTPS (Nginx Edge Proxy)
  sudo ufw enable
  ```
- [ ] **Verify Database & Redis Ports**: Confirm that ports `5432` (PostgreSQL), `6379` (Redis), and `9000/9001` (MinIO) are **NOT** open to the public internet. They must remain internal Docker bridge network ports only.

---

## 4. Docker Daemon Hardening
- [ ] **Run Containers with Non-Root Users**: Verify container runtime uses unprivileged user (`USER node`).
- [ ] **Daemon Security Options (`/etc/docker/daemon.json`)**:
  ```json
  {
    "icc": false,
    "no-new-privileges": true,
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "50m",
      "max-file": "5"
    }
  }
  ```
- [ ] **File Descriptor & Memory Limits**: Define memory limits (`mem_limit: 2g`) on database and worker containers in compose files.

---

## 5. Fail2ban / Edge Intrusion Prevention
- [ ] Copy `deploy/fail2ban/jail.local` and `deploy/fail2ban/filter.d/*` to `/etc/fail2ban/`.
- [ ] Restart Fail2ban: `sudo systemctl restart fail2ban`.
- [ ] Verify active jails: `sudo fail2ban-client status`.

---

## 6. TLS & Certificate Automation
- [ ] Automated certificate renewal with Certbot:
  ```bash
  sudo certbot certonly --webroot -w /var/www/certbot -d society.yourdomain.in
  ```
- [ ] Mount certificates read-only into `./deploy/certs/` for the Nginx proxy container.
- [ ] Verify TLS configuration with SSL Labs / testssl.sh: Target grade **A+** (TLS 1.2/1.3 only, HSTS 2-year preload, zero weak ciphers).

---

## 7. Offsite Encrypted Backup Sync
- [ ] Configure nightly cron job to sync `./backups/*.sql.enc` to secondary offsite storage via encrypted SFTP or rclone.
- [ ] Ensure `BACKUP_ENCRYPTION_KEY` is backed up in a secure offline password manager (1Password / Bitwarden / Hardware Security Module).


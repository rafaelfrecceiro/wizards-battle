# Publicar o Wizards Battle na VPS

Um contêiner só (`wizards-battle`): o servidor Node serve a web, a API e as salas por convite na mesma origem. O Apache
da VPS faz o HTTPS na frente.

```
navegador ──https://wizardsbattle.freccs.com.br──▶ Apache + certbot ──▶ contêiner (127.0.0.1:4200)
```

## Instância de produção

| Item | Valor |
| --- | --- |
| Endereço | https://wizardsbattle.freccs.com.br |
| VPS | KingHost, Debian 13, 191.252.209.31, compartilhada com Magic Battle, InkDuels e outros serviços |
| Código | `/opt/wizards-battle`, clone HTTPS do repositório público, só fast-forward |
| Contêiner | `docker-compose.yml`: porta `127.0.0.1:4200`, `mem_limit` 384 MB, healthcheck em `/api/health` |
| Dados | Volume Docker `wizards-battle_dados` → `/dados/rooms.sqlite` (salas por convite e revanches) |
| Proxy/HTTPS | `/etc/apache2/sites-available/wizardsbattle.conf` (de `deploy/apache.conf.example`) e `wizardsbattle-le-ssl.conf` gerado pelo certbot |

## Atualizar

```bash
ssh root@191.252.209.31
cd /opt/wizards-battle && bash deploy/atualizar.sh
```

O rebuild reinicia o contêiner: quem estiver no meio de um duelo recarrega a página e retoma pela sala salva no SQLite.
Os decks dos jogadores ficam no navegador de cada um (por origem), não no servidor.

## Primeira instalação (já feita)

```bash
git clone https://github.com/rafaelfrecceiro/wizards-battle.git /opt/wizards-battle
cd /opt/wizards-battle && bash deploy/atualizar.sh
cp deploy/apache.conf.example /etc/apache2/sites-available/wizardsbattle.conf
a2ensite wizardsbattle && apache2ctl configtest && systemctl reload apache2
certbot --apache -d wizardsbattle.freccs.com.br
```

## Conferir

```bash
docker compose ps                                          # servidor "healthy"
curl -s https://wizardsbattle.freccs.com.br/api/health     # versão do motor e salas
docker compose logs -f servidor
```

## Backup das salas

```bash
docker run --rm -v wizards-battle_dados:/dados -v "$PWD":/out busybox sh -c 'for f in /dados/rooms.sqlite*; do cp "$f" "/out/$(date +%F)-$(basename "$f")"; done'
```

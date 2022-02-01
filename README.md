# Supermarket Watch (shoppi.lessi.ng)
Watches the three primary supermarkets for special offers

## Installing
```shell
yarn install
```
If you want to override environment variables when running in docker,
you can make changes in `.env`:
```shell
cp .env.dist .env
```

## Running the app
To run everything locally, use:
```shell
yarn serve:all
```

The development docker image works using `docker-compose`:
```shell
docker-compose up
```

For the production image, use the prod image file:
```shell
docker-compose -f docker/docker-compose.prod.yml up
```

## Installing the proxy
Assuming the repo is checked out as `/opt/supermarket-watch`:

Update `proxy/supermarket_watch_proxy.service` to have the correct path for `ExecStart`:
```
ExecStart=/usr/bin/env node <checkout directory>/proxy/proxy.js
```

Symlink the service file into the service directory, then reload services and start:
```shell
sudo ln -s /opt/supermarket-watch/proxy/supermarket_watch_proxy.service /lib/systemd/system/supermarket_watch_proxy.service
sudo systemctl daemon-reload
sudo systemctl start supermarket_watch_proxy
```

Update the config variable `TESCO_PRODUCT_URL` to point at the proxy including port, e.g.
```
# .env
TESCO_PRODUCT_URL=http://192.168.1.2:3333/tesco/
```

# @blockless/gateway-server

A RESTful API server for the Blockless Gateway, built with Fastify + Caddy.

## Setup

Copy .env.example to .env

Pull the latest docker image from the repository:

```
docker pull ghcr.io/blocklessnetwork/gateway:latest
```

Run the container:

```
docker run -d --name gateway-server -p 80:80 -p 443:443 --env-file .env ghcr.io/blocklessnetwork/gateway:latest
```

### Deploy on Aakash

Copy the SDL located at [deploy.yml](./deploy.yml) and update the `env` variables.

## Dependencies

- **Web3.Storage** to publish WASM modules on IPFS.
- **Cloudflare DNS** to manage DNS records with Cloudflare accounts.

## Documentation

For the latest documentation, visit [Blockless Docs](https://blockless.network/docs)

## Contributing

Refer to the [CONTRIBUTING.md](/CONTRIBUTING.md) guide for details.

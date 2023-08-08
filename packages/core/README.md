# @blockless/gateway-core

[![CI](https://github.com/blocklessnetwork/gateway/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/blocklessnetwork/gateway/actions/workflows/ci.yml)

Gateway to communicate with the Blockless Network.

## Install

`npm i @blockless/gateway-core`

## Basic Usage

List functions

```ts
import Gateway from '@blockless/gateway-core'

const gateway = new Gateway({
	mongoUri: process.env.MONGO_DB_URI!,
	headNodeUri: process.env.HEAD_NODE_HOST!
})

const functions = await gateway.functions.list()
console.log(functions)
// [{ name: 'Hello World Fn', functionId: 'bafybefgibuxruy...' }]
```

Invoke a function

```ts
import Gateway from '@blockless/gateway-core'

const gateway = new Gateway({
	mongoUri: process.env.MONGO_DB_URI!,
	headNodeUri: process.env.HEAD_NODE_HOST!
})

const domain = 'hello-world-fn.bls.xyz'
const response = await gateway.functions.invoke('domain', domain)
console.log(response)
// { code: 200, headers: [], type: 'text/html', body: 'Hello World' }
```

## Documentation

For the latest documentation, visit [Blockless Docs](https://blockless.network/docs)

## Contributing

Refer to the [CONTRIBUTING.md](/CONTRIBUTING.md) guide for details.

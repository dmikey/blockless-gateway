# Blockless Gateway

```
└── / (GET, HEAD)
    / (GET) {"host":{}}
    ├── health (GET, HEAD)
    ├── invoke/
    │   └── :path (GET, HEAD)
    └── api/v1/
        ├── auth/
        │   ├── login (GET, HEAD)
        │   ├── challenge (POST)
        │   ├── sign (POST)
        │   └── verify (GET, HEAD)
        ├── functions (GET, HEAD, POST)
        │   └── / (GET, HEAD, POST)
        │       └── :id (GET, HEAD, PATCH, DELETE)
        └── sites (GET, HEAD, POST)
            └── / (GET, HEAD, POST)
                └── :id (GET, HEAD, PATCH, DELETE)
```

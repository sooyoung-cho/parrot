# Parrot

<img src="./partyparrot.gif" width="100">

A server that records API response stubs and serves statically.


## Usage

### Record
1. Add endpoints you want to record to `data.json`. 
2. (Optional) Create `.env` file and assign a value for `CACHE_ROOT_PATH`. The stubs will be stored assigned directory. (Default: `.cache`)
3. Then run recorder.
```bash
$ yarn record
```

### Serve
```
$ yarn serve
```


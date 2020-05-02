CLANG ?= /opt/wasi-sdk/bin/clang

WASMOPT ?= $(shell which wasm-opt)
WASM2JS ?= $(shell pwd)/node_modules/.bin/wasm2js

ifeq ($(CC),cc)
	CC = $(CLANG)
endif

ifeq ($(CC),gcc)
	CC = $(CLANG)
endif

ZZ ?= $(shell which zz)
SRC = $(wildcard src/*.zz)
TARGET = base64.wasm

CFLAGS += --target=wasm32-unknown-unknown # WASM clang target
CFLAGS += -nostdlib # disable stdlib

LDFLAGS += -Wl,--export-dynamic # export all dynamic symbols, like functions
LDFLAGS += -Wl,--export-all # export all symbols so we get access to __heap_base, etc
LDFLAGS += -Wl,--import-memory # import memory from runtime
LDFLAGS += -Wl,--no-entry # don't look for a _start function
LDFLAGS += -nostartfiles # no startup files

ZZFLAGS += --release

export CC
export CFLAGS
export LDFLAGS

.PHONY: target

build: $(TARGET) base64.js

$(TARGET): $(SRC)
	$(ZZ) build $(ZZFLAGS)
	cp target/release/lib/libbase64.so $@
ifneq ($(WASMOPT),)
	$(WASMOPT) -Oz $@ -o $@
endif

base64.js: $(TARGET)
	$(WASM2JS) $(TARGET) -o $@

clean:
	$(ZZ) clean
	$(RM) base64.js $(TARGET)

test: base64.js
	npm t

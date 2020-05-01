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

ZZFLAGS += --release

export CC

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

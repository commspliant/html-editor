.PHONY: install dev build build-lib build-playground preview test storybook publish

install:
	npm install

dev:
	npm run dev

build:
	npm run build

build-lib:
	npm run build:lib

build-playground:
	npm run build:playground

preview:
	npm run preview

test:
	npm test

storybook:
	npm run storybook

publish: build-lib
	npm publish

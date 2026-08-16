.PHONY: install dev build build-playground preview test storybook

install:
	npm install

dev:
	npm run dev

build:
	npm run build

build-playground:
	npm run build:playground

preview:
	npm run preview

test:
	npm test

storybook:
	npm run storybook

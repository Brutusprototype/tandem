Tandem is a component editor designed for most web platforms. The editor is still pre-Alpha, but you can kick the tires around a bit by following the [development instructions below](#development).

## Development

Run:

```
git clone git@github.com:crcn/tandem.git;
cd tandem;
yarn install;
```

Then run:

```
npm run build-watch;
```

👆🏻 This will start build processes for _all_ packages. Finally, run:

```
npm run design-front-end;
```

👆🏻 To start building Tandem in Tandem.

#### Development scripts


```
npm run build-watch; # build & watch all packages
npm run design-front-end; # start Tandem for front-end
npm run build-desktop-dist; # build desktop app
```

# gatsby-plugin-swarm

Adds support for deploying [Gatsby](https://www.gatsbyjs.org/) websites to [Swarm](https://ethersphere.github.io/swarm-home/) and [IPFS](https://ipfs.io/) by ensuring that assets are relative.

This plugin is a modified version of [gatsby-plugin-ipfs](https://github.com/moxystudio/gatsby-plugin-ipfs/) to add support for deploy on Swarm.


## Usage

Set `prefixPath` to an arbitrary string (eg: `__PATH_PREFIX__`) and include the plugin in your `gatsby-config.js` file.
 - Also make sure to add the option `prefix` set equal to the pathPrefix.
 - The option `pattern` should match the swarm/ipfs path prefix

```js
module.exports = {
  pathPrefix: '__PATH_PREFIX__',
  plugins: [
    {
      resolve: `gatsby-plugin-swarm`,
      options: {
        prefix: `__PATH_PREFIX__`,
        pattern: /^(\/bzz:\/[^/]+)/ // use /^(\/(?:ipfs|ipns)\/[^/]+)/ for IPFS
      },
    },
  ],
};
```

## Options
| Option                | Example              | Description                                                                                                                    |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `prefix`              | `"__PATH_PREFIX__"`  | The name of the path prefix set in the `gatsby-config.js` file.                                                                |
| `pattern`             | `/^(\/bzz:\/[^/]+)/` | The pattern of the Swarm/Ipfs subpath.                                                                                         |
| `forceTrailingSlash`  | `true`               | Redirect `/<path>`  to `/<path>/` when trailing slash is missing. (optional)                                                   |
| `useBasename`         | `true`               | Replace the relative paths (`../example`) with the current Swarm/Ipfs path after page load. (`/bzz:/hash/example`). (optional) |

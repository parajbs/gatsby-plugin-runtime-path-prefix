const {
  injectScriptsInHtmlFiles,
  relativizeHtmlFiles,
  relativizeJsContentFiles,
  relativizeMiscAssetFiles
} = require("./path-fixers")

exports.onPreBootstrap = ({ store, reporter }) => {
  const { config, program } = store.getState()

  if (program.prefixPaths) {
    const plugin = config.plugins.find(plugin => ("resolve" in plugin) && plugin.resolve === "gatsby-plugin-swarm")
    const { options: { prefix, pattern } } = plugin

    if (!config.pathPrefix || config.pathPrefix === "") {
      reporter.panic(`You must set the prefix option in your gatsby-config.js file`)
    }

    if (!prefix || prefix === "") {
      reporter.panic(`You must set the prefix option in gatsby-plugin-swarm options`)
    }
    if (!pattern || pattern === "") {
      reporter.panic(`You must set the pattern option in gatsby-plugin-swarm options`)
    }
  }
}

exports.onPostBuild = async (nodeOptions) => {
  const { store } = nodeOptions
  const { config, program } = store.getState()

  const plugin = config.plugins.find(plugin => ("resolve" in plugin) && plugin.resolve === "gatsby-plugin-swarm")
  const { options } = plugin
  const { prefix, pattern, forceTrailingSlash, useBasename } = options

  if (program.prefixPaths) {
    await relativizeHtmlFiles(prefix, forceTrailingSlash)
    await relativizeMiscAssetFiles(prefix)
    await relativizeJsContentFiles(prefix)
    await injectScriptsInHtmlFiles(prefix, pattern, forceTrailingSlash, useBasename)
  }
}

const fs = require('fs');

const path = require('path');

const util = require('util');

const pMap = require('p-map');

const globby = require('globby');

const isTextPath = require('is-text-path');

const UglifyJS = require("uglify-js");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const TRANSFORM_CONCURRENCY = 10;
/**
 * Get the relative path based on path depth
 *
 * @param {string} path Assets path
 * @returns {string}
 */

const getRelativePrefix = path => {
  const depth = path.split('/').length - 2;
  const relativePrefix = depth > 0 ? '../'.repeat(depth) : './';
  return relativePrefix;
};
/**
 * Replace all the path prefix strings with the correct
 * relative paths inside the HTML files.
 *
 * @param {string} prefix Path prefix to replace
 * @param {boolean} forceTrailingSlash Add a trailing slash to a tag links if missing
 */


const relativizeHtmlFiles = async (prefix, forceTrailingSlash = false) => {
  let paths = await globby(['public/**/*.html']);
  await pMap(paths, async path => {
    const buffer = await readFileAsync(path);
    let pageContent = buffer.toString();
    const relativePrefix = getRelativePrefix(path); // Fix relative paths

    pageContent = pageContent.replace(/url\(\.\/static/g, `url(${relativePrefix}/static`); // Fix trailing slash

    if (forceTrailingSlash) {
      pageContent = pageContent.replace(/<\s*a[^>]*>.*?<\s*\/\s*a>/g, match => {
        const tag = match.replace(/href=\"(.*?)\"/, (match, g1) => {
          const link = g1.replace(/(\/$|$)/, "/");
          return match.replace(g1, link);
        });
        return tag;
      });
    } // Fix base html file


    const pattern = new RegExp(`\/${prefix}\/`, "g");
    let content = pageContent.replace(pattern, relativePrefix);
    await writeFileAsync(path, content);
  }, {
    concurrency: TRANSFORM_CONCURRENCY
  });
};
/**
 * Replace all the path prefix strings with the global variable
 * named as the path prefix
 *
 * @param {string} prefix Path prefix to replace
 */


const relativizeJsContentFiles = async prefix => {
  const paths = await globby(['public/**/*.js']);
  await pMap(paths, async path => {
    const buffer = await readFileAsync(path);
    let contents = buffer.toString(); // Skip if there's nothing to do

    if (!contents.includes(prefix)) {
      return;
    }

    const pattern1 = new RegExp(`["']\/${prefix}['"]`, "g");
    const pattern2 = new RegExp(`(["'])\/${prefix}\/([^'"]*?)(['"])`, "g");
    contents = contents.replace(pattern1, ` ${prefix} `).replace(pattern2, (matches, g1, g2, g3) => ` ${prefix} + ${g1}/${g2}${g3}`);
    contents = contents.replace(/load \\ /g, 'load " + ');
    contents = `if(typeof ${prefix} === 'undefined'){${prefix}=''}${contents}`;
    await writeFileAsync(path, contents);
  }, {
    concurrency: TRANSFORM_CONCURRENCY
  });
};
/**
 * Replace all the path prefix strings with the correct
 * relative paths inside the HTML and JS files.
 *
 * @param {string} prefix Path prefix to replace
 */


const relativizeMiscAssetFiles = async prefix => {
  const paths = await globby(['public/**/*', '!public/**/*.html', '!public/**/*.js']);
  await pMap(paths, async path => {
    // Skip if this is not a text file
    if (!isTextPath(path)) {
      return;
    }

    const buffer = await readFileAsync(path);
    let contents = buffer.toString(); // Skip if there's nothing to do

    if (!contents.includes(prefix)) {
      return;
    }

    const relativePrefix = getRelativePrefix(path);
    const pattern = new RegExp(`\/${prefix}\/`, "g");
    contents = contents.replace(pattern, relativePrefix);
    await writeFileAsync(path, contents);
  }, {
    concurrency: TRANSFORM_CONCURRENCY
  });
};
/**
 * Inject a JS file that sets a global variable
 * with the path prefix name
 *
 * @param {string} prefix Path prefix to set
 * @param {string} pattern Regex pattern that matches the swarm/ipfs prefix
 * @param {boolean} forceTrailingSlash Redirect to <path>/ if trailing slash is missing
 * @param {boolean} useBasenamePrefix Replace prefix with basename path instead of relative paths
 */


const injectScriptsInHtmlFiles = async (prefix, pattern, forceTrailingSlash, useBasenamePrefix) => {
  const scriptBuffer = await readFileAsync(path.resolve(__dirname, 'runtime/head-prefix.js'));
  const scriptContents = UglifyJS.minify(scriptBuffer.toString().replace(/__PATH_PREFIX__/g, prefix).replace(/__PATTERN__/g, pattern).replace(/__FORCE_TRAILING_SLASH__/g, forceTrailingSlash ? "true" : "false")).code;
  let basenameFixContent = "";

  if (useBasenamePrefix) {
    const basenameFixBuffer = await readFileAsync(path.resolve(__dirname, 'runtime/basename-prefix.js'));
    basenameFixContent = UglifyJS.minify(basenameFixBuffer.toString().replace(/__PATH_PREFIX__/g, prefix)).code;
  }

  const paths = await globby(['public/**/*.html']);
  await pMap(paths, async path => {
    let contents = await readFileAsync(path);
    contents = contents.toString().replace(/<head>/, `<head><script>${scriptContents}</script>`);

    if (useBasenamePrefix) {
      contents = contents.replace(/<\/body>/, `<script>${basenameFixContent}</script></body>`);
    }

    await writeFileAsync(path, contents);
  }, {
    concurrency: TRANSFORM_CONCURRENCY
  });
};

exports.relativizeHtmlFiles = relativizeHtmlFiles;
exports.relativizeMiscAssetFiles = relativizeMiscAssetFiles;
exports.relativizeJsContentFiles = relativizeJsContentFiles;
exports.injectScriptsInHtmlFiles = injectScriptsInHtmlFiles;
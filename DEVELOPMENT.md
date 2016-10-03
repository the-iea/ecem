# Development guide

## Introduction

The ECEM demonstrator is made up of two parts:

1. Preprocessing scripts written in Python
2. Web application written in JavaScript/HTML5/CSS

Data that should be displayed on the website is initially provided by the project team as
[CSV](https://en.wikipedia.org/wiki/Comma-separated_values) and [shapefiles](https://en.wikipedia.org/wiki/Shapefile),
see the `preprocess/data` folder.
The preprocessing scripts transform these files into [CovJSON](https://covjson.org), [GeoJSON](http://geojson.org),
and JavaScript files, respectively, see the `public/app/data` folder.
The two main reasons for this transformation are to reduce data volume and simplify web application development.
See the <preprocess/README.md> file for details on the preprocessing scripts.

The web application is written in [ECMAScript 2015](https://babeljs.io/docs/learn-es2015/)
with the help of the [jspm package manager](http://jspm.io/)
which allows to easily add dependencies from sources such as [npm](https://www.npmjs.com/) or GitHub repositories and
handles bundling and minification of the application for deployment. It also provides a development mode
with automatic incremental rebuilds which speeds up and simplifies development.
See the <public/README.md> file for details on the structure of the web application.

## Local development

First, clone the repository into some folder. The following instructions assume that you have done this.

### Preprocessing (only if data has changed)

An easy way to get the Python environment setup is using conda:

1. Install [Miniconda](http://conda.pydata.org/miniconda.html)
2. Create and activate the Python environment with:
```sh
$ conda create -n ecem -c https://conda.anaconda.org/conda-forge gdal=1.* python=3.*
$ activate ecem
```

Now navigate into the `preprocess/` folder and run:
```sh
python main.py
```

The script automatically copies the output files into the relevant places of the web application.

### Web application

First, install [Node.js](https://nodejs.org/) if not done already.

Then, run the following two commands inside the repository folder:

```bash
$ npm install
$ npm start
Starting up http-server, serving ./public
Available on:
  http://127.0.0.1:8095
```

Now go to <http://localhost:8095>. After a few seconds you should see the website as it would appear online.
While running in development mode, any code can be changed and a simple browser page refresh reflects that change.
Note that this flexibility is offset with slightly longer page loading times during development --
when deployed those delays will disappear as all files are bundled together and minified.

## Deployment

Currently, due to its manageable size, the website is deployed directly to [GitHub Pages](https://pages.github.com/)
as a static website. This is done by pushing the build artifacts to the `gh-pages` branch
which in turn will update the website at https://the-iea.github.io/ecem.

Follow these steps when deploying the website:

1. Clone/check-out the `gh-pages` branch into a separate folder `ecem-gh-pages` to make it easier to copy files around.
   The following steps assume you have an `ecem` and `ecem-gh-pages` folder, pointing at `master` and `gh-pages`, respectively.
2. Run `npm run build` in the `ecem` folder to create a minified bundle `bundle.min.js` containing all JavaScript and CSS code.
3. Copy `bundle.min.js` into the `ecem-gh-pages` folder.
4. If any files within the `ecem/public/app/data` or `ecem/public/app/img` folders were updated then copy those files
   to the `ecem-gh-pages/app/data` or `ecem-gh-pages/app/img` folders, respectively.
5. Commit and push all changes to the `gh-pages` branch within the `ecem-gh-pages` folder.
   GitHub Pages currently tells browsers to cache any website resources for 10min.
   If you still see the old version, either wait or clear your browser cache.

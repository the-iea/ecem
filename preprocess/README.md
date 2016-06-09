This folder contains Python scripts which preprocess data for use in the web application.

# How to run

An easy way to get the Python environment setup installed is using conda.

## Step 1: Install Miniconda

http://conda.pydata.org/miniconda.html

## Step 2: Create Python environment

```sh
$ conda install -c https://conda.anaconda.org/conda-forge gdal=1.*
$ activate ecem
``` 

## Step 3: Run preprocess script

```sh
python main.py
```

The script automatically copies the output files into the relevant places of the web application.